// hooks/useRouteChecks.js
import { useLocation } from 'react-router-dom';

const useRouteChecks = () => {
  const location = useLocation();

  const routeChecks = {
    isLoginPage: location.pathname === '/login',
    isRegisterPage: location.pathname === '/register',
    isVerifyEmailPage: location.pathname === '/verify-email',
    isDashboardPage: location.pathname === '/dashboard',
    isStudioPage: location.pathname === '/studio',
    isStudioProjectPage: location.pathname.startsWith('/studio/'),
    isForecasterDashboardPage:
      location.pathname === '/studio' ||
      location.pathname === '/profile' ||
      location.pathname === '/edit-profile' ||
      location.pathname === '/pdf',
    isChartsPage: location.pathname === '/charts',
  };

  return routeChecks;
};

export default useRouteChecks;
