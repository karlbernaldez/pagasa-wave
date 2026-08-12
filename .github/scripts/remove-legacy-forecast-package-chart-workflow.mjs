import fs from 'node:fs';

const controllerPath = 'backend/controllers/forecastPackageController.js';
let source = fs.readFileSync(controllerPath, 'utf8');

function removeBetween(startMarker, endMarker, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);

  if (start < 0 || end < 0 || end <= start) {
    throw new Error(`Could not safely locate ${label}`);
  }

  source = `${source.slice(0, start)}${source.slice(end)}`;
}

removeBetween(
  'function getDisplayName(user) {',
  'function getRequiredComment(value, label = \'Comment\') {',
  'legacy display-name helper'
);
removeBetween(
  'function isUserActiveEditor(chart, userId) {',
  'function syncLegacyClaimFields(chart) {',
  'legacy active-editor helper'
);
removeBetween(
  'function getChartRowByProjectId(forecastPackage, projectId) {',
  'function getCompletionRow(forecastPackage, chartType) {',
  'legacy project chart lookup helper'
);
removeBetween(
  'function getActiveEditorLabels(chart) {',
  'function getActiveEditingChartLabel(forecastPackage) {',
  'legacy editor-label helper'
);
removeBetween(
  'function serializeChartContext(forecastPackage, chart, user) {',
  'async function populateForecastPackage(query) {',
  'legacy chart-context serializer'
);
removeBetween(
  'function findForecastPackageByChartProjectId(projectId) {',
  'async function populateForecastPackageById(id) {',
  'legacy project package lookup helper'
);
removeBetween(
  'export const getForecastPackageChartContextByProject = asyncHandler(async (req, res) => {',
  'export const updateForecastChartCompletion = asyncHandler(async (req, res) => {',
  'legacy project chart context, claim, and release handlers'
);
removeBetween(
  'export const updateForecastChartCompletionByProject = asyncHandler(async (req, res) => {',
  'export const submitForecastPackage = asyncHandler(async (req, res) => {',
  'legacy project completion handler'
);

const forbiddenSymbols = [
  'getForecastPackageChartContextByProject',
  'claimForecastPackageChartByProject',
  'releaseForecastPackageChartByProject',
  'updateForecastChartCompletionByProject',
  'findForecastPackageByChartProjectId',
  'serializeChartContext',
  'getChartRowByProjectId',
  'getActiveEditorLabels',
  'isUserActiveEditor',
  'getDisplayName',
];

for (const symbol of forbiddenSymbols) {
  if (source.includes(symbol)) {
    throw new Error(`Legacy symbol still present after cleanup: ${symbol}`);
  }
}

if (!source.includes('export const updateForecastChartCompletion = asyncHandler')) {
  throw new Error('Live package-id completion handler was unexpectedly removed');
}

fs.writeFileSync(controllerPath, source);
console.log('Removed legacy Forecast Package project chart workflow from forecastPackageController.js');
