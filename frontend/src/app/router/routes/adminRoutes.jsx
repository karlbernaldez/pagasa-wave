import { lazy } from 'react';

import AdminRouteLayout from '@dashboards/admin/layout/AdminRouteLayout';

const Dashboard = lazy(() => import('@dashboards/admin/pages/Dashboard'));

export default [
  {
    element: <AdminRouteLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
    ],
  },
];
