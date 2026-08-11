import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_LIMIT = 50;
const historyByProject = new Map();

function getProjectKey(projectId) {
  return String(projectId || '__no_project__');
}

function getProjectHistory(projectId) {
  const key = getProjectKey(projectId);
  if (!historyByProject.has(key)) {
    historyByProject.set(key, {
      undoStack: [],
      redoStack: [],
      queue: Promise.resolve(),
      generation: 0,
    });
  }
  return historyByProject.get(key);
}

function resetHistory(history) {
  history.undoStack = [];
  history.redoStack = [];
  history.queue = Promise.resolve();
  history.generation += 1;
  return history;
}

function validateCommand(command) {
  if (!command || typeof command.undo !== 'function' || typeof command.redo !== 'function') {
    throw new TypeError('History commands require async undo and redo functions.');
  }
}

export function useAnnotationHistory({ projectId, limit = DEFAULT_LIMIT, onError } = {}) {
  const projectKey = getProjectKey(projectId);
  const historyRef = useRef(getProjectHistory(projectId));
  const projectKeyRef = useRef(projectKey);
  const [state, setState] = useState(() => {
    const history = getProjectHistory(projectId);
    return {
      canUndo: history.undoStack.length > 0,
      canRedo: history.redoStack.length > 0,
      isApplying: false,
    };
  });

  const isCurrentHistory = useCallback(
    (history, generation) =>
      historyRef.current === history && history.generation === generation,
    []
  );

  const publishState = useCallback(
    (history = historyRef.current, generation = history.generation, isApplying = false) => {
      if (historyRef.current !== history || history.generation !== generation) return;

      setState({
        canUndo: history.undoStack.length > 0,
        canRedo: history.redoStack.length > 0,
        isApplying,
      });
    },
    []
  );

  useEffect(() => {
    if (projectKeyRef.current === projectKey) {
      const history = historyRef.current;
      publishState(history, history.generation, false);
      return;
    }

    projectKeyRef.current = projectKey;
    const history = resetHistory(getProjectHistory(projectId));
    historyRef.current = history;
    publishState(history, history.generation, false);
  }, [projectId, projectKey, publishState]);

  const clear = useCallback(() => {
    const history = resetHistory(historyRef.current);
    publishState(history, history.generation, false);
  }, [publishState]);

  const enqueue = useCallback(
    (operation) => {
      const history = historyRef.current;
      const generation = history.generation;
      const run = async () => {
        if (!isCurrentHistory(history, generation)) return false;

        publishState(history, generation, true);
        try {
          return await operation(history, generation);
        } finally {
          publishState(history, generation, false);
        }
      };

      const next = history.queue.then(run, run);
      history.queue = next.catch(() => undefined);
      return next;
    },
    [isCurrentHistory, publishState]
  );

  const record = useCallback(
    (command) => {
      validateCommand(command);
      const history = historyRef.current;
      history.undoStack = [...history.undoStack, command].slice(-Math.max(1, limit));
      history.redoStack = [];
      publishState(history, history.generation, false);
    },
    [limit, publishState]
  );

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (!history.undoStack.length) return Promise.resolve(false);

    return enqueue(async (queuedHistory, generation) => {
      const command = queuedHistory.undoStack.at(-1);
      try {
        await command.undo();
      } catch (error) {
        if (isCurrentHistory(queuedHistory, generation)) onError?.(error);
        throw error;
      }

      if (!isCurrentHistory(queuedHistory, generation)) return true;

      queuedHistory.undoStack = queuedHistory.undoStack.slice(0, -1);
      queuedHistory.redoStack = [...queuedHistory.redoStack, command];
      publishState(queuedHistory, generation, false);
      return true;
    });
  }, [enqueue, isCurrentHistory, onError, publishState]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (!history.redoStack.length) return Promise.resolve(false);

    return enqueue(async (queuedHistory, generation) => {
      const command = queuedHistory.redoStack.at(-1);
      try {
        await command.redo();
      } catch (error) {
        if (isCurrentHistory(queuedHistory, generation)) onError?.(error);
        throw error;
      }

      if (!isCurrentHistory(queuedHistory, generation)) return true;

      queuedHistory.redoStack = queuedHistory.redoStack.slice(0, -1);
      queuedHistory.undoStack = [...queuedHistory.undoStack, command].slice(-Math.max(1, limit));
      publishState(queuedHistory, generation, false);
      return true;
    });
  }, [enqueue, isCurrentHistory, limit, onError, publishState]);

  return {
    ...state,
    clear,
    record,
    undo,
    redo,
  };
}
