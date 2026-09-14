import { lazy } from 'react';

import ForecasterRouteLayout from '@/dashboards/forecaster/layout/ForecasterRouteLayout';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const ForecastPackageListPage = lazy(
  () => import('@/dashboards/forecaster/pages/ProjectLibraryPage')
);
const ForecastReviewQueuePage = lazy(
  () => import('@/dashboards/admin/sections/chart-review/AdminForecastPackageReviewPageV2')
);

export default [
  {
    element: <ForecasterRouteLayout />,
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
    ],
  },
];
