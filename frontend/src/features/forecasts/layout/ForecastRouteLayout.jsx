import { Outlet } from 'react-router-dom';

import ProtectedRoute from '@/middleware/ProtectedRoute';
import ForecastShell from './ForecastShell';

export default function ForecastRouteLayout() {
  return (
    <ProtectedRoute requireAuth>
      <ForecastShell>
        <Outlet />
      </ForecastShell>
    </ProtectedRoute>
  );
}
