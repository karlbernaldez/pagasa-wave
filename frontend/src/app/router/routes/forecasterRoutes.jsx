import { lazy } from 'react';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const Studio = lazy(() => import('@/dashboards/forecaster/pages/Studio'));
const PdfGenerator = lazy(() => import('@/pages/PdfGenerator'));

export default [
  {
    path: '/studio',
    element: (
      <ProtectedRoute requireAuth={true}>
        <Studio />
      </ProtectedRoute>
    ),
  },
  { path: '/pdf', element: <PdfGenerator /> },
];
