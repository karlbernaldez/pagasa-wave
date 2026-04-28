import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '../layout/RootLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';
import { getAllRoutes } from './dashboardRouter';

const renderRoutes = (routes) =>
  routes.map(({ path, element, children }, index) => (
    <Route key={path ?? `layout-${index}`} path={path} element={element}>
      {children && renderRoutes(children)}
    </Route>
  ));

const AppRouter = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route element={<RootLayout />}>
        {renderRoutes(getAllRoutes())}
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
