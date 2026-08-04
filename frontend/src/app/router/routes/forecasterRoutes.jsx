import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import AccountLayout from '@/dashboards/forecaster/layout/AccountLayout';
import ForecasterRouteLayout from '@/dashboards/forecaster/layout/ForecasterRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';
import StudioLayout from '@/app/layout/StudioLayout';

const AccountSettings = lazy(() => import('@/dashboards/forecaster/pages/AccountSettings'));
const ProjectLibraryPage = lazy(() => import('@/dashboards/forecaster/pages/ProjectLibraryPage'));
const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const Profile = lazy(() => import('@/dashboards/forecaster/pages/Profile'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    element: <ForecasterRouteLayout />,
    children: [
      { path: '/studio', element: <ProjectLibraryPage /> },
      {
        element: <AccountLayout />,
        children: [
          { path: '/account', element: <Profile /> },
          { path: '/account/security', element: <AccountSettings /> },
        ],
      },
      { path: '/profile', element: <Navigate to="/account" replace /> },
      { path: '/settings', element: <Navigate to="/account/security" replace /> },
      { path: '/account-settings', element: <Navigate to="/account/security" replace /> },
      { path: '/edit-profile', element: <Navigate to="/account" replace /> },
      { path: '/pdf', element: <PdfGenerator /> },
    ],
  },
  {
    element: <StudioLayout />,
    children: [
      {
        path: '/studio/:projectId',
        element: (
          <ProtectedRoute requireAuth={true}>
            <Studio />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
