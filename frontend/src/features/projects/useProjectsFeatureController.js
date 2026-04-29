import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';

import { ROLES } from '@/core/auth/roles';
import { useProjectLibraryController } from '@dashboards/forecaster/hooks/useProjectLibraryController';
import { useAdminProjects } from '@dashboards/admin/sections/chart-review/hooks/useAdminProject';
import ChartDetailModal from '@dashboards/admin/sections/chart-review/components/ChartDetailModal';

function sortProjects(projects, sortBy, sortDir) {
  return [...projects].sort((a, b) => {
    let valA;
    let valB;

    if (sortBy === 'name' || sortBy === 'status') {
      valA = (a[sortBy] ?? '').toLowerCase();
      valB = (b[sortBy] ?? '').toLowerCase();
    } else {
      valA = new Date(a[sortBy] ?? 0).getTime();
      valB = new Date(b[sortBy] ?? 0).getTime();
    }

    if (valA < valB) return sortDir === 'asc' ? -1 : 1;
    if (valA > valB) return sortDir === 'asc' ? 1 : -1;
    return 0;
  });
}

export function useProjectsFeatureController({ role, isDarkMode }) {
  if (role === ROLES.ADMIN) {
    return useAdminProjectsController({ isDarkMode });
  }

  return useForecasterProjectsController();
}

function useForecasterProjectsController() {
  const controller = useProjectLibraryController();

  return {
    count: controller.pagination.total,
    dialogs: controller.dialogs,
    list: {
      ...controller.table,
      role: ROLES.FORECASTER,
    },
    pagination: controller.pagination,
    stats: controller.stats,
    toolbar: controller.toolbar,
  };
}

function useAdminProjectsController({ isDarkMode }) {
  const { projects = [], isLoading, error, refetch } = useAdminProjects();

  const [activeStatus, setActiveStatus] = useState('submitted');
  const [selectedProject, setSelectedProject] = useState(null);

  const filteredProjects = useMemo(() => {
    const statusLabel = activeStatus === 'all'
      ? 'All'
      : activeStatus
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

    const filtered = statusLabel === 'All'
      ? projects
      : projects.filter((project) => project.status === statusLabel);

    return sortProjects(filtered, 'submittedAt', 'desc');
  }, [projects, activeStatus]);

  return {
    count: filteredProjects.length,
    dialogs: selectedProject
      ? createPortal(
          <ChartDetailModal
            chart={selectedProject}
            isDarkMode={isDarkMode}
            onClose={() => setSelectedProject(null)}
            onActionComplete={refetch}
          />,
          document.body,
        )
      : null,
    list: {
      projects: filteredProjects,
      loading: isLoading,
      error,
      onRetry: refetch,
      onOpen: setSelectedProject,
      onApprove: setSelectedProject,
      role: ROLES.ADMIN,
      isDarkMode,
    },
    status: {
      active: activeStatus,
      onChange: setActiveStatus,
    },
  };
}
