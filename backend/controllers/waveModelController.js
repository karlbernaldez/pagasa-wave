import AuditLog from '../models/AuditLog.js';
import { triggerWaveModelBuilder } from '../services/waveModelOperationsService.js';
import {
  createWaveModel,
  deleteWaveModelPackage,
  getWaveModelInventory,
  listWaveModelsWithInventory,
  removeCustomWaveModel,
  setWaveModelEnabled,
  setWaveModelRuntimeProfile,
} from '../services/waveModelService.js';
import {
  getWaveSourceCyclePolicy,
  setWaveSourceCycleHour,
} from '../services/waveSourceCyclePolicy.js';

const actorId = (req) => req.user?._id ?? req.user?.id ?? null;

const writeAudit = async (req, action, details) => {
  try {
    await AuditLog.create({
      user: actorId(req),
      action,
      resourceType: 'WaveModel',
      details,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });
  } catch {
    // Audit logging must not turn an otherwise successful management action into a 500 response.
  }
};

const toCatalogModel = ({ operations: _operations, packages: _packages, ...model }) => model;

export const listWaveModelCatalog = async (_req, res, next) => {
  try {
    const models = await listWaveModelsWithInventory();
    res.status(200).json({ success: true, models: models.map(toCatalogModel) });
  } catch (error) {
    next(error);
  }
};

export const listWaveModels = async (_req, res, next) => {
  try {
    const models = await listWaveModelsWithInventory();
    res.status(200).json({ success: true, models });
  } catch (error) {
    next(error);
  }
};

export const addWaveModel = async (req, res, next) => {
  try {
    const model = await createWaveModel(req.body || {});
    const inventory = await getWaveModelInventory(model.toObject());
    await writeAudit(req, 'wave_model.create', {
      code: inventory.code,
      runtimeConfigured: inventory.runtimeConfigured,
    });
    res.status(201).json({ success: true, model: inventory });
  } catch (error) {
    next(error);
  }
};

export const updateWaveModelAvailability = async (req, res, next) => {
  try {
    const model = await setWaveModelEnabled(req.params.code, req.body?.enabled);
    const inventory = await getWaveModelInventory(model.toObject());
    await writeAudit(req, 'wave_model.availability.update', {
      code: inventory.code,
      enabled: inventory.enabled,
    });
    res.status(200).json({ success: true, model: inventory });
  } catch (error) {
    next(error);
  }
};

export const updateWaveModelRuntimeProfile = async (req, res, next) => {
  try {
    const model = await setWaveModelRuntimeProfile(
      req.params.code,
      req.body?.runtimeProfile ?? null
    );
    const inventory = await getWaveModelInventory(model.toObject());
    await writeAudit(req, 'wave_model.runtime_profile.update', {
      code: inventory.code,
      runtimeConfigured: inventory.runtimeConfigured,
      mode: inventory.runtimeProfile?.mode || null,
    });
    res.status(200).json({ success: true, model: inventory });
  } catch (error) {
    next(error);
  }
};

export const getWaveModelSourceCyclePolicy = async (req, res, next) => {
  try {
    const policy = await getWaveSourceCyclePolicy(req.params.code);
    res.status(200).json({ success: true, code: req.params.code.toUpperCase(), policy });
  } catch (error) {
    next(error);
  }
};

export const updateWaveModelSourceCyclePolicy = async (req, res, next) => {
  try {
    const policy = await setWaveSourceCycleHour(req.params.code, req.body?.preferredHourUtc);
    await writeAudit(req, 'wave_model.source_cycle.update', {
      code: req.params.code.toUpperCase(),
      preferredHourUtc: policy.preferredHourUtc,
    });
    res.status(200).json({ success: true, code: req.params.code.toUpperCase(), policy });
  } catch (error) {
    next(error);
  }
};

export const runWaveModelBuilder = async (req, res, next) => {
  try {
    const result = await triggerWaveModelBuilder(req.params.code);
    await writeAudit(req, 'wave_model.builder.trigger', result);
    res.status(202).json({
      success: true,
      ...result,
      message: `${result.modelCode} builder run was requested.`,
    });
  } catch (error) {
    next(error);
  }
};

export const removeWaveModelPackage = async (req, res, next) => {
  try {
    const result = await deleteWaveModelPackage(req.params.code, req.params.packageTag);
    await writeAudit(req, 'wave_model.package.delete', result);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

export const deleteWaveModelConfiguration = async (req, res, next) => {
  try {
    const result = await removeCustomWaveModel(req.params.code);
    await writeAudit(req, 'wave_model.delete', result);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};
