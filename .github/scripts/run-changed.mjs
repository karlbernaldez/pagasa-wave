import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { getChangedFiles } from './changed-files.mjs';

const require = createRequire(import.meta.url);

const mode = process.argv[2];
const definitions = {
  eslint: {
    extensions: new Set(['.cjs', '.js', '.jsx', '.mjs']),
    packageName: 'eslint',
    executable: 'eslint',
    prefix: [],
  },
  prettier: {
    extensions: new Set([
      '.cjs',
      '.css',
      '.js',
      '.json',
      '.jsx',
      '.md',
      '.mjs',
      '.yaml',
      '.yml',
    ]),
    packageName: 'prettier',
    executable: 'prettier',
    prefix: ['--check'],
  },
};

const definition = definitions[mode];
if (!definition) {
  console.error(`Unknown changed-file check: ${mode || '(missing)'}`);
  process.exit(2);
}

function resolvePackageCli({ packageName, executable }) {
  const packageJsonPath = require.resolve(`${packageName}/package.json`);
  const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
  const bin =
    typeof packageJson.bin === 'string' ? packageJson.bin : packageJson.bin?.[executable];

  if (!bin) {
    throw new Error(`Unable to resolve ${executable} CLI from ${packageName}/package.json`);
  }

  return resolve(dirname(packageJsonPath), bin);
}

const files = getChangedFiles().filter((file) => {
  const dot = file.lastIndexOf('.');
  return dot >= 0 && definition.extensions.has(file.slice(dot).toLowerCase());
});

if (files.length === 0) {
  console.log(`No changed files require ${mode}.`);
  process.exit(0);
}

console.log(`Running ${mode} on ${files.length} changed file(s).`);

const cliPath = resolvePackageCli(definition);

for (let index = 0; index < files.length; index += 100) {
  const chunk = files.slice(index, index + 100);
  const result = spawnSync(process.execPath, [cliPath, ...definition.prefix, ...chunk], {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
