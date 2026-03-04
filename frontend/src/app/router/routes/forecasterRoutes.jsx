import { lazy } from 'react';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const StudioBase = lazy(() => import('@/dashboards/forecaster/pages/StudioBase'));
const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const Profile = lazy(() => import('@/dashboards/forecaster/pages/Profile'));
const EditProfile = lazy(() => import('@/dashboards/forecaster/pages/EditProfile'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    path: '/studio',
    element: (
      <ProtectedRoute requireAuth={true}>
        <StudioBase />
      </ProtectedRoute>
    ),
  },
  {
    path: '/studio/:projectId',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Studio />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-profile',
    element: (
      <ProtectedRoute requireAuth={true}>
        <EditProfile />
      </ProtectedRoute>
    ),
  },
  { path: '/pdf', element: <PdfGenerator /> },
];