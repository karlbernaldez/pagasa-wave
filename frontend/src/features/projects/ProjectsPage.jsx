import { useState } from 'react';

import {
  approveProject,
  publishProject,
  rejectProject,
  startReviewProject,
  submitProject,
} from '@/api/projectAPI';
import { ROLES } from '@/core/auth/roles';
import { useDeleteProjectMutation, useRenameProjectMutation } from '@dashboards/forecaster/hooks/useProjectMutations';
import ProjectDialogsHost from '@dashboards/forecaster/components/project-library/ProjectDialogsHost';
import ProjectReviewModal from '@/features/projects/components/ProjectReviewModal';
import ProjectsFeatureLayout from './components/ProjectsFeatureLayout';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectsStatusTabs from './components/ProjectsStatusTabs';
import ProjectsList from './components/ProjectsList';
import { getProjectActions, getProjectsCopy } from './projectRoleConfig';
import { useProjectsData } from './hooks/useProjectsData';

function getProjectId(project) {
  return project?._id || project?.id;
}

const ProjectsPage = ({ role, isDarkMode }) => {
  const copy = getProjectsCopy(role);
  const actions = getProjectActions(role);
  const data = useProjectsData({ role });

  const [selectedAdminProject, setSelectedAdminProject] = useState(null);
  const [reviewingProjectId, setReviewingProjectId] = useState(null);
  const [submittingProjectId, setSubmittingProjectId] = useState(null);

  const deleteProjectMutation = useDeleteProjectMutation();
  const renameProjectMutation = useRenameProjectMutation();

  const forecasterDialogs = ProjectDialogsHost({
    onDeleteConfirm: (project) => deleteProjectMutation.mutate(getProjectId(project)),
    onRenameConfirm: (project, name) => renameProjectMutation.mutate({ id: getProjectId(project), name }),
  });

  const isAdmin = role === ROLES.ADMIN;

  const handleSubmitProject = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId || submittingProjectId) return;

    setSubmittingProjectId(projectId);
    try {
      await submitProject(projectId);
      await data.refetch?.();
    } catch (error) {
      window.alert(error?.message || 'Failed to submit project for review.');
    } finally {
      setSubmittingProjectId(null);
    }
  };

  const handleReviewProject = async (project) => {
    const projectId = getProjectId(project);
    if (!projectId || reviewingProjectId) return;

    setReviewingProjectId(projectId);
    try {
      const updatedProject = project.status === 'Submitted'
        ? await startReviewProject(projectId)
        : project;

      setSelectedAdminProject(updatedProject || project);
      await data.refetch?.();
    } catch (error) {
      window.alert(error?.message || 'Failed to open project review.');
    } finally {
      setReviewingProjectId(null);
    }
  };

  const handleApproveProject = async (project) => {
    const updatedProject = await approveProject(getProjectId(project));
    await data.refetch?.();
    return updatedProject;
  };

  const handleRejectProject = async (project, comment) => {
    const updatedProject = await rejectProject(getProjectId(project), comment);
    await data.refetch?.();
    return updatedProject;
  };

  const handlePublishProject = async (project) => {
    const updatedProject = await publishProject(getProjectId(project));
    await data.refetch?.();
    return updatedProject;
  };

  const handleAdminActionComplete = async (updatedProject) => {
    if (updatedProject) {
      setSelectedAdminProject(updatedProject);
    }
    await data.refetch?.();
  };

  const dialogs = isAdmin
    ? selectedAdminProject
      ? (
          <ProjectReviewModal
            project={selectedAdminProject}
            isDarkMode={isDarkMode}
            onClose={() => setSelectedAdminProject(null)}
            onApprove={handleApproveProject}
            onReject={handleRejectProject}
            onPublish={handlePublishProject}
            onActionComplete={handleAdminActionComplete}
          />
        )
      : null
    : forecasterDialogs.dialogs;

  return (
    <ProjectsFeatureLayout>
      <ProjectsHeader
        title={copy.title}
        description={copy.description}
        count={data.total}
      />

      {actions.canReview && data.filters.activeStatus && (
        <ProjectsStatusTabs
          active={data.filters.activeStatus}
          onChange={data.filters.setActiveStatus}
        />
      )}

      <ProjectsList
        role={role}
        isDarkMode={isDarkMode}
        projects={data.projects}
        loading={data.loading}
        error={data.error}
        onRetry={data.refetch}
        onOpen={isAdmin ? handleReviewProject : (project) => window.open(`/studio/${getProjectId(project)}`, '_blank')}
        onApprove={isAdmin ? handleReviewProject : undefined}
        onSubmit={!isAdmin ? handleSubmitProject : undefined}
        submittingProjectId={submittingProjectId}
        reviewingProjectId={reviewingProjectId}
        onRename={!isAdmin ? forecasterDialogs.openRename : undefined}
        onDelete={!isAdmin ? forecasterDialogs.openDelete : undefined}
      />

      {dialogs}
    </ProjectsFeatureLayout>
  );
};

export default ProjectsPage;
