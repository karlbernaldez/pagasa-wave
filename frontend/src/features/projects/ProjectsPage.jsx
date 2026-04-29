import ProjectsFeatureLayout from './components/ProjectsFeatureLayout';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectsStatusTabs from './components/ProjectsStatusTabs';
import ProjectsList from './components/ProjectsList';
import { getProjectActions, getProjectsCopy } from './projectRoleConfig';
import { useProjectsFeatureController } from './useProjectsFeatureController';

const ProjectsPage = ({ role, isDarkMode }) => {
  const copy = getProjectsCopy(role);
  const actions = getProjectActions(role);

  const controller = useProjectsFeatureController({ role, isDarkMode });

  return (
    <ProjectsFeatureLayout>
      <ProjectsHeader
        title={copy.title}
        description={copy.description}
        count={controller.count}
      />

      {actions.canReview && controller.status && (
        <ProjectsStatusTabs
          active={controller.status.active}
          onChange={controller.status.onChange}
        />
      )}

      <ProjectsList {...controller.list} />

      {controller.dialogs}
    </ProjectsFeatureLayout>
  );
};

export default ProjectsPage;
