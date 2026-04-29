import { useState } from 'react';

import ChartReviewSection from '@dashboards/admin/sections/chart-review/ChartReview';
import ProjectLibraryPage from '@dashboards/forecaster/pages/ProjectLibraryPage';
import { ROLES } from '@/core/auth/roles';
import ProjectsFeatureLayout from './components/ProjectsFeatureLayout';
import ProjectsHeader from './components/ProjectsHeader';
import ProjectsStatusTabs from './components/ProjectsStatusTabs';
import { getProjectActions, getProjectsCopy } from './projectRoleConfig';

const ProjectsPage = ({ role, isDarkMode }) => {
  const [activeStatus, setActiveStatus] = useState('all');

  const copy = getProjectsCopy(role);
  const actions = getProjectActions(role);

  return (
    <ProjectsFeatureLayout>
      <ProjectsHeader
        title={copy.title}
        description={copy.description}
      />

      {actions.canReview && (
        <ProjectsStatusTabs active={activeStatus} onChange={setActiveStatus} />
      )}

      {role === ROLES.ADMIN ? (
        <ChartReviewSection isDarkMode={isDarkMode} />
      ) : (
        <ProjectLibraryPage />
      )}
    </ProjectsFeatureLayout>
  );
};

export default ProjectsPage;
