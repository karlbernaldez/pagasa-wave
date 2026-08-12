import fs from 'node:fs';

function replaceOnce(source, search, replacement, label) {
  const first = source.indexOf(search);
  if (first < 0) throw new Error(`Missing expected marker: ${label}`);
  if (source.indexOf(search, first + search.length) >= 0)
    throw new Error(`Expected one marker but found multiple: ${label}`);
  return source.replace(search, replacement);
}

function removeRange(source, startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  if (start < 0) throw new Error(`Missing start marker: ${label}`);
  const end = source.indexOf(endMarker, start);
  if (end < 0) throw new Error(`Missing end marker: ${label}`);
  return source.slice(0, start) + source.slice(end);
}

const packageControllerPath = 'backend/controllers/forecastPackageController.js';
let packageController = fs.readFileSync(packageControllerPath, 'utf8');

packageController = replaceOnce(
  packageController,
  '  buildForecastChartProjectName,\n',
  '',
  'remove unused buildForecastChartProjectName import'
);
packageController = replaceOnce(
  packageController,
  "import { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';\n",
  "import { applyForecastPackageDisplayNames } from '../utils/forecastPackageDisplayNames.js';\nimport { saveForecastPackageSnapshot } from '../utils/forecastPackageSnapshot.js';\n",
  'add display-name helper import'
);
packageController = replaceOnce(
  packageController,
  "const AUTO_PACKAGE_NAME_PATTERN = /^Marine Forecast \\d{4}-\\d{2}-\\d{2}$/;\nconst AUTO_CHART_NAME_PATTERN = /^Marine Forecast \\d{4}-\\d{2}-\\d{2} - /;\n",
  '',
  'remove display-name persistence patterns'
);
packageController = removeRange(
  packageController,
  'async function syncForecastPackageDisplayNames(forecastPackage) {\n',
  'function serializePackage(forecastPackage) {\n',
  'remove syncForecastPackageDisplayNames'
);
packageController = replaceOnce(
  packageController,
  "  return {\n    ...plain,\n    completion: getPackageCompletion(plain.chartCompletion || []),\n  };\n",
  "  const displayPackage = applyForecastPackageDisplayNames(plain);\n\n  return {\n    ...displayPackage,\n    completion: getPackageCompletion(displayPackage.chartCompletion || []),\n  };\n",
  'serialize display names without mutating documents'
);
packageController = replaceOnce(
  packageController,
  "async function populateForecastPackageById(id) {\n  const forecastPackage = await populateForecastPackage(ForecastPackage.findById(id));\n  return syncForecastPackageDisplayNames(forecastPackage);\n}\n",
  "async function populateForecastPackageById(id) {\n  return populateForecastPackage(ForecastPackage.findById(id));\n}\n",
  'make populateForecastPackageById read-only'
);
packageController = replaceOnce(
  packageController,
  "\n  for (const forecastPackage of packages) {\n    await syncForecastPackageDisplayNames(forecastPackage);\n  }\n",
  '\n',
  'remove list read-side writes'
);
packageController = replaceOnce(
  packageController,
  "\n  await syncForecastPackageDisplayNames(forecastPackage);\n  res.json({ package: serializePackage(forecastPackage) });\n",
  "\n  res.json({ package: serializePackage(forecastPackage) });\n",
  'remove current-package read-side write'
);
packageController = replaceOnce(
  packageController,
  "\n  await syncForecastPackageDisplayNames(forecastPackage);\n  res.json(serializePackage(forecastPackage));\n",
  "\n  res.json(serializePackage(forecastPackage));\n",
  'remove package-by-id read-side write'
);

if (packageController.includes('syncForecastPackageDisplayNames'))
  throw new Error('syncForecastPackageDisplayNames reference remains');
if (packageController.includes('AUTO_PACKAGE_NAME_PATTERN'))
  throw new Error('legacy display-name pattern remains in forecastPackageController');

fs.writeFileSync(packageControllerPath, packageController);

const currentControllerPath = 'backend/controllers/currentForecastPackageController.js';
let currentController = fs.readFileSync(currentControllerPath, 'utf8');

currentController = replaceOnce(
  currentController,
  "import { PROJECT_STATUS } from '../utils/projectWorkflow.js';\n",
  "import { applyForecastPackageDisplayNames } from '../utils/forecastPackageDisplayNames.js';\nimport { PROJECT_STATUS } from '../utils/projectWorkflow.js';\n",
  'add display-name helper to current controller'
);
currentController = replaceOnce(
  currentController,
  "  return {\n    ...plain,\n    completion: getPackageCompletion(plain.chartCompletion || []),\n  };\n",
  "  const displayPackage = applyForecastPackageDisplayNames(plain);\n\n  return {\n    ...displayPackage,\n    completion: getPackageCompletion(displayPackage.chartCompletion || []),\n  };\n",
  'serialize current package with read-only display names'
);
currentController = replaceOnce(
  currentController,
  '    if (existing.name !== name) patch.name = name;\n',
  '',
  'stop renaming existing projects during current-package resolution'
);

fs.writeFileSync(currentControllerPath, currentController);

console.log('Forecast Package display-name refactor applied successfully.');
