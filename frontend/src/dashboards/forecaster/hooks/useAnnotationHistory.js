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
    });
  }
  return historyByProject.get(key);
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

  const publishState = useCallback((isApplying = false) => {
    const history = historyRef.current;
    setState({
      canUndo: history.undoStack.length > 0,
      canRedo: history.redoStack.length > 0,
      isApplying,
    });
  }, []);

  useEffect(() => {
    if (projectKeyRef.current === projectKey) {
      publishState(false);
      return;
    }

    projectKeyRef.current = projectKey;
    historyRef.current = getProjectHistory(projectId);
    publishState(false);
  }, [projectId, projectKey, publishState]);

  const clear = useCallback(() => {
    const history = historyRef.current;
    history.undoStack = [];
    history.redoStack = [];
    publishState(false);
  }, [publishState]);

  const enqueue = useCallback(
    (operation) => {
      const history = historyRef.current;
      const run = async () => {
        publishState(true);
        try {
          return await operation();
        } finally {
          publishState(false);
        }
      };

      const next = history.queue.then(run, run);
      history.queue = next.catch(() => undefined);
      return next;
    },
    [publishState]
  );

  const record = useCallback(
    (command) => {
      validateCommand(command);
      const history = historyRef.current;
      history.undoStack = [...history.undoStack, command].slice(-Math.max(1, limit));
      history.redoStack = [];
      publishState(false);
    },
    [limit, publishState]
  );

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (!history.undoStack.length) return Promise.resolve(false);

    return enqueue(async () => {
      const command = history.undoStack.at(-1);
      try {
        await command.undo();
      } catch (error) {
        onError?.(error);
        throw error;
      }
      history.undoStack = history.undoStack.slice(0, -1);
      history.redoStack = [...history.redoStack, command];
      publishState(false);
      return true;
    });
  }, [enqueue, onError, publishState]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (!history.redoStack.length) return Promise.resolve(false);

    return enqueue(async () => {
      const command = history.redoStack.at(-1);
      try {
        await command.redo();
      } catch (error) {
        onError?.(error);
        throw error;
      }
      history.redoStack = history.redoStack.slice(0, -1);
      history.undoStack = [...history.undoStack, command].slice(-Math.max(1, limit));
      publishState(false);
      return true;
    });
  }, [enqueue, limit, onError, publishState]);

  return {
    ...state,
    clear,
    record,
    undo,
    redo,
  };
}
