import { lazy } from 'react';
import ForecasterRouteLayout from '@/dashboards/forecaster/layout/ForecasterRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const ProjectLibraryPage = lazy(() => import('@/dashboards/forecaster/pages/ProjectLibraryPage'));
const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const Profile = lazy(() => import('@/dashboards/forecaster/pages/Profile'));
const EditProfile = lazy(() => import('@/dashboards/forecaster/pages/EditProfile'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    element: <ForecasterRouteLayout />,
    children: [
      { path: '/studio', element: <ProjectLibraryPage /> },
      { path: '/profile', element: <Profile /> },
      { path: '/edit-profile', element: <EditProfile /> },
    ],
  },
  {
    path: '/studio/:projectId',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Studio />
      </ProtectedRoute>
    ),
  },
  { path: '/pdf', element: <PdfGenerator /> },
];
