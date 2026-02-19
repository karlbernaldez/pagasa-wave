import { lazy } from 'react';
import ProtectedAdminRoute from '@/middleware/ProtectedAdminRoute';

const Dashboard = lazy(() => import('@/pages/Dashboard'));

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
