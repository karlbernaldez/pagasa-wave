import publicRoutes from './routes/publicRoutes';
import adminRoutes from './routes/adminRoutes';
import forecasterRoutes from './routes/forecasterRoutes';

/**
 * Central dashboard router
 * This enables future extraction into independent apps
 */
export const DASHBOARD_ROUTES = {
  public: publicRoutes,
  admin: adminRoutes,
  forecaster: forecasterRoutes,
};

export function getAllRoutes() {
  return [
    ...publicRoutes,
    ...adminRoutes,
    ...forecasterRoutes,
  ];
}
