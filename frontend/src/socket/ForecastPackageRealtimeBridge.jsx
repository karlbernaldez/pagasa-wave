import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import socket from './socketClient';
import { scheduleRealtimeWork } from './realtimeScheduler';

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

const INVALIDATE_KEY = 'forecast-realtime:invalidate';
const BOARD_REFRESH_KEY = 'forecast-realtime:board-refresh';

function invalidateForecastQueries(queryClient) {
  QUERY_KEY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}

function dispatchBrowserEvent(name, payload) {
  window.dispatchEvent(new CustomEvent(name, { detail: payload || {} }));
}

function getPayloadKey(payload = {}) {
  return String(payload.projectId || payload.packageId || payload.action || 'global');
}

function dispatchChartEventsForPackage(payload = {}, shouldDispatchBrowserEvent) {
  if (payload.projectId) {
    if (shouldDispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload)) {
      dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload);
    }
    return;
  }

  if (!Array.isArray(payload.projectIds)) return;

  payload.projectIds.forEach((projectId) => {
    if (!projectId) return;
    const chartPayload = { ...payload, projectId };
    if (shouldDispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, chartPayload)) {
      dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, chartPayload);
    }
  });
}

function scheduleInvalidation(queryClient) {
  scheduleRealtimeWork(INVALIDATE_KEY, () => invalidateForecastQueries(queryClient), {
    delayMs: 250,
    minIntervalMs: 1200,
  });
}

function scheduleBoardRefresh() {
  if (window.location.pathname !== '/studio') return;

  scheduleRealtimeWork(BOARD_REFRESH_KEY, () => window.location.reload(), {
    delayMs: 600,
    minIntervalMs: 5000,
  });
}

export default function ForecastPackageRealtimeBridge() {
  const queryClient = useQueryClient();
  const lastBrowserEventAtRef = useRef(new Map());

  useEffect(() => {
    const shouldDispatchBrowserEvent = (eventName, payload = {}) => {
      const key = `${eventName}:${getPayloadKey(payload)}:${payload.action || ''}`;
      const now = Date.now();
      const lastAt = lastBrowserEventAtRef.current.get(key) || 0;
      if (now - lastAt < 300) return false;
      lastBrowserEventAtRef.current.set(key, now);
      return true;
    };

    const handlePackageUpdated = (payload = {}) => {
      scheduleInvalidation(queryClient);
      if (shouldDispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload)) {
        dispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload);
      }
      dispatchChartEventsForPackage(payload, shouldDispatchBrowserEvent);
      scheduleBoardRefresh();
    };

    const handleChartUpdated = (payload = {}) => {
      scheduleInvalidation(queryClient);
      if (shouldDispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload)) {
        dispatchBrowserEvent(FORECAST_CHART_BROWSER_EVENT, payload);
      }
      if (shouldDispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload)) {
        dispatchBrowserEvent(FORECAST_PACKAGE_BROWSER_EVENT, payload);
      }
      scheduleBoardRefresh();
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
