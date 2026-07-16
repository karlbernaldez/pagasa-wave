import fs from 'fs';
import path from 'path';
import { Writable } from 'stream';
import winston from 'winston';
import 'winston-daily-rotate-file';

const logDir = path.join(process.cwd(), 'logs');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const DISCORD_WEBHOOK_URL = process.env.BACKEND_ERROR_DISCORD_WEBHOOK_URL?.trim();
const DISCORD_ALERT_COOLDOWN_MS = Number.parseInt(
  process.env.BACKEND_ERROR_DISCORD_COOLDOWN_MS || '300000',
  10
);
const DISCORD_ALERT_TIMEOUT_MS = Number.parseInt(
  process.env.BACKEND_ERROR_DISCORD_TIMEOUT_MS || '10000',
  10
);
const recentDiscordAlerts = new Map();
const sensitiveKeyPattern = /password|passwd|secret|token|authorization|cookie|api[_-]?key|mongo[_-]?uri|redis[_-]?url|webhook/i;

function redactString(value) {
  return value
    .replace(/mongodb(?:\+srv)?:\/\/([^:@/\s]+):([^@/\s]+)@/gi, 'mongodb://$1:[REDACTED]@')
    .replace(/(authorization\s*[:=]\s*)([^\s,}]+)/gi, '$1[REDACTED]')
    .replace(/(bearer\s+)[a-z0-9._~+\/-]+=*/gi, '$1[REDACTED]');
}

function redactValue(value, seen = new WeakSet()) {
  if (typeof value === 'string') return redactString(value);
  if (value === null || typeof value !== 'object') return value;
  if (seen.has(value)) return '[Circular]';

  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, seen));
  }

  return Object.fromEntries(
    Object.entries(value).map(([key, nestedValue]) => [
      key,
      sensitiveKeyPattern.test(key) ? '[REDACTED]' : redactValue(nestedValue, seen)
    ])
  );
}

function pruneExpiredAlerts(now) {
  for (const [key, timestamp] of recentDiscordAlerts.entries()) {
    if (now - timestamp >= DISCORD_ALERT_COOLDOWN_MS) {
      recentDiscordAlerts.delete(key);
    }
  }
}

function shouldSendDiscordAlert(info) {
  const now = Date.now();
  pruneExpiredAlerts(now);

  const fingerprint = `${info.message || 'Backend error'}\n${info.stack || ''}`.slice(0, 1500);
  const previous = recentDiscordAlerts.get(fingerprint);

  if (previous && now - previous < DISCORD_ALERT_COOLDOWN_MS) {
    return false;
  }

  recentDiscordAlerts.set(fingerprint, now);
  return true;
}

function buildDiscordPayload(rawInfo) {
  const info = redactValue(rawInfo);
  const message = String(info.message || 'Unhandled backend error').slice(0, 500);
  const stack = String(info.stack || '').slice(0, 2500);
  const metadata = { ...info };

  delete metadata.level;
  delete metadata.message;
  delete metadata.stack;
  delete metadata.timestamp;
  delete metadata[Symbol.for('level')];
  delete metadata[Symbol.for('message')];
  delete metadata[Symbol.for('splat')];

  const metadataText = Object.keys(metadata).length
    ? JSON.stringify(metadata, null, 2).slice(0, 1500)
    : '';

  const descriptionParts = [message];
  if (stack) descriptionParts.push(`\n\`\`\`text\n${stack}\n\`\`\``);
  if (metadataText) descriptionParts.push(`\nMetadata:\n\`\`\`json\n${metadataText}\n\`\`\``);

  return {
    username: 'WaveLab Backend Monitor',
    allowed_mentions: { parse: [] },
    embeds: [
      {
        title: '🚨 WaveLab backend error',
        description: descriptionParts.join('').slice(0, 4000),
        color: 15158332,
        timestamp: info.timestamp || new Date().toISOString(),
        footer: {
          text: `${process.env.NODE_ENV || 'unknown'} · ${process.env.HOSTNAME || 'vote3'}`
        }
      }
    ]
  };
}

async function postDiscordAlert(info) {
  if (!DISCORD_WEBHOOK_URL || !shouldSendDiscordAlert(info)) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DISCORD_ALERT_TIMEOUT_MS);

  try {
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildDiscordPayload(info)),
      signal: controller.signal
    });

    if (!response.ok) {
      process.stderr.write(
        `[discord-error-alert] webhook returned HTTP ${response.status}\n`
      );
    }
  } catch (error) {
    process.stderr.write(
      `[discord-error-alert] failed to deliver alert: ${error?.message || 'unknown error'}\n`
    );
  } finally {
    clearTimeout(timeout);
  }
}

const transports = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'app-%DATE%.log'),
    datePattern: 'YYYY-MM-DD',
    maxFiles: '14d'
  }),
  new winston.transports.DailyRotateFile({
    filename: path.join(logDir, 'error-%DATE%.log'),
    level: 'error',
    datePattern: 'YYYY-MM-DD',
    maxFiles: '30d'
  })
];

if (DISCORD_WEBHOOK_URL) {
  const discordStream = new Writable({
    objectMode: true,
    write(info, _encoding, callback) {
      void postDiscordAlert(info);
      callback();
    }
  });

  transports.push(
    new winston.transports.Stream({
      stream: discordStream,
      level: 'error'
    })
  );
}

export const logger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports
});
