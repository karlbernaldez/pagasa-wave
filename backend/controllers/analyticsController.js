import {
  loadAnalyticsOverview,
  loadForecastAnalytics,
  loadPublicReachAnalytics,
  loadSystemAnalytics,
  loadUserAnalytics,
} from '../services/analyticsService.js';
import { parseAnalyticsDateRange } from '../utils/analyticsDateRange.js';

export const getAnalyticsOverview = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    const payload = await loadAnalyticsOverview(range, req.permissions || []);
    return res.status(200).json(payload);
  } catch (error) {
    return next(error);
  }
};

export const getForecastAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    return res.status(200).json(await loadForecastAnalytics(range));
  } catch (error) {
    return next(error);
  }
};

export const getPublicReachAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    return res.status(200).json(await loadPublicReachAnalytics(range));
  } catch (error) {
    return next(error);
  }
};

export const getUserAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    return res.status(200).json(await loadUserAnalytics(range));
  } catch (error) {
    return next(error);
  }
};

export const getSystemAnalytics = async (req, res, next) => {
  try {
    const range = parseAnalyticsDateRange(req.query);
    return res.status(200).json(await loadSystemAnalytics(range));
  } catch (error) {
    return next(error);
  }
};
