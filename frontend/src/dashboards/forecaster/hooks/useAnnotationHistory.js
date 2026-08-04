import { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_LIMIT = 50;

function validateCommand(command) {
  if (!command || typeof command.undo !== 'function' || typeof command.redo !== 'function') {
    throw new TypeError('History commands require async undo and redo functions.');
  }
}

export function useAnnotationHistory({ projectId, limit = DEFAULT_LIMIT, onError } = {}) {
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const queueRef = useRef(Promise.resolve());
  const projectIdRef = useRef(projectId);
  const [state, setState] = useState({ canUndo: false, canRedo: false, isApplying: false });

  const publishState = useCallback((isApplying = false) => {
    setState({
      canUndo: undoStackRef.current.length > 0,
      canRedo: redoStackRef.current.length > 0,
      isApplying,
    });
  }, []);

  const clear = useCallback(() => {
    undoStackRef.current = [];
    redoStackRef.current = [];
    publishState(false);
  }, [publishState]);

  useEffect(() => {
    if (projectIdRef.current === projectId) return;
    projectIdRef.current = projectId;
    clear();
  }, [clear, projectId]);

  const enqueue = useCallback(
    (operation) => {
      const run = async () => {
        publishState(true);
        try {
          return await operation();
        } catch (error) {
          onError?.(error);
          throw error;
        } finally {
          publishState(false);
        }
      };

      const next = queueRef.current.then(run, run);
      queueRef.current = next.catch(() => undefined);
      return next;
    },
    [onError, publishState]
  );

  const record = useCallback(
    (command) => {
      validateCommand(command);
      undoStackRef.current = [...undoStackRef.current, command].slice(-Math.max(1, limit));
      redoStackRef.current = [];
      publishState(false);
    },
    [limit, publishState]
  );

  const undo = useCallback(() => {
    if (!undoStackRef.current.length) return Promise.resolve(false);

    return enqueue(async () => {
      const command = undoStackRef.current.at(-1);
      await command.undo();
      undoStackRef.current = undoStackRef.current.slice(0, -1);
      redoStackRef.current = [...redoStackRef.current, command];
      publishState(false);
      return true;
    });
  }, [enqueue, publishState]);

  const redo = useCallback(() => {
    if (!redoStackRef.current.length) return Promise.resolve(false);

    return enqueue(async () => {
      const command = redoStackRef.current.at(-1);
      await command.redo();
      redoStackRef.current = redoStackRef.current.slice(0, -1);
      undoStackRef.current = [...undoStackRef.current, command].slice(-Math.max(1, limit));
      publishState(false);
      return true;
    });
  }, [enqueue, limit, publishState]);

  return {
    ...state,
    clear,
    record,
    undo,
    redo,
  };
}
