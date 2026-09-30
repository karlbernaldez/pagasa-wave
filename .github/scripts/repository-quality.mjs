import { execFileSync } from 'node:child_process';
import { readFileSync, statSync } from 'node:fs';
import { dirname, extname, resolve } from 'node:path';
import { getChangedFiles, getComparisonRange } from './changed-files.mjs';

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

const failures = [];
const changed = getChangedFiles();
const tracked = new Set(git(['ls-files']).split(/\r?\n/u).filter(Boolean));

function fail(message) {
  failures.push(message);
}

function isTextCandidate(file) {
  return new Set([
    '.cjs',
    '.css',
    '.env',
    '.html',
    '.js',
    '.json',
    '.jsx',
    '.md',
    '.mjs',
    '.py',
    '.sh',
    '.txt',
    '.yaml',
    '.yml',
  ]).has(extname(file).toLowerCase());
}

function isAllowedEnvironmentExample(file) {
  return /(?:^|\/)(?:[^/]+\.)?env\.example$/u.test(file) || /\.env\.example$/u.test(file);
}

function checkLocalMarkdownLinks(file, content) {
  const linkPattern = /!?\[[^\]]*\]\(([^)]+)\)/gu;
  for (const match of content.matchAll(linkPattern)) {
    let destination = match[1].trim();
    if (destination.startsWith('<') && destination.includes('>')) {
      destination = destination.slice(1, destination.indexOf('>'));
    } else {
      destination = destination.split(/\s+["']/u, 1)[0];
    }

    if (!destination || /^(?:#|[a-z][a-z0-9+.-]*:|\/\/)/iu.test(destination)) continue;

    const pathOnly = destination.split('#', 1)[0].split('?', 1)[0];
    if (!pathOnly) continue;

    let decoded;
    try {
      decoded = decodeURIComponent(pathOnly);
    } catch {
      fail(`${file}: invalid percent-encoding in link ${destination}`);
      continue;
    }

    const target = resolve(dirname(file), decoded);
    try {
      statSync(target);
    } catch {
      fail(`${file}: local Markdown link target does not exist: ${destination}`);
    }
  }
}

if (!tracked.has('frontend/package-lock.json')) {
  fail('frontend/package-lock.json must remain tracked.');
}
if (tracked.has('frontend/pnpm-lock.yaml')) {
  fail('frontend/pnpm-lock.yaml is tracked; the frontend package manager is npm only.');
}
if (!tracked.has('backend/package-lock.json')) {
  fail('backend/package-lock.json must remain tracked.');
}
if (!tracked.has('package-lock.json')) {
  fail('The repository quality-tool package-lock.json must remain tracked.');
}

for (const file of changed) {
  const lower = file.toLowerCase();
  const basename = lower.slice(lower.lastIndexOf('/') + 1);

  if (
    ((basename === '.env' || basename.startsWith('.env.')) &&
      !isAllowedEnvironmentExample(lower)) ||
    /\.(?:key|p12|pfx|pem)$/u.test(lower) ||
    /(?:^|\/)(?:dump|backup)(?:\/|\.|$)/u.test(lower)
  ) {
    fail(`${file}: sensitive environment, key, certificate, dump, or backup files are prohibited.`);
  }

  const size = statSync(file).size;
  if (size > 5 * 1024 * 1024) {
    fail(
      `${file}: changed tracked file exceeds 5 MiB; document and use an approved artifact path.`
    );
    continue;
  }

  if (!isTextCandidate(file)) continue;
  const content = readFileSync(file, 'utf8');

  if (/^(?:<{7}|={7}|>{7})/mu.test(content)) {
    fail(`${file}: unresolved merge-conflict marker detected.`);
  }
  if (/-----BEGIN (?:[A-Z ]+ )?PRIVATE KEY-----/u.test(content)) {
    fail(`${file}: private-key material detected.`);
  }
  if (/\bAKIA[0-9A-Z]{16}\b/u.test(content)) {
    fail(`${file}: possible AWS access key detected.`);
  }
  if (/\bgh[pousr]_[A-Za-z0-9_]{30,}\b/u.test(content)) {
    fail(`${file}: possible GitHub token detected.`);
  }

  if (extname(file).toLowerCase() === '.json') {
    try {
      JSON.parse(content);
    } catch (error) {
      fail(`${file}: invalid JSON (${error.message}).`);
    }
  }

  if (extname(file).toLowerCase() === '.md') {
    checkLocalMarkdownLinks(file, content);
  }
}

try {
  const range = getComparisonRange();
  const args = range ? ['diff', '--check', range.base, range.head] : ['diff', '--check'];
  git(args);
} catch (error) {
  fail(`Git whitespace check failed:\n${error.stderr || error.message}`);
}

for (const message of failures) console.error(`ERROR: ${message}`);

if (failures.length > 0) {
  console.error(`Repository quality checks failed with ${failures.length} issue(s).`);
  process.exit(1);
}

console.log(`Repository quality checks passed for ${changed.length} changed file(s).`);
