import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import WaveModel from '../models/WaveModel.js';
import { getWaveModelOperations } from './waveModelOperationsService.js';
import {
  isWaveModelRuntimeConfigured,
  normalizeWaveModelRuntimeProfile,
} from './waveModelRuntimeProfile.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const DEFAULT_TILES_ROOT = path.join(REPO_ROOT, 'wavetiles', 'tiles');
const TILES_ROOT = path.resolve(process.env.WAVELAB_WAVE_TILES_ROOT || DEFAULT_TILES_ROOT);

const MODEL_CODE_RE = /^[A-Z0-9_-]{2,32}$/;
const PACKAGE_TAG_RE = /^[A-Z0-9_-]{6,40}$/i;
const DATE_PACKAGE_MODELS = new Set(['WW3', 'ECWAM']);

const DEFAULT_MODELS = [
  {
    code: 'WW3',
    label: 'WW3',
    description: 'WaveWatch III operational wave forecast model.',
    enabled: true,
    builtIn: true,
    importerConfigured: true,
    builderConfigured: true,
  },
  {
    code: 'ECWAM',
    label: 'ECWAM',
    description: 'ECMWF wave model operational forecast packages.',
    enabled: true,
    builtIn: true,
    importerConfigured: true,
    builderConfigured: true,
  },
  {
    code: 'MRI3',
    label: 'MRI3',
    description: 'MRI III wave model reserved for a future operational data feed.',
    enabled: false,
    builtIn: true,
    importerConfigured: false,
    builderConfigured: false,
  },
  {
    code: 'BMKG',
    label: 'BMKG',
    description: 'BMKG wave model reserved for a future operational data feed.',
    enabled: false,
    builtIn: true,
    importerConfigured: false,
    builderConfigured: false,
  },
];

const normalizeCode = (value) =>
  String(value || '')
    .trim()
    .toUpperCase();

const assertModelCode = (value) => {
  const code = normalizeCode(value);
  if (!MODEL_CODE_RE.test(code)) {
    const error = new Error(
      'Invalid wave model code. Use 2-32 letters, numbers, underscores, or hyphens.'
    );
    error.status = 400;
    throw error;
  }
  return code;
};

const assertPackageTag = (value) => {
  const tag = String(value || '').trim();
  if (!PACKAGE_TAG_RE.test(tag)) {
    const error = new Error('Invalid package identifier.');
    error.status = 400;
    throw error;
  }
  return tag;
};

const resolveInside = (base, ...parts) => {
  const resolvedBase = path.resolve(base);
  const candidate = path.resolve(resolvedBase, ...parts);
  if (candidate !== resolvedBase && !candidate.startsWith(`${resolvedBase}${path.sep}`)) {
    const error = new Error('Requested path is outside the managed wave tile directory.');
    error.status = 400;
    throw error;
  }
  return candidate;
};

const readDirectories = async (directory) => {
  try {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    return entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  } catch (error) {
    if (error.code === 'ENOENT') return [];
    throw error;
  }
};

const parsePackageDate = (tag) => {
  const match = /^(\d{4})(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)(\d{2})$/i.exec(tag);
  if (!match) return null;
  const monthIndex = [
    'JAN',
    'FEB',
    'MAR',
    'APR',
    'MAY',
    'JUN',
    'JUL',
    'AUG',
    'SEP',
    'OCT',
    'NOV',
    'DEC',
  ].indexOf(match[2].toUpperCase());
  return new Date(Date.UTC(Number(match[1]), monthIndex, Number(match[3]))).getTime();
};

const isInventoryPackageTag = (code, packageTag) => {
  if (!PACKAGE_TAG_RE.test(packageTag)) return false;
  if (!DATE_PACKAGE_MODELS.has(code)) return true;
  return parsePackageDate(packageTag) !== null;
};

const sortPackageTags = (a, b) => {
  const aDate = parsePackageDate(a);
  const bDate = parsePackageDate(b);
  if (aDate !== null && bDate !== null) return bDate - aDate;
  return b.localeCompare(a);
};

export const ensureDefaultWaveModels = async () => {
  await Promise.all(
    DEFAULT_MODELS.map(({ code, ...defaults }) =>
      WaveModel.updateOne(
        { code },
        {
          $setOnInsert: {
            code,
            ...defaults,
          },
        },
        { upsert: true }
      )
    )
  );
};

export const listPackagesForModel = async (rawCode) => {
  const code = assertModelCode(rawCode);
  const modelRoot = resolveInside(TILES_ROOT, code);
  const styleNames = await readDirectories(modelRoot);
  const packageStyles = new Map();

  for (const style of styleNames) {
    const styleRoot = resolveInside(modelRoot, style);
    const packages = await readDirectories(styleRoot);
    for (const packageTag of packages) {
      if (!isInventoryPackageTag(code, packageTag)) continue;
      const styles = packageStyles.get(packageTag) || [];
      styles.push(style);
      packageStyles.set(packageTag, styles);
    }
  }

  return [...packageStyles.entries()]
    .sort(([a], [b]) => sortPackageTags(a, b))
    .map(([packageTag, styles]) => ({
      packageTag,
      styles: styles.sort(),
    }));
};

export const getWaveModelInventory = async (model) => {
  const packages = await listPackagesForModel(model.code);
  const hasData = packages.length > 0;
  const latestPackage = packages[0]?.packageTag || null;
  const runtimeConfigured = isWaveModelRuntimeConfigured(model.runtimeProfile);
  const renderConfigured = Boolean(model.builderConfigured || runtimeConfigured);
  const state = !model.enabled ? 'disabled' : hasData && renderConfigured ? 'active' : 'no_data';
  const operations = await getWaveModelOperations(model.code, latestPackage);

  return {
    id: model._id,
    code: model.code,
    label: model.label,
    description: model.description,
    enabled: model.enabled,
    builtIn: model.builtIn,
    importerConfigured: model.importerConfigured,
    builderConfigured: model.builderConfigured,
    runtimeConfigured,
    runtimeProfile: model.runtimeProfile || null,
    state,
    hasData,
    packageCount: packages.length,
    latestPackage,
    packages,
    operations,
    updatedAt: model.updatedAt,
  };
};

export const listWaveModelsWithInventory = async () => {
  await ensureDefaultWaveModels();
  const models = await WaveModel.find({}).sort({ builtIn: -1, code: 1 }).lean();
  return Promise.all(models.map(getWaveModelInventory));
};

export const createWaveModel = async ({
  code: rawCode,
  label,
  description = '',
  runtimeProfile = null,
}) => {
  const code = assertModelCode(rawCode);
  const cleanLabel = String(label || '').trim();
  if (!cleanLabel) {
    const error = new Error('Wave model name is required.');
    error.status = 400;
    throw error;
  }
  const normalizedRuntimeProfile = normalizeWaveModelRuntimeProfile(runtimeProfile);

  try {
    return await WaveModel.create({
      code,
      label: cleanLabel,
      description: String(description || '').trim(),
      enabled: false,
      builtIn: false,
      importerConfigured: false,
      builderConfigured: false,
      runtimeProfile: normalizedRuntimeProfile,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const duplicate = new Error(`Wave model ${code} already exists.`);
      duplicate.status = 409;
      throw duplicate;
    }
    throw error;
  }
};

export const setWaveModelEnabled = async (rawCode, enabled) => {
  const code = assertModelCode(rawCode);
  if (typeof enabled !== 'boolean') {
    const error = new Error('enabled must be a boolean.');
    error.status = 400;
    throw error;
  }

  const model = await WaveModel.findOne({ code });
  if (!model) {
    const error = new Error(`Wave model ${code} was not found.`);
    error.status = 404;
    throw error;
  }

  if (enabled && !model.builderConfigured && !isWaveModelRuntimeConfigured(model.runtimeProfile)) {
    const error = new Error(
      `Wave model ${code} cannot be enabled until its builder or runtime profile is configured.`
    );
    error.status = 409;
    throw error;
  }

  model.enabled = enabled;
  await model.save();
  return model;
};

export const setWaveModelRuntimeProfile = async (rawCode, runtimeProfile) => {
  const code = assertModelCode(rawCode);
  if (DATE_PACKAGE_MODELS.has(code)) {
    const error = new Error(
      `${code} uses its dedicated operational runtime and cannot be replaced by a managed custom profile.`
    );
    error.status = 409;
    throw error;
  }

  const normalizedRuntimeProfile = normalizeWaveModelRuntimeProfile(runtimeProfile);
  const model = await WaveModel.findOne({ code });
  if (!model) {
    const error = new Error(`Wave model ${code} was not found.`);
    error.status = 404;
    throw error;
  }

  model.runtimeProfile = normalizedRuntimeProfile;
  if (!normalizedRuntimeProfile) model.enabled = false;
  await model.save();
  return model;
};

export const deleteWaveModelPackage = async (rawCode, rawPackageTag) => {
  const code = assertModelCode(rawCode);
  const packageTag = assertPackageTag(rawPackageTag);
  const model = await WaveModel.findOne({ code }).lean();
  if (!model) {
    const error = new Error(`Wave model ${code} was not found.`);
    error.status = 404;
    throw error;
  }
  if (DATE_PACKAGE_MODELS.has(code) && parsePackageDate(packageTag) === null) {
    const error = new Error(`Invalid managed package identifier for ${code}.`);
    error.status = 400;
    throw error;
  }

  const modelRoot = resolveInside(TILES_ROOT, code);
  const styles = await readDirectories(modelRoot);
  const removed = [];

  for (const style of styles) {
    const target = resolveInside(modelRoot, style, packageTag);
    try {
      const stat = await fs.stat(target);
      if (!stat.isDirectory()) continue;
      await fs.rm(target, { recursive: true, force: false });
      removed.push(style);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }
  }

  if (removed.length === 0) {
    const error = new Error(`Package ${packageTag} was not found for ${code}.`);
    error.status = 404;
    throw error;
  }

  return { code, packageTag, removedStyles: removed.sort() };
};

export const removeCustomWaveModel = async (rawCode) => {
  const code = assertModelCode(rawCode);
  const model = await WaveModel.findOne({ code });
  if (!model) {
    const error = new Error(`Wave model ${code} was not found.`);
    error.status = 404;
    throw error;
  }
  if (model.builtIn) {
    const error = new Error('Built-in wave models cannot be removed. Disable the model instead.');
    error.status = 409;
    throw error;
  }

  const packages = await listPackagesForModel(code);
  if (packages.length > 0) {
    const error = new Error('Remove all model packages before deleting the model configuration.');
    error.status = 409;
    throw error;
  }

  await WaveModel.deleteOne({ _id: model._id });
  return { code };
};

export const waveTilesRoot = TILES_ROOT;
