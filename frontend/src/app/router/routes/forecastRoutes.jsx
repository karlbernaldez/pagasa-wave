import { lazy } from 'react';

import ForecastRouteLayout from '@/features/forecasts/layout/ForecastRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const ForecastPackageListPage = lazy(
  () => import('@/dashboards/forecaster/pages/ProjectLibraryPage')
);
const ForecastPackageDetailPage = lazy(
  () => import('@/features/forecasts/pages/ForecastPackageDetailPage')
);
const ForecastReviewQueuePage = lazy(
  () => import('@/dashboards/admin/sections/chart-review/AdminForecastPackageReviewPageV2')
);

export default [
  {
    element: <ForecastRouteLayout />,
    children: [
      {
        path: '/forecasts',
        element: (
          <ProtectedRoute requireAuth permission="forecast.view">
            <ForecastPackageListPage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/forecasts/review',
        element: (
          <ProtectedRoute requireAuth permission="forecast.review">
            <ForecastReviewQueuePage />
          </ProtectedRoute>
        ),
      },
      {
        path: '/forecasts/:packageId',
        element: (
          <ProtectedRoute requireAuth permission="forecast.view">
            <ForecastPackageDetailPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
];
