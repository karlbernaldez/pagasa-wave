import { spawnSync } from 'node:child_process';
import { getChangedFiles } from './changed-files.mjs';

const mode = process.argv[2];
const definitions = {
  eslint: {
    extensions: new Set(['.cjs', '.js', '.jsx', '.mjs']),
    executable: 'eslint',
    prefix: [],
  },
  prettier: {
    extensions: new Set(['.cjs', '.css', '.js', '.json', '.jsx', '.md', '.mjs', '.yaml', '.yml']),
    executable: 'prettier',
    prefix: ['--check'],
  },
};

const definition = definitions[mode];
if (!definition) {
  console.error(`Unknown changed-file check: ${mode || '(missing)'}`);
  process.exit(2);
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

const executable =
  process.platform === 'win32'
    ? `node_modules/.bin/${definition.executable}.cmd`
    : `node_modules/.bin/${definition.executable}`;

for (let index = 0; index < files.length; index += 100) {
  const chunk = files.slice(index, index + 100);
  const result = spawnSync(executable, [...definition.prefix, ...chunk], {
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
