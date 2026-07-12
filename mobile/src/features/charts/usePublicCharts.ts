import { useCallback, useEffect, useMemo, useState } from 'react';

import { fetchPublicPublishedCharts, type PublicChart } from '@/lib/publicCharts';
import { mockCharts } from './mockCharts';
import { toMobileChart } from './publicChartViewModel';

export function usePublicCharts(isDark: boolean) {
  const [projects, setProjects] = useState<PublicChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');

    fetchPublicPublishedCharts({ theme: isDark ? 'dark' : 'light', signal: controller.signal })
      .then((response) => setProjects(response.projects ?? []))
      .catch((reason: unknown) => {
        if (reason instanceof Error && reason.name === 'AbortError') return;
        setError(reason instanceof Error ? reason.message : 'Published charts could not be loaded.');
        setProjects([]);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [isDark, refreshToken]);

  const liveCharts = useMemo(() => projects.map(toMobileChart), [projects]);
  const charts = liveCharts.length ? liveCharts : mockCharts;
  const usingFallback = !loading && !liveCharts.length;

  const refresh = useCallback(() => setRefreshToken((value) => value + 1), []);

  return { projects, charts, liveCharts, loading, error, usingFallback, refresh };
}
