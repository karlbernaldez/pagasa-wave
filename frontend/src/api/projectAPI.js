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

/* =========================================================
   USER PROJECT ROUTES
========================================================= */

// Create new project
export const createProject = (projectData) =>
  request(PROJECT_API_BASE_URL, {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

// Get all projects for current user
export const fetchUserProjects = ({ page = 1, limit = 8, search = '', status = '' } = {}) => {
  const params = new URLSearchParams({ page, limit, search, status });
  return request(`${PROJECT_API_BASE_URL}?${params}`);
};

// Get latest user project
export const fetchLatestUserProject = async () => {
  const res = await request(`${PROJECT_API_BASE_URL}/latest`);
  return res?.project || null;
};

// Get project by ID
export const fetchProjectById = (id) =>
  request(`${PROJECT_API_BASE_URL}/${id}`);

// Update project (Draft or Rejected only)
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

// Fetch all projects (Admin) with optional status filter
export const fetchAllProjectsForAdmin = (status = null) => {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return request(`${PROJECT_API_BASE_URL}/admin/all${query}`);
};