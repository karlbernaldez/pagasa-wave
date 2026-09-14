import { lazy } from 'react';
import { Navigate } from 'react-router-dom';

import OperationalDashboardRouteLayout from '@/features/dashboard/OperationalDashboardRouteLayout';

const Dashboard = lazy(() => import('@/features/dashboard/OperationalDashboardPage'));

export default [
  {
    element: <OperationalDashboardRouteLayout />,
    children: [
      { path: '/dashboard', element: <Dashboard /> },
      { path: '/dashboard/wave-models', element: <Dashboard /> },
      { path: '/dashboard/wave-models/pipeline', element: <Dashboard /> },
      { path: '/dashboard/wave-models/onboard', element: <Dashboard /> },
      { path: '/dashboard/users', element: <Dashboard /> },
      { path: '/dashboard/users/roles', element: <Dashboard /> },
      { path: '/dashboard/analytics', element: <Dashboard /> },
      { path: '/dashboard/calendar', element: <Dashboard /> },
      { path: '/dashboard/settings', element: <Dashboard /> },
    ],
  },
  { path: '/dashboard/review', element: <Navigate to="/forecasts/review" replace /> },
  { path: '/dashboard/account', element: <Navigate to="/account" replace /> },
  {
    path: '/dashboard/account/security',
    element: <Navigate to="/account/security" replace />,
  },
];
