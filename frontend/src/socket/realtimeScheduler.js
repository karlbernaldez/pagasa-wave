const DEFAULT_DELAY_MS = 250;
const DEFAULT_MIN_INTERVAL_MS = 1000;

const jobs = new Map();
const lastRunAtByKey = new Map();

export function scheduleRealtimeWork(key, work, options = {}) {
  if (!key || typeof work !== 'function') return;

  const delayMs = Number.isFinite(options.delayMs) ? options.delayMs : DEFAULT_DELAY_MS;
  const minIntervalMs = Number.isFinite(options.minIntervalMs) ? options.minIntervalMs : DEFAULT_MIN_INTERVAL_MS;
  const now = Date.now();
  const lastRunAt = lastRunAtByKey.get(key) || 0;
  const waitForInterval = Math.max(0, minIntervalMs - (now - lastRunAt));
  const waitMs = Math.max(delayMs, waitForInterval);

  const existing = jobs.get(key);
  if (existing?.timerId) {
    clearTimeout(existing.timerId);
  }

  const timerId = window.setTimeout(async () => {
    const job = jobs.get(key);
    if (!job || job.timerId !== timerId) return;

    jobs.delete(key);
    lastRunAtByKey.set(key, Date.now());

    try {
      await job.work();
    } catch (error) {
      console.error('[RealtimeScheduler] scheduled work failed:', error);
    }
  }, waitMs);

  jobs.set(key, { timerId, work });
}

export function cancelRealtimeWork(key) {
  const existing = jobs.get(key);
  if (!existing) return;

  clearTimeout(existing.timerId);
  jobs.delete(key);
}

export function cancelRealtimeWorkByPrefix(prefix) {
  if (!prefix) return;

  [...jobs.keys()].forEach((key) => {
    if (String(key).startsWith(prefix)) cancelRealtimeWork(key);
  });
}
