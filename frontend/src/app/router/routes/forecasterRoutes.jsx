import { lazy } from 'react';
import ProtectedRoute from '@/middleware/ProtectedRoute';
import ForecasterShell from '@/dashboards/forecaster/layout/ForecasterShell';

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
        <ForecasterShell>
          <StudioBase />
        </ForecasterShell>
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
        <ForecasterShell>
          <Profile />
        </ForecasterShell>
      </ProtectedRoute>
    ),
  },
  {
    path: '/edit-profile',
    element: (
      <ProtectedRoute requireAuth={true}>
        <ForecasterShell>
          <EditProfile />
        </ForecasterShell>
      </ProtectedRoute>
    ),
  },
  { path: '/pdf', element: <PdfGenerator /> },
];