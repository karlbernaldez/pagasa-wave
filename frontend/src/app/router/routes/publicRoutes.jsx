import { lazy } from 'react';
import ProtectedRoute from '@/middleware/ProtectedRoute';

const Home = lazy(() => import('@/dashboards/public/pages/Home'));
const Login = lazy(() => import('@/pages/Login'));
const Register = lazy(() => import('@/pages/Register'));
const Charts = lazy(() => import('@/dashboards/public/pages/Charts'));
const AboutUs = lazy(() => import('@/dashboards/public/pages/AboutUs'));
const Contact = lazy(() => import('@/dashboards/public/pages/Contact'));

export default [
  { path: '/', element: <Home /> },
  {
    path: '/login',
    element: (
      <ProtectedRoute requireAuth={false} authenticatedRedirect="/studio">
        <Login />
      </ProtectedRoute>
    ),
  },
  { path: '/register', element: <Register /> },
  { path: '/charts', element: <Charts /> },
  { path: '/about-us', element: <AboutUs /> },
  { path: '/contact', element: <Contact /> },
];
