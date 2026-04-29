import ChartReviewSection from '@dashboards/admin/sections/chart-review/ChartReview';
import ProjectLibraryPage from '@dashboards/forecaster/pages/ProjectLibraryPage';
import { ROLES } from '@/core/auth/roles';

const ProjectsPage = ({ role, isDarkMode }) => {
  if (role === ROLES.ADMIN) {
    return <ChartReviewSection isDarkMode={isDarkMode} />;
  }

  return <ProjectLibraryPage />;
};

export default ProjectsPage;
