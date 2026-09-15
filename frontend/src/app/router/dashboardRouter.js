import publicRoutes from './routes/publicRoutes';
import forecastRoutes from './routes/forecastRoutes';
import operationalDashboardRoutes from './routes/operationalDashboardRoutes';
import forecasterRoutes from './routes/forecasterRoutes';

export const DASHBOARD_ROUTES = {
  public: publicRoutes,
  forecasts: forecastRoutes,
  dashboard: operationalDashboardRoutes,
  forecaster: forecasterRoutes,
};

export function getAllRoutes() {
  return [...publicRoutes, ...forecastRoutes, ...operationalDashboardRoutes, ...forecasterRoutes];
}
