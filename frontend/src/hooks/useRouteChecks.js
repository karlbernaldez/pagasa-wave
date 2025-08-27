// hooks/useRouteChecks.js
import { useLocation } from 'react-router-dom';

const useRouteChecks = () => {
  const location = useLocation();

  const routeChecks = {
    isLoginPage: location.pathname === '/login',
    isRegisterPage: location.pathname === '/register',
    isDashboardPage: location.pathname === '/dashboard',
    isEditPage: location.pathname === '/edit',
  };

  return routeChecks;
};

export default useRouteChecks;
