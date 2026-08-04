export const ANNOTATION_HISTORY_RECORD_EVENT = 'wavelab:annotation-history-record';
export const ANNOTATION_HISTORY_REFRESH_EVENT = 'wavelab:annotation-history-refresh';

export function publishAnnotationHistoryCommand(command) {
  window.dispatchEvent(
    new CustomEvent(ANNOTATION_HISTORY_RECORD_EVENT, {
      detail: command,
    })
  );
}

export function subscribeToAnnotationHistoryCommands(listener) {
  const handleCommand = (event) => listener(event.detail);
  window.addEventListener(ANNOTATION_HISTORY_RECORD_EVENT, handleCommand);
  return () => window.removeEventListener(ANNOTATION_HISTORY_RECORD_EVENT, handleCommand);
}

export function subscribeToAnnotationHistoryRefresh(listener) {
  const handleRefresh = (event) => listener(event.detail || {});
  window.addEventListener(ANNOTATION_HISTORY_REFRESH_EVENT, handleRefresh);
  return () => window.removeEventListener(ANNOTATION_HISTORY_REFRESH_EVENT, handleRefresh);
}

export function requestAnnotationHistoryRefresh(projectId) {
  window.dispatchEvent(
    new CustomEvent(ANNOTATION_HISTORY_REFRESH_EVENT, {
      detail: { projectId },
    })
  );
}
