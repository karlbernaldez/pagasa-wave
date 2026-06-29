import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import socket from './socketClient';

export const FORECAST_PACKAGE_UPDATED_EVENT = 'forecast-package:updated';
export const FORECAST_CHART_UPDATED_EVENT = 'forecast-chart:updated';
export const FORECAST_PACKAGE_BROWSER_EVENT = 'wavelab:forecast-package-updated';
export const FORECAST_CHART_BROWSER_EVENT = 'wavelab:forecast-chart-updated';

const QUERY_KEY_PREFIXES = [
  ['admin-forecast-packages'],
  ['forecast-package'],
  ['forecast-packages'],
  ['current-forecast-package'],
  ['forecast-package-chart-context'],
  ['admin-projects'],
  ['user-projects'],
  ['project'],
  ['projects'],
];

function invalidateForecastQueries(queryClient) {
  QUERY_KEY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

function dispatchBrowserEvent(name, payload) {
  window.dispatchEvent(new CustomEvent(name, { detail: payload || {} }));
}

function dispatchChartEventsForPackage(payload = {}) {
  if (payload.projectId) {
    dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload);
    return;
  }

  if (!Array.isArray(payload.projectIds)) return;

  payload.projectIds.forEach((projectId) => {
    if (!projectId) return;
    dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, {
      ...payload,
      projectId,
    });
  });
}

function refreshStateOnlyForecastPackagePage() {
  if (window.location.pathname === '/studio') {
    window.location.reload();
  }
}

export default function ForecastPackageRealtimeBridge() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handlePackageUpdated = (payload = {}) => {
      invalidateForecastQueries(queryClient);
      dispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload);
      dispatchChartEventsForPackage(payload);
      refreshStateOnlyForecastPackagePage();
    };

    const handleChartUpdated = (payload = {}) => {
      invalidateForecastQueries(queryClient);
      dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload);
      dispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload);
      refreshStateOnlyForecastPackagePage();
    };

    socket.on(FORECAST_PACKAGE_UPDATED_EVENT, handlePackageUpdated);
    socket.on(FORECAST_CHART_UPDATED_EVENT, handleChartUpdated);

    return () => {
      socket.off(FORECAST_PACKAGE_UPDATED_EVENT, handlePackageUpdated);
      socket.off(FORECAST_CHART_UPDATED_EVENT, handleChartUpdated);
    };
  }, [queryClient]);

  return null;
}
