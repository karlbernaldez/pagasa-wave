import fs from 'node:fs';

const path = 'backend/controllers/projectController.js';
let source = fs.readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

function replaceOnce(input, search, replacement, label) {
  const first = input.indexOf(search);
  if (first < 0) throw new Error(`Missing expected marker: ${label}`);
  if (input.indexOf(search, first + search.length) >= 0) {
    throw new Error(`Expected one marker but found multiple: ${label}`);
  }
  return input.replace(search, replacement);
}

function updateFunction(exportName) {
  const startMarker = `export const ${exportName} = asyncHandler(async (req, res) => {`;
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing function: ${exportName}`);

  const nextExport = source.indexOf('\nexport const ', start + startMarker.length);
  const end = nextExport < 0 ? source.length : nextExport;
  let block = source.slice(start, end);

  block = replaceOnce(
    block,
    '  const previousStatus = project.status;\n',
    '  const previousStatus = project.status;\n  const expectedUpdatedAt = project.updatedAt;\n',
    `${exportName} previousStatus`
  );

  block = replaceOnce(
    block,
    '  await project.save();\n',
    "  await saveProjectSnapshot(project, {\n    expectedStatus: previousStatus,\n    expectedUpdatedAt,\n    conflictMessage:\n      'Project workflow changed while this operation was in progress. Reload and try again.',\n  });\n",
    `${exportName} save`
  );

  source = source.slice(0, start) + block + source.slice(end);
}

source = replaceOnce(
  source,
  "import Project from '../models/Project.js';\n",
  "import Project from '../models/Project.js';\nimport { saveProjectSnapshot } from '../utils/projectSnapshot.js';\n",
  'project snapshot import'
);

for (const exportName of [
  'submitProject',
  'startReviewProject',
  'requestProjectRevision',
  'approveProject',
  'rejectProject',
  'markProjectNoPublication',
  'publishProject',
  'archiveProject',
]) {
  updateFunction(exportName);
}

const guardedSaveCount = (source.match(/await saveProjectSnapshot\(project, \{/g) || []).length;
if (guardedSaveCount !== 8) {
  throw new Error(`Expected 8 guarded workflow saves, found ${guardedSaveCount}`);
}

fs.writeFileSync(path, source, 'utf8');
console.log('Guarded 8 Project workflow transitions against stale saves.');
