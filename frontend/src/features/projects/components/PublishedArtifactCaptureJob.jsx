import { useEffect, useMemo, useRef, useState } from 'react';

import { uploadPublishedChartSnapshot } from '@/api/forecastPackageAPI';
import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import { CHART_STYLE_MODES } from '@/features/projects/utils/chartStyleModes';

const CAPTURE_TIMEOUT_MS = 45_000;
const CAPTURE_POLL_MS = 250;

function getId(value) {
  return value?._id || value?.id || value || '';
}

export default function PublishedArtifactCaptureJob({
  packageId,
  charts = [],
  onProgress,
  onComplete,
  onError,
}) {
  const mapRef = useRef(null);
  const outputCacheRef = useRef(new Map());
  const uploadingRef = useRef(false);
  const completionReportedRef = useRef(false);
  const [taskIndex, setTaskIndex] = useState(0);
  const [outputState, setOutputState] = useState({
    key: '',
    loading: false,
    output: null,
    error: '',
  });

  const tasks = useMemo(
    () =>
      CHART_STYLE_MODES.flatMap((style) =>
        charts
          .map((chart) => ({
            style: style.id,
            chartType: chart?.chartType,
            projectId: getId(chart?.project),
          }))
          .filter((task) => task.chartType && task.projectId)
      ),
    [charts]
  );

  const task = tasks[taskIndex] || null;
  const taskKey = task ? `${task.style}:${task.chartType}:${task.projectId}` : '';

  useEffect(() => {
    completionReportedRef.current = false;
    setTaskIndex(0);
    outputCacheRef.current = new Map();
  }, [packageId, tasks]);

  useEffect(() => {
    if (!packageId || tasks.length === 0 || taskIndex < tasks.length) return;
    if (completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.();
  }, [onComplete, packageId, taskIndex, tasks.length]);

  useEffect(() => {
    if (!task || !taskKey) return undefined;

    let cancelled = false;
    const cached = outputCacheRef.current.get(task.projectId);
    if (cached) {
      setOutputState({ key: taskKey, loading: false, output: cached, error: '' });
      return undefined;
    }

    setOutputState({ key: taskKey, loading: true, output: null, error: '' });

    fetchPublicPublishedChartOutput(task.projectId, { theme: 'light' })
      .then((output) => {
        if (cancelled) return;
        outputCacheRef.current.set(task.projectId, output);
        setOutputState({ key: taskKey, loading: false, output, error: '' });
      })
      .catch((error) => {
        if (cancelled) return;
        const message = error?.message || 'Failed to load the published chart for snapshot capture.';
        setOutputState({ key: taskKey, loading: false, output: null, error: message });
        onError?.(message);
      });

    return () => {
      cancelled = true;
    };
  }, [onError, task, taskKey]);

  useEffect(() => {
    if (!packageId || !task || outputState.key !== taskKey || !outputState.output) {
      return undefined;
    }

    let cancelled = false;
    let timer = 0;
    const startedAt = Date.now();

    const checkCapture = async () => {
      if (cancelled || uploadingRef.current) return;

      if (Date.now() - startedAt > CAPTURE_TIMEOUT_MS) {
        const message = `Timed out preparing ${task.chartType} (${task.style}) for published PDF capture.`;
        onError?.(message);
        return;
      }

      const instance = mapRef.current;
      if (!instance?.isReady || !instance?.getDataUrl) {
        timer = window.setTimeout(checkCapture, CAPTURE_POLL_MS);
        return;
      }

      uploadingRef.current = true;
      try {
        const imageDataUrl = instance.getDataUrl();
        await uploadPublishedChartSnapshot(packageId, {
          style: task.style,
          chartType: task.chartType,
          projectId: task.projectId,
          imageDataUrl,
        });

        if (cancelled) return;
        const completed = taskIndex + 1;
        onProgress?.({
          completed,
          total: tasks.length,
          style: task.style,
          chartType: task.chartType,
        });
        mapRef.current = null;
        setTaskIndex(completed);
      } catch (error) {
        if (!cancelled) {
          onError?.(error?.message || 'Failed to store a published chart snapshot.');
        }
      } finally {
        uploadingRef.current = false;
      }
    };

    timer = window.setTimeout(checkCapture, CAPTURE_POLL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [
    onError,
    onProgress,
    outputState.key,
    outputState.output,
    packageId,
    task,
    taskIndex,
    taskKey,
    tasks.length,
  ]);

  if (!task || outputState.key !== taskKey || !outputState.output) return null;

  return (
    <PublishedForecastExportMap
      key={taskKey}
      ref={mapRef}
      projectId={task.projectId}
      features={outputState.output.featureCollection}
      chartStyleMode={task.style}
      raster={outputState.output.raster}
      isDarkModeOverride={false}
    />
  );
}
