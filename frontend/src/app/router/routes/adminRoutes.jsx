import { lazy } from 'react';
import ProtectedAdminRoute from '@/middleware/ProtectedAdminRoute';

const Dashboard = lazy(() => import('@dashboards/admin/pages/Dashboard'));

export default [
  {
    path: '/dashboard',
    element: (
      <ProtectedAdminRoute requireAuth>
        <Dashboard />
      </ProtectedAdminRoute>
    )
  }
];
