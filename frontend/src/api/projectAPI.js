const PROJECT_API_BASE_URL = `${import.meta.env.VITE_API_URL}/api/projects`;

/* =========================================================
   CORE REQUEST HELPER
========================================================= */
const request = async (url, options = {}) => {
  const response = await fetch(url, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    // No JSON body (e.g., 204)
  }

  if (!response.ok) {
    throw new Error(data?.message || 'Request failed');
  }

  return data;
};

const appendQueryParam = (params, key, value) => {
  if (value === undefined || value === null || value === '' || value === 'All') return;
  params.set(key, String(value));
};

/* =========================================================
   USER PROJECT ROUTES
========================================================= */

// Create new project
export const createProject = (projectData) =>
  request(PROJECT_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

// Get projects for current user. Supports server-driven search, filtering, sorting, and pagination.
export const fetchUserProjects = ({
  page = 1,
  limit = 10,
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
  appendQueryParam(params, 'search', search.trim());
  appendQueryParam(params, 'status', status);
  appendQueryParam(params, 'type', type);
  appendQueryParam(params, 'dateRange', dateRange);
  appendQueryParam(params, 'sortBy', sortBy);
  appendQueryParam(params, 'sortDir', sortDir);

  return request(`${PROJECT_API_BASE_URL}?${params}`, { signal });
};

// Get latest user project
export const fetchLatestUserProject = async () => {
  const res = await request(`${PROJECT_API_BASE_URL}/latest`);
  return res?.project || null;
};

// Get project by ID
export const fetchProjectById = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}`);

// Rename project (any status — name only)
export const renameProject = (id, name) =>
  request(`${PROJECT_API_BASE_URL}/${id}/rename`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });

// Update project (Draft, Rejected, or Revision Requested only)
export const updateProjectById = (id, projectData) =>
  request(`${PROJECT_API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(projectData),
  });

// Delete project
export const deleteProjectById = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}`, {
    method: 'DELETE',
  });

/* =========================================================
   WORKFLOW ROUTES
========================================================= */

// Submit project (Owner)
export const submitProject = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}/submit`, {
    method: 'PATCH',
  });

// Start review (Admin)
export const startReviewProject = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}/start-review`, {
    method: 'PATCH',
  });

// Add review comment without changing status (Admin)
export const addReviewComment = (id, comment) =>
  request(`${PROJECT_API_BASE_URL}/${id}/review-comment`, {
    method: 'POST',
    body: JSON.stringify({ comment }),
  });

// Request revision (Admin)
export const requestProjectRevision = (id, comment) =>
  request(`${PROJECT_API_BASE_URL}/${id}/request-revision`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });

// Approve project (Admin)
export const approveProject = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}/approve`, {
    method: 'PATCH',
  });

// Reject project (Admin)
export const rejectProject = (id, comment = '') =>
  request(`${PROJECT_API_BASE_URL}/${id}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ comment }),
  });

// Mark project as No Publication / Operational Exception (Admin)
export const markProjectNoPublication = (id, { reason, notes = '' } = {}) =>
  request(`${PROJECT_API_BASE_URL}/${id}/no-publication`, {
    method: 'PATCH',
    body: JSON.stringify({ reason, notes }),
  });

// Publish project (Admin)
export const publishProject = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}/publish`, {
    method: 'PATCH',
  });

// Archive project (Admin)
export const archiveProject = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}/archive`, {
    method: 'PATCH',
  });

/* =========================================================
   ADMIN ROUTES
========================================================= */

// Fetch admin review projects with server-driven search, filtering, sorting, and pagination.
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
  appendQueryParam(params, 'search', search.trim());
  appendQueryParam(params, 'status', status);
  appendQueryParam(params, 'type', type);
  appendQueryParam(params, 'dateRange', dateRange);
  appendQueryParam(params, 'sortBy', sortBy);
  appendQueryParam(params, 'sortDir', sortDir);

  return request(`${PROJECT_API_BASE_URL}/admin/projects?${params}`, { signal });
};

// Fetch the full forecast package for the selected chart's forecast day.
export const fetchAdminForecastPackage = (id, { signal } = {}) =>
  request(`${PROJECT_API_BASE_URL}/admin/projects/${id}/package`, { signal });
