import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  CHART_STYLE_STORAGE_KEY,
  DEFAULT_CHART_STYLE_MODE,
  normalizeChartStyleMode,
} from '@/features/projects/utils/chartStyleModes';

const ChartTypeContext = createContext(null);

function getInitialChartStyleMode() {
  if (typeof window === 'undefined') return DEFAULT_CHART_STYLE_MODE;

  try {
    return normalizeChartStyleMode(window.localStorage.getItem(CHART_STYLE_STORAGE_KEY));
  } catch {
    return DEFAULT_CHART_STYLE_MODE;
  }
}

export const ChartTypeProvider = ({ children }) => {
  const [activeChartTypeState, setActiveChartTypeState] = useState(getInitialChartStyleMode);

  const setActiveChartType = useCallback((nextValue) => {
    setActiveChartTypeState((current) => {
      const value = normalizeChartStyleMode(typeof nextValue === 'function' ? nextValue(current) : nextValue);

      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(CHART_STYLE_STORAGE_KEY, value);
        } catch {
          // Ignore storage failures; the in-memory style mode still works.
        }
      }

      return value;
    });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      window.localStorage.setItem(CHART_STYLE_STORAGE_KEY, activeChartTypeState);
    } catch {
      // Ignore storage failures; the selected style mode is non-critical state.
    }
  }, [activeChartTypeState]);

  const value = useMemo(
    () => ({ activeChartType: activeChartTypeState, setActiveChartType }),
    [activeChartTypeState, setActiveChartType]
  );

  return (
    <ChartTypeContext.Provider value={value}>
      {children}
    </ChartTypeContext.Provider>
  );
};

export const useChartType = () => {
  const ctx = useContext(ChartTypeContext);
  if (!ctx) throw new Error('useChartType must be used inside ChartTypeProvider');
  return ctx;
};
