import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

function git(args, options = {}) {
  return execFileSync('git', args, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });
}

function commitExists(ref) {
  if (!ref || /^0+$/.test(ref)) return false;

  try {
    git(['cat-file', '-e', `${ref}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function mergeBase(left, right) {
  try {
    return git(['merge-base', left, right]).trim();
  } catch {
    return '';
  }
}

function getLocalFallbackBase(head) {
  for (const ref of ['origin/dev', 'origin/main']) {
    const base = mergeBase(head, ref);
    if (commitExists(base)) return base;
  }

  return `${head}^`;
}

export function getComparisonRange() {
  const head = process.env.QUALITY_HEAD_SHA || process.env.GITHUB_SHA || 'HEAD';
  let base = process.env.QUALITY_BASE_SHA;

  if (!commitExists(base)) base = getLocalFallbackBase(head);

  return commitExists(base) && commitExists(head) ? { base, head } : null;
}

export function getChangedFiles() {
  const range = getComparisonRange();

  let output;
  if (range) {
    output = git([
      'diff',
      '--name-only',
      '--no-renames',
      '--diff-filter=ACMRTUXB',
      range.base,
      range.head,
    ]);
  } else {
    console.warn('A usable comparison base was not available; checking all tracked files.');
    output = git(['ls-files']);
  }

  return [...new Set(output.split(/\r?\n/u).filter(Boolean))].filter((file) => existsSync(file));
}
