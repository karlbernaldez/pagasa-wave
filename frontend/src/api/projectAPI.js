import api from './axios.jsx';

const PROJECTS_PATH = '/projects';

const STATUS_TO_API = {
  Draft: 'draft',
  Submitted: 'submitted',
  'Under Review': 'under_review',
  'Revision Requested': 'revision_requested',
  Approved: 'approved',
  Published: 'published',
  Rejected: 'rejected',
  Archived: 'archived',
  draft: 'draft',
  submitted: 'submitted',
  under_review: 'under_review',
  revision_requested: 'revision_requested',
  approved: 'approved',
  published: 'published',
  rejected: 'rejected',
  archived: 'archived',
};

const appendQueryParam = (params, key, value, transform = (item) => item) => {
  if (value === undefined || value === null || value === '' || value === 'All') return;
  params.set(key, String(transform(value)));
};

const normalizeStatusParam = (status) => STATUS_TO_API[status] || status;

const getProjectPayload = ({ name, description, forecastDate } = {}) => ({
  name,
  description,
  forecastDate,
});

const getRenamePayload = (name) => ({
  name,
});

const getCommentPayload = (comment) => ({
  comment,
});

const getData = (response) => response.data;

/* =========================================================
   OWNER ROUTES
========================================================= */

export const fetchUserProjects = ({
  page = 1,
  limit = 10,
  search = '',
  status = '',
  dateRange = '',
  sortBy = 'updatedAt',
  sortDir = 'desc',
  signal,
} = {}) => {
  const params = new URLSearchParams();
  appendQueryParam(params, 'page', page);
  appendQueryParam(params, 'limit', limit);
  appendQueryParam(params, 'search', String(search).trim());
  appendQueryParam(params, 'status', status, normalizeStatusParam);
  appendQueryParam(params, 'dateRange', dateRange);
  appendQueryParam(params, 'sortBy', sortBy);
  appendQueryParam(params, 'sortDir', sortDir);

  return api.get(PROJECTS_PATH, { params, signal }).then(getData);
};

export const fetchLatestUserProject = () =>
  api.get(`${PROJECTS_PATH}/latest`).then((response) => response.data?.project || null);

export const createProject = (projectData) =>
  api.post(PROJECTS_PATH, getProjectPayload(projectData)).then(getData);

export const fetchProjectById = (id, config = {}) =>
  api.get(`${PROJECTS_PATH}/${id}`, config).then(getData);

export const updateProjectById = (id, projectData) =>
  api.put(`${PROJECTS_PATH}/${id}`, getProjectPayload(projectData)).then(getData);

export const renameProject = (id, name) =>
  api.patch(`${PROJECTS_PATH}/${id}/rename`, getRenamePayload(name)).then(getData);

export const submitProject = (id) =>
  api.patch(`${PROJECTS_PATH}/${id}/submit`).then(getData);

export const deleteProjectById = (id) =>
  api.delete(`${PROJECTS_PATH}/${id}`).then(getData);

/* =========================================================
   ADMIN ROUTES
========================================================= */

export const fetchAdminProjects = ({
  page = 1,
  limit = 12,
  search = '',
  status = '',
  type = '',
  dateRange = '',
  sortBy = 'updatedAt',
  sortDir = 'desc',
  signal,
} = {}) => {
  const params = new URLSearchParams();
  appendQueryParam(params, 'page', page);
  appendQueryParam(params, 'limit', limit);
  appendQueryParam(params, 'search', String(search).trim());
  appendQueryParam(params, 'status', status, normalizeStatusParam);
  appendQueryParam(params, 'type', type);
  appendQueryParam(params, 'dateRange', dateRange);
  appendQueryParam(params, 'sortBy', sortBy);
  appendQueryParam(params, 'sortDir', sortDir);

  return api.get(`${PROJECTS_PATH}/admin/projects`, { params, signal }).then(getData);
};

export const startReviewProject = (id) =>
  api.patch(`${PROJECTS_PATH}/${id}/start-review`).then(getData);

export const addReviewComment = (id, comment) =>
  api.post(`${PROJECTS_PATH}/${id}/review-comment`, getCommentPayload(comment)).then(getData);

export const requestProjectRevision = (id, comment) =>
  api.patch(`${PROJECTS_PATH}/${id}/request-revision`, getCommentPayload(comment)).then(getData);

export const approveProject = (id) =>
  api.patch(`${PROJECTS_PATH}/${id}/approve`).then(getData);

export const rejectProject = (id, comment) =>
  api.patch(`${PROJECTS_PATH}/${id}/reject`, getCommentPayload(comment)).then(getData);

export const publishProject = (id) =>
  api.patch(`${PROJECTS_PATH}/${id}/publish`).then(getData);

export const archiveProject = (id) =>
  api.patch(`${PROJECTS_PATH}/${id}/archive`).then(getData);

/* =========================================================
   PUBLIC ROUTES
========================================================= */

export const fetchPublicPublishedProjects = ({
  page = 1,
  limit = 12,
  search = '',
  before = '',
  after = '',
  signal,
} = {}) => {
  const params = new URLSearchParams();
  appendQueryParam(params, 'page', page);
  appendQueryParam(params, 'limit', limit);
  appendQueryParam(params, 'search', String(search).trim());
  appendQueryParam(params, 'before', before);
  appendQueryParam(params, 'after', after);

  return api.get(`${PROJECTS_PATH}/public/published`, { params, signal }).then(getData);
};

export const fetchPublicPublishedProjectById = (id, config = {}) =>
  api.get(`${PROJECTS_PATH}/public/published/${id}`, config).then(getData);

/* =========================================================
   EXISTING COMPATIBILITY EXPORTS
========================================================= */

export const fetchPublishedChartOutput = (id, config = {}) =>
  api.get(`${PROJECTS_PATH}/${id}/published-output`, config).then(getData);

export const createForecastProject = createProject;
export const renameForecastProject = renameProject;
export const deleteForecastProjectById = deleteProjectById;
export const submitForecastProject = submitProject;
export const startReviewForecastProject = startReviewProject;
export const addForecastReviewComment = addReviewComment;
export const requestForecastProjectRevision = requestProjectRevision;
export const approveForecastProject = approveProject;
export const rejectForecastProject = rejectProject;
export const publishForecastProject = publishProject;
