import { useEffect, useMemo, useRef, useState } from 'react';

import { uploadPublishedChartSnapshot } from '@/api/forecastPackageAPI';
import { fetchPublicPublishedChartOutput } from '@/api/publishedForecastAPI';
import PublishedForecastExportMap from '@/features/projects/components/PublishedForecastExportMap';
import { CHART_STYLE_MODES } from '@/features/projects/utils/chartStyleModes';

const CAPTURE_TIMEOUT_MS = 45_000;
const CAPTURE_POLL_MS = 250;
const RETRY_DELAY_MS = 1_000;
const MAX_CAPTURE_ATTEMPTS = 3;

function getId(value) {
  return value?._id || value?.id || value || '';
}

function getTaskKey(task) {
  return `${task.style}:${task.chartType}:${task.projectId}`;
}

function getReadyTaskKeys(readiness) {
  const ready = new Set();

  CHART_STYLE_MODES.forEach((style) => {
    const readyChartTypes = readiness?.styles?.[style.id]?.readyChartTypes || [];
    readyChartTypes.forEach((chartType) => ready.add(`${style.id}:${chartType}`));
  });

  return ready;
}

export function buildPublishedArtifactCaptureTasks(charts = [], readiness = null) {
  const readyTaskKeys = getReadyTaskKeys(readiness);
  const allTasks = CHART_STYLE_MODES.flatMap((style) =>
    charts
      .map((chart) => ({
        style: style.id,
        chartType: chart?.chartType,
        projectId: getId(chart?.project),
      }))
      .filter((task) => task.chartType && task.projectId)
  );

  const pendingTasks = allTasks.filter(
    (task) => !readyTaskKeys.has(`${task.style}:${task.chartType}`)
  );

  return {
    allTasks,
    pendingTasks,
    completedCount: allTasks.length - pendingTasks.length,
  };
}

export default function PublishedArtifactCaptureJob({
  packageId,
  charts = [],
  initialReadiness = null,
  onProgress,
  onComplete,
  onError,
}) {
  const mapRef = useRef(null);
  const outputCacheRef = useRef(new Map());
  const uploadingRef = useRef(false);
  const completionReportedRef = useRef(false);
  const attemptsRef = useRef(new Map());
  const [taskIndex, setTaskIndex] = useState(0);
  const [captureRetryToken, setCaptureRetryToken] = useState(0);
  const [outputState, setOutputState] = useState({
    key: '',
    loading: false,
    output: null,
    error: '',
  });

  const taskPlan = useMemo(
    () => buildPublishedArtifactCaptureTasks(charts, initialReadiness),
    [charts, initialReadiness]
  );
  const tasks = taskPlan.pendingTasks;
  const task = tasks[taskIndex] || null;
  const taskKey = task ? getTaskKey(task) : '';

  useEffect(() => {
    completionReportedRef.current = false;
    attemptsRef.current = new Map();
    setTaskIndex(0);
    setCaptureRetryToken(0);
    outputCacheRef.current = new Map();

    onProgress?.({
      completed: taskPlan.completedCount,
      total: taskPlan.allTasks.length,
      status: tasks.length ? 'capturing' : 'complete',
    });
  }, [
    onProgress,
    packageId,
    taskPlan.allTasks.length,
    taskPlan.completedCount,
    tasks.length,
  ]);

  useEffect(() => {
    if (!packageId || taskIndex < tasks.length) return;
    if (completionReportedRef.current) return;
    completionReportedRef.current = true;
    onComplete?.();
  }, [onComplete, packageId, taskIndex, tasks.length]);

  useEffect(() => {
    if (!task || !taskKey) return undefined;

    let cancelled = false;
    let retryTimer = 0;
    const cached = outputCacheRef.current.get(task.projectId);
    if (cached) {
      setOutputState({ key: taskKey, loading: false, output: cached, error: '' });
      return undefined;
    }

    setOutputState({ key: taskKey, loading: true, output: null, error: '' });

    let attempt = 0;
    const loadOutput = async () => {
      attempt += 1;

      try {
        const output = await fetchPublicPublishedChartOutput(task.projectId, { theme: 'light' });
        if (cancelled) return;

        outputCacheRef.current.set(task.projectId, output);
        setOutputState({ key: taskKey, loading: false, output, error: '' });
      } catch (error) {
        if (cancelled) return;

        const message = error?.message || 'Failed to load the published chart for snapshot capture.';
        if (attempt < MAX_CAPTURE_ATTEMPTS) {
          onProgress?.({
            completed: taskPlan.completedCount + taskIndex,
            total: taskPlan.allTasks.length,
            style: task.style,
            chartType: task.chartType,
            status: 'retrying',
            attempt: attempt + 1,
            message,
          });
          retryTimer = window.setTimeout(loadOutput, RETRY_DELAY_MS);
          return;
        }

        setOutputState({ key: taskKey, loading: false, output: null, error: message });
        onError?.(
          `${message} Failed after ${MAX_CAPTURE_ATTEMPTS} attempts for ${task.chartType} (${task.style}).`
        );
      }
    };

    void loadOutput();

    return () => {
      cancelled = true;
      if (retryTimer) window.clearTimeout(retryTimer);
    };
  }, [
    onError,
    onProgress,
    task,
    taskIndex,
    taskKey,
    taskPlan.allTasks.length,
    taskPlan.completedCount,
  ]);

  useEffect(() => {
    if (!packageId || !task || outputState.key !== taskKey || !outputState.output) {
      return undefined;
    }

    let cancelled = false;
    let timer = 0;
    const startedAt = Date.now();

    const failOrRetry = (message) => {
      const attempts = (attemptsRef.current.get(taskKey) || 0) + 1;
      attemptsRef.current.set(taskKey, attempts);

      if (attempts < MAX_CAPTURE_ATTEMPTS) {
        onProgress?.({
          completed: taskPlan.completedCount + taskIndex,
          total: taskPlan.allTasks.length,
          style: task.style,
          chartType: task.chartType,
          status: 'retrying',
          attempt: attempts + 1,
          message,
        });
        timer = window.setTimeout(
          () => setCaptureRetryToken((value) => value + 1),
          RETRY_DELAY_MS
        );
        return;
      }

      onError?.(
        `${message} Failed after ${MAX_CAPTURE_ATTEMPTS} attempts for ${task.chartType} (${task.style}).`
      );
    };

    const checkCapture = async () => {
      if (cancelled || uploadingRef.current) return;

      if (Date.now() - startedAt > CAPTURE_TIMEOUT_MS) {
        failOrRetry(
          `Timed out preparing ${task.chartType} (${task.style}) for published PDF capture.`
        );
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

        attemptsRef.current.delete(taskKey);
        const completedPendingTasks = taskIndex + 1;
        const completed = taskPlan.completedCount + completedPendingTasks;
        onProgress?.({
          completed,
          total: taskPlan.allTasks.length,
          style: task.style,
          chartType: task.chartType,
          status: completed === taskPlan.allTasks.length ? 'complete' : 'capturing',
        });
        mapRef.current = null;
        setTaskIndex(completedPendingTasks);
      } catch (error) {
        if (!cancelled) {
          failOrRetry(error?.message || 'Failed to store a published chart snapshot.');
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
    captureRetryToken,
    onError,
    onProgress,
    outputState.key,
    outputState.output,
    packageId,
    task,
    taskIndex,
    taskKey,
    taskPlan.allTasks.length,
    taskPlan.completedCount,
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
