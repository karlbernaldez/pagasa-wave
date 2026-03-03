import { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from '../layout/RootLayout';
import LoadingScreen from '@/components/ui/LoadingScreen';

import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import forecasterRoutes from './routes/forecasterRoutes';

const renderRoutes = (routes) =>
  routes.map(({ path, element, children }) => (
    <Route key={path} path={path} element={element}>
      {children && renderRoutes(children)}
    </Route>
  ));

const AppRouter = () => (
  <Suspense fallback={<LoadingScreen />}>
    <Routes>
      <Route element={<RootLayout />}>
        {renderRoutes(publicRoutes)}
        {renderRoutes(adminRoutes)}
        {renderRoutes(forecasterRoutes)}
      </Route>
    </Routes>
  </Suspense>
);

export default AppRouter;
