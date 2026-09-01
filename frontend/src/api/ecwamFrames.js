import api from './axios';

const POLL_INTERVAL_MS = 1500;
const BUSY_RETRY_INTERVAL_MS = 6000;
const DEFAULT_TIMEOUT_MS = 180000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const framePath = (packageDate, forecastHour) =>
  `/ecwam/frames/${encodeURIComponent(packageDate)}/${Number(forecastHour)}`;

const apiMessage = (error, fallback) =>
  error?.response?.data?.message || error?.message || fallback;

export async function getEcwamFrameStatus(packageDate, forecastHour) {
  try {
    const { data } = await api.get(framePath(packageDate, forecastHour));
    return data;
  } catch (error) {
    if (error?.response?.data?.state) return error.response.data;
    throw new Error(apiMessage(error, 'Unable to check the ECWAM frame cache.'), { cause: error });
  }
}

export async function requestEcwamFrameBuild(packageDate, forecastHour) {
  try {
    const { data } = await api.post(framePath(packageDate, forecastHour));
    return data;
  } catch (error) {
    if (error?.response?.data?.state) return error.response.data;
    throw new Error(apiMessage(error, 'Unable to request the ECWAM frame build.'), { cause: error });
  }
}

export async function ensureEcwamFrameReady(
  packageDate,
  forecastHour,
  { timeoutMs = DEFAULT_TIMEOUT_MS, pollIntervalMs = POLL_INTERVAL_MS } = {}
) {
  const startedAt = Date.now();
  let nextBuildAttemptAt = startedAt;
  let status = await getEcwamFrameStatus(packageDate, forecastHour);

  if (status.state === 'ready') return status;
  if (status.state === 'invalid' || status.state === 'unavailable') return status;

  if (status.state === 'available' || status.state === 'failed') {
    status = await requestEcwamFrameBuild(packageDate, forecastHour);
    if (status.state === 'busy') {
      nextBuildAttemptAt = Date.now() + BUSY_RETRY_INTERVAL_MS;
    }
  }

  if (status.state === 'ready') return status;
  if (['invalid', 'unavailable', 'failed', 'rate_limited'].includes(status.state)) return status;

  while (Date.now() - startedAt < timeoutMs) {
    await sleep(pollIntervalMs);
    status = await getEcwamFrameStatus(packageDate, forecastHour);

    if (status.state === 'ready') return status;
    if (['invalid', 'unavailable', 'failed'].includes(status.state)) return status;

    if (status.state === 'available' && Date.now() >= nextBuildAttemptAt) {
      status = await requestEcwamFrameBuild(packageDate, forecastHour);
      if (status.state === 'ready') return status;
      if (['invalid', 'unavailable', 'failed', 'rate_limited'].includes(status.state)) return status;
      if (status.state === 'busy') {
        nextBuildAttemptAt = Date.now() + BUSY_RETRY_INTERVAL_MS;
      }
    }
  }

  return {
    ...status,
    state: 'timeout',
    message: 'ECWAM frame generation is taking longer than expected.',
  };
}
