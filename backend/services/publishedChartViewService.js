import { createHmac } from 'node:crypto';

import Project from '../models/Project.js';
import PublishedChartView from '../models/PublishedChartView.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const TIME_ZONE = 'Asia/Manila';
const VIEWER_TOKEN_PATTERN = /^[A-Za-z0-9_-]{16,128}$/;

export function formatManilaDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function normalizeViewerToken(value) {
  const token = String(value || '').trim();
  return VIEWER_TOKEN_PATTERN.test(token) ? token : null;
}

export function hashViewerToken(viewerToken, secret) {
  if (!viewerToken || !secret) return null;
  return createHmac('sha256', secret).update(viewerToken).digest('hex');
}

export async function recordPublishedChartView(
  {
    projectId,
    viewerToken,
    now = new Date(),
    hashSecret = process.env.PUBLIC_VIEW_HASH_SECRET || process.env.JWT_SECRET,
  } = {},
  { ProjectModel = Project, PublishedChartViewModel = PublishedChartView } = {}
) {
  const normalizedToken = normalizeViewerToken(viewerToken);
  if (!normalizedToken) {
    const error = new Error('A valid anonymous viewer token is required.');
    error.statusCode = 400;
    throw error;
  }
  if (!hashSecret) {
    const error = new Error('Published chart view tracking is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const project = await ProjectModel.findOne({
    _id: projectId,
    status: PROJECT_STATUS.PUBLISHED,
  })
    .select('_id status')
    .lean();

  if (!project) {
    const error = new Error('Published chart not found.');
    error.statusCode = 404;
    throw error;
  }

  const dateKey = formatManilaDateKey(now);
  const viewerHash = hashViewerToken(normalizedToken, hashSecret);

  try {
    const view = await PublishedChartViewModel.create({
      project: project._id,
      dateKey,
      viewerHash,
      viewedAt: now,
    });
    return { counted: true, dateKey, viewId: String(view._id) };
  } catch (error) {
    if (error?.code === 11000) {
      return { counted: false, dateKey, duplicate: true };
    }
    throw error;
  }
}
