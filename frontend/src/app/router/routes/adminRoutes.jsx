import { lazy } from 'react';

import AdminRouteLayout from '@dashboards/admin/layout/AdminRouteLayout';

const Dashboard = lazy(() => import('@dashboards/admin/pages/Dashboard'));

export default [
  {
    element: <AdminRouteLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/review', element: <Dashboard /> },
      { path: '/dashboard/users', element: <Dashboard /> },
      { path: '/dashboard/users/roles', element: <Dashboard /> },
      { path: '/dashboard/analytics', element: <Dashboard /> },
      { path: '/dashboard/calendar', element: <Dashboard /> },
      { path: '/dashboard/settings', element: <Dashboard /> },
    ],
  },
];
