export const ANNOTATION_HISTORY_RECORD_EVENT = 'wavelab:annotation-history-record';
export const ANNOTATION_HISTORY_REFRESH_EVENT = 'wavelab:annotation-history-refresh';

const pendingCommands = [];
let commandSubscriberCount = 0;

export function publishAnnotationHistoryCommand(command) {
  if (commandSubscriberCount === 0) {
    pendingCommands.push(command);
    return;
  }

  window.dispatchEvent(
    new CustomEvent(ANNOTATION_HISTORY_RECORD_EVENT, {
      detail: command,
    })
  );
}

export function subscribeToAnnotationHistoryCommands(listener) {
  const handleCommand = (event) => listener(event.detail);
  commandSubscriberCount += 1;
  window.addEventListener(ANNOTATION_HISTORY_RECORD_EVENT, handleCommand);

  if (pendingCommands.length > 0) {
    const queuedCommands = pendingCommands.splice(0, pendingCommands.length);
    queuedCommands.forEach((command) => listener(command));
  }

  return () => {
    commandSubscriberCount = Math.max(0, commandSubscriberCount - 1);
    window.removeEventListener(ANNOTATION_HISTORY_RECORD_EVENT, handleCommand);
  };
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
