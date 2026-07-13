import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import ForecasterRouteLayout from '@/dashboards/forecaster/layout/ForecasterRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';
import StudioLayout from '@/app/layout/StudioLayout';

const ProjectLibraryPage = lazy(() => import('@/dashboards/forecaster/pages/ProjectLibraryPage'));
const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const Profile = lazy(() => import('@/dashboards/forecaster/pages/Profile'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    element: <ForecasterRouteLayout />,
    children: [
      { path: '/studio', element: <ProjectLibraryPage /> },
      { path: '/profile', element: <Profile /> },
      { path: '/edit-profile', element: <Navigate to="/profile" replace /> },
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
