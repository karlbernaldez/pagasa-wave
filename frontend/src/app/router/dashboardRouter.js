import publicRoutes from './routes/publicRoutes';
import forecastRoutes from './routes/forecastRoutes';
import adminRoutes from './routes/adminRoutes';
import forecasterRoutes from './routes/forecasterRoutes';

/**
 * Central dashboard router
 * This enables future extraction into independent apps
 */
export const DASHBOARD_ROUTES = {
  public: publicRoutes,
  forecasts: forecastRoutes,
  admin: adminRoutes,
  forecaster: forecasterRoutes,
};

export function getAllRoutes() {
  return [
    ...publicRoutes,
    ...forecastRoutes,
    ...adminRoutes,
    ...forecasterRoutes,
  ];
}
