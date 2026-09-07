import { lazy } from 'react';

import AdminAccountLayout from '@dashboards/admin/layout/AdminAccountLayout';
import AdminRouteLayout from '@dashboards/admin/layout/AdminRouteLayout';

const AccountSettings = lazy(() => import('@dashboards/forecaster/pages/AccountSettings'));
const Dashboard = lazy(() => import('@dashboards/admin/pages/Dashboard'));
const Profile = lazy(() => import('@dashboards/forecaster/pages/Profile'));

export default [
  {
    element: <AdminRouteLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/review', element: <Dashboard /> },
      { path: '/dashboard/wave-models', element: <Dashboard /> },
      { path: '/dashboard/wave-models/onboard', element: <Dashboard /> },
      { path: '/dashboard/wave-models/schedules', element: <Dashboard /> },
      { path: '/dashboard/users', element: <Dashboard /> },
      { path: '/dashboard/users/roles', element: <Dashboard /> },
      { path: '/dashboard/analytics', element: <Dashboard /> },
      { path: '/dashboard/calendar', element: <Dashboard /> },
      { path: '/dashboard/settings', element: <Dashboard /> },
      {
        element: <AdminAccountLayout />,
        children: [
          { path: '/dashboard/account', element: <Profile /> },
          {
            path: '/dashboard/account/security',
            element: <AccountSettings backPath="/dashboard/account" />,
          },
        ],
      },
    ],
  },
];
