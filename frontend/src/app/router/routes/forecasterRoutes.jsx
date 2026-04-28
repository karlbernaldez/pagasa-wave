import { lazy } from 'react';
import ForecasterRouteLayout from '@/dashboards/forecaster/layout/ForecasterRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const StudioBase = lazy(() => import('@/dashboards/forecaster/pages/StudioBase'));
const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const Profile = lazy(() => import('@/dashboards/forecaster/pages/Profile'));
const EditProfile = lazy(() => import('@/dashboards/forecaster/pages/EditProfile'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    element: <ForecasterRouteLayout />,
    children: [
      { path: '/studio', element: <StudioBase /> },
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
