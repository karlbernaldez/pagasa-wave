import { lazy } from 'react';
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
const PublicForecastsPage = lazy(() => import('@/features/projects/pages/PublicForecastsPage'));
const PublishedForecastPage = lazy(() => import('@/features/projects/pages/PublishedForecastPage'));

export default [
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/charts', element: <Charts /> },
      { path: '/wave-charts', element: <PublicForecastsPage /> },
      { path: '/wave-charts/:projectId', element: <PublishedForecastPage /> },
      { path: '/forecasts', element: <PublicForecastsPage /> },
      { path: '/forecasts/:projectId', element: <PublishedForecastPage /> },
      { path: '/about-us', element: <AboutUs /> },
      { path: '/contact', element: <Contact /> },
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
