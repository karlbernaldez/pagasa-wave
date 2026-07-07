import { lazy } from 'react';
import { Navigate, useParams } from 'react-router-dom';

import ProtectedRoute from '@/middleware/ProtectedRoute';
import PublicLayout from '@/app/layout/PublicLayout';
import AuthLayout from '@/app/layout/AuthLayout';

const Home = lazy(() => import('@/dashboards/public/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail'));
const Charts = lazy(() => import('@/dashboards/public/pages/Charts'));
const AboutUs = lazy(() => import('@/dashboards/public/pages/AboutUs'));
const Contact = lazy(() => import('@/dashboards/public/pages/Contact'));
const NotFound = lazy(() => import('@/dashboards/public/pages/NotFound'));
const PublishedForecastPage = lazy(() => import('@/features/projects/pages/PublishedForecastPage'));

function LegacyChartRedirect() {
  const { projectId } = useParams();
  return <Navigate to={projectId ? `/charts/${projectId}` : '/charts'} replace />;
}

export default [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/charts', element: <Charts /> },
      { path: '/charts/:projectId', element: <PublishedForecastPage /> },
      { path: '/wave-charts', element: <LegacyChartRedirect /> },
      { path: '/wave-charts/:projectId', element: <LegacyChartRedirect /> },
      { path: '/forecasts', element: <LegacyChartRedirect /> },
      { path: '/forecasts/:projectId', element: <LegacyChartRedirect /> },
      { path: '/about-us', element: <AboutUs /> },
      { path: '/contact', element: <Contact /> },
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      {
        path: '/login',
        element: (
          <ProtectedRoute requireAuth={false} authenticatedRedirect="/studio">
            <Login />
          </ProtectedRoute>
        ),
      },
      { path: '/register', element: <Register /> },
      { path: '/verify-email', element: <VerifyEmail /> },
    ],
  },
];
