import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const issueTemplateDir = '.github/ISSUE_TEMPLATE';
const failures = [];

function fail(file, message) {
  failures.push(`${file}: ${message}`);
}

function parseIssueForm(file, content) {
  if (!/^name:\s*\S+/mu.test(content)) fail(file, 'missing top-level name.');
  if (!/^description:\s*\S+/mu.test(content)) fail(file, 'missing top-level description.');
  if (!/^body:\s*$/mu.test(content)) fail(file, 'missing top-level body.');

  const itemStarts = [...content.matchAll(/^\s{2}- type:\s*(\S+)\s*$/gmu)];
  const allowedTypes = new Set(['markdown', 'input', 'textarea', 'dropdown', 'checkboxes']);
  const ids = new Set();
  let itemCount = 0;

  for (const [index, match] of itemStarts.entries()) {
    itemCount += 1;
    const type = match[1];
    const start = match.index + match[0].length;
    const end = itemStarts[index + 1]?.index ?? content.length;
    const block = content.slice(start, end);

    if (!allowedTypes.has(type)) fail(file, `unsupported issue-form item type "${type}".`);

    if (type === 'markdown') {
      if (!/^\s{4}attributes:\s*$/mu.test(block) || !/^\s{6}value:\s*/mu.test(block)) {
        fail(file, 'markdown item must define attributes.value.');
      }
      continue;
    }

    const idMatch = block.match(/^\s{4}id:\s*([A-Za-z0-9_-]+)\s*$/mu);
    if (!idMatch) {
      fail(file, `${type} item is missing an id.`);
    } else if (ids.has(idMatch[1])) {
      fail(file, `duplicate issue-form id "${idMatch[1]}".`);
    } else {
      ids.add(idMatch[1]);
    }

    if (!/^\s{4}attributes:\s*$/mu.test(block)) {
      fail(file, `${type} item must define attributes.`);
    }
    if (!/^\s{6}label:\s*\S+/mu.test(block)) {
      fail(file, `${type} item must define attributes.label.`);
    }
    if (type === 'dropdown' && !/^\s{6}options:\s*$/mu.test(block)) {
      fail(file, 'dropdown item must define attributes.options.');
    }
  }

  if (itemCount === 0) fail(file, 'body contains no recognized issue-form items.');
}

let files = [];
try {
  files = readdirSync(issueTemplateDir)
    .filter((file) => /\.ya?ml$/iu.test(file))
    .map((file) => join(issueTemplateDir, file));
} catch {
  // ISSUE_TEMPLATE is optional; if it exists in a future branch, its YAML files are validated here.
}

for (const file of files) {
  const content = readFileSync(file, 'utf8');
  parseIssueForm(file, content);
}

if (files.length === 0) {
  console.log('No GitHub issue-form YAML files found.');
} else {
  const fileNames = files.map((file) => basename(file));
  console.log(`Validated ${files.length} GitHub issue-form file(s): ${fileNames.join(', ')}`);
}

if (failures.length > 0) {
  for (const message of failures) console.error(`ERROR: ${message}`);
  process.exit(1);
}
