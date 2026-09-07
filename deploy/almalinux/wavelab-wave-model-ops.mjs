#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

if (process.getuid?.() !== 0) {
  console.error('This helper must run as root.');
  process.exit(77);
}

const MODELS = Object.freeze({
  WW3: { timer: 'wavelab-ww3-package-builder.timer' },
  ECWAM: { timer: 'wavelab-ecwam-package-builder.timer' },
});
const DEFAULT_SCHEDULE = Object.freeze({ mode: 'interval', everyMinutes: 60 });
const DROPIN_ROOT = '/etc/systemd/system';
const STATE_ROOT = '/etc/wavelab/wave-model-schedules';
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
const TIMEZONE_RE = /^[A-Za-z0-9_+\-/]+$/;

const fail = (message, code = 64) => {
  console.error(message);
  process.exit(code);
};

const modelCode = String(process.argv[3] || '').trim().toUpperCase();
const config = MODELS[modelCode];
if (!config) fail('Unsupported wave model.');

const normalizeSchedule = (raw) => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('Invalid schedule payload.');
  const mode = String(raw.mode || '').trim().toLowerCase();
  if (mode === 'interval') {
    const everyMinutes = Number(raw.everyMinutes);
    if (!Number.isInteger(everyMinutes) || everyMinutes < 15 || everyMinutes > 1440) {
      fail('Interval must be from 15 to 1440 minutes.');
    }
    return { mode, everyMinutes };
  }
  if (mode === 'daily') {
    if (!Array.isArray(raw.times) || raw.times.length < 1 || raw.times.length > 8) {
      fail('Daily schedule must contain 1 to 8 times.');
    }
    const times = [...new Set(raw.times.map((value) => String(value || '').trim()))].sort();
    if (times.some((time) => !TIME_RE.test(time))) fail('Invalid daily time.');
    const timezone = String(raw.timezone || '').trim();
    if (!timezone || !TIMEZONE_RE.test(timezone)) fail('Invalid timezone.');
    try {
      new Intl.DateTimeFormat('en-US', { timeZone: timezone }).format(new Date());
    } catch {
      fail('Invalid timezone.');
    }
    return { mode, times, timezone };
  }
  fail('Unsupported schedule mode.');
};

const statePath = path.join(STATE_ROOT, `${modelCode.toLowerCase()}.json`);
const dropinDir = path.join(DROPIN_ROOT, `${config.timer}.d`);
const dropinPath = path.join(dropinDir, 'wavelab-admin-schedule.conf');

const writeAtomic = (target, content, mode = 0o644) => {
  const temporary = `${target}.tmp-${process.pid}`;
  writeFileSync(temporary, content, { encoding: 'utf8', mode });
  renameSync(temporary, target);
};

const readState = () => {
  if (!existsSync(statePath)) return { managed: false, schedule: DEFAULT_SCHEDULE };
  try {
    return { managed: true, schedule: normalizeSchedule(JSON.parse(readFileSync(statePath, 'utf8'))) };
  } catch {
    fail('Stored schedule state is invalid.', 70);
  }
};

const renderDropin = (schedule) => {
  const lines = [
    '[Timer]',
    'OnBootSec=',
    'OnActiveSec=',
    'OnUnitActiveSec=',
    'OnCalendar=',
    'RandomizedDelaySec=0',
  ];
  if (schedule.mode === 'interval') {
    lines.push(`OnActiveSec=${schedule.everyMinutes}min`);
    lines.push(`OnUnitActiveSec=${schedule.everyMinutes}min`);
  } else {
    for (const time of schedule.times) {
      lines.push(`OnCalendar=*-*-* ${time}:00 ${schedule.timezone}`);
    }
  }
  return `${lines.join('\n')}\n`;
};

const reloadManager = () => execFileSync('/usr/bin/systemctl', ['daemon-reload'], { stdio: 'ignore' });
const action = String(process.argv[2] || '').trim();

if (action === 'status') {
  process.stdout.write(`${JSON.stringify(readState())}\n`);
  process.exit(0);
}

if (action === 'set-schedule') {
  let parsed;
  try {
    parsed = JSON.parse(String(process.argv[4] || ''));
  } catch {
    fail('Schedule payload must be JSON.');
  }
  const schedule = normalizeSchedule(parsed);
  mkdirSync(STATE_ROOT, { recursive: true, mode: 0o755 });
  mkdirSync(dropinDir, { recursive: true, mode: 0o755 });
  writeAtomic(dropinPath, renderDropin(schedule));
  writeAtomic(statePath, `${JSON.stringify(schedule)}\n`);
  reloadManager();
  process.stdout.write(`${JSON.stringify({ managed: true, schedule })}\n`);
  process.exit(0);
}

if (action === 'enable') {
  execFileSync('/usr/bin/systemctl', ['enable', '--now', config.timer], { stdio: 'ignore' });
  process.stdout.write(`${JSON.stringify({ enabled: true })}\n`);
  process.exit(0);
}

if (action === 'disable') {
  execFileSync('/usr/bin/systemctl', ['disable', '--now', config.timer], { stdio: 'ignore' });
  process.stdout.write(`${JSON.stringify({ enabled: false })}\n`);
  process.exit(0);
}

if (action === 'restore-schedule') {
  rmSync(dropinPath, { force: true });
  rmSync(statePath, { force: true });
  reloadManager();
  process.stdout.write(`${JSON.stringify({ managed: false, schedule: DEFAULT_SCHEDULE })}\n`);
  process.exit(0);
}

fail('Unsupported operation.');
