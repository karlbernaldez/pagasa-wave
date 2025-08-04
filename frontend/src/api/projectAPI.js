const PROJECT_API_BASE_URL = `${process.env.REACT_APP_API_BASE_URL}/api/projects`;

// 📌 Create a new project
export const createProject = async (projectData, token) => {
  const response = await fetch(`${PROJECT_API_BASE_URL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Project creation failed');
  }

  return response.json();
};

// 📌 Get all projects for the current user
export const fetchUserProjects = async (token) => {
  const response = await fetch(`${PROJECT_API_BASE_URL}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }

  return response.json();
};

export const fetchLatestUserProject = async (token) => {
  const response = await fetch(`${PROJECT_API_BASE_URL}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch projects');
  }

  const projects = await response.json();

  // Assuming projects are returned in an array and sorted by most recent first
  const latestProject = projects[0];

  if (!latestProject) throw new Error('No projects found for this user');

  return latestProject;
};

// 📌 Get a single project by ID
export const fetchProjectById = async (id, token) => {
  const response = await fetch(`${PROJECT_API_BASE_URL}/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch project');
  }

  return response.json();
};

export const updateProjectById = async (id, projectData, token) => {
  const response = await fetch(`${PROJECT_API_BASE_URL}/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(projectData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update project');
  }

  return response.json();
};

// 📌 Delete a project
export const deleteProjectById = async (id, token) => {
  try {
    const response = await fetch(`${PROJECT_API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // Check if the response status is OK
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Failed to delete project with ID: ${id}`);
    }

    // If no content is returned (204 No Content), no need to parse JSON
    if (response.status === 204) {
      return { message: 'Project deleted successfully' };
    }

    // If response includes content, parse JSON (in case it returns additional info)
    return response.json();
  } catch (error) {
    console.error('Error deleting project:', error);
    throw new Error(error.message || 'An unexpected error occurred');
  }
};

