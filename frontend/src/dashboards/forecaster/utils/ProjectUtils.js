import Swal from 'sweetalert2';
import { createProject, deleteProjectById } from '@/api/projectAPI';

// --- Logout ---
export const logout = () => logoutUser();

// --- Project Creation ---
export const handleCreateProject = async ({
  projectName,
  chartType,
  description,
  forecastDate,
  onNew,
  setShowModal,
}) => {
  if (!projectName.trim()) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Project Name is required!',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    return;
  }

  try {
    const payload = {
      name: projectName,
      chartType,
      description,
      forecastDate,
    };

    const created = await createProject(payload);

    const storageValues = {
      projectId: created._id,
      projectName,
      chartType,
      forecastDate,
    };

    Object.entries(storageValues).forEach(([key, value]) => {
      if (value != null) {
        localStorage.setItem(key, String(value));
      }
    });

    if (onNew) {
      onNew({
        name: projectName,
        chartType,
        description,
        forecastDate,
      });
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Project "${projectName}" created successfully`,
      showConfirmButton: false,
      timer: 2000,
    });

    setShowModal(false);

    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err.message,
      showConfirmButton: false,
      timer: 3000,
    });
  }
};

export const handleDeleteProject = async ({
  projectId,
  onDelete,
  navigateAfterDelete = true,
}) => {
  if (!projectId) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No project selected!',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  try {
    const result = await deleteProjectById(projectId);

    ['projectId', 'projectName', 'chartType', 'forecastDate'].forEach((key) =>
      localStorage.removeItem(key)
    );

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Project deleted successfully',
      showConfirmButton: false,
      timer: 2000,
    });

    if (typeof onDelete === 'function') onDelete(projectId);

    if (navigateAfterDelete) {
      setTimeout(() => window.location.reload(), 1200);
    }

  } catch (error) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.message || 'Failed to delete project',
      showConfirmButton: false,
      timer: 3000,
    });
  }
};
