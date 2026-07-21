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

export function getChangedFiles() {
  const base = process.env.QUALITY_BASE_SHA;
  const head = process.env.QUALITY_HEAD_SHA || process.env.GITHUB_SHA || 'HEAD';

  let output;
  if (commitExists(base) && commitExists(head)) {
    output = git(['diff', '--name-only', '--no-renames', '--diff-filter=ACMRTUXB', base, head]);
  } else {
    console.warn('A usable comparison base was not available; checking all tracked files.');
    output = git(['ls-files']);
  }

  return [...new Set(output.split(/\r?\n/u).filter(Boolean))].filter((file) => existsSync(file));
}
