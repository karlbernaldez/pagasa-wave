// hooks/useUndoRedoState.js
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export function useUndoRedoState(initialState, opts = {}) {
  const {
    maxHistory = 50,
    isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b),
    hotkeys = true,
  } = opts;

  const [present, setPresent] = useState(initialState);
  const pastRef = useRef([]);
  const futureRef = useRef([]);

  const canUndo = pastRef.current.length > 0;
  const canRedo = futureRef.current.length > 0;

  const set = useCallback((updaterOrValue) => {
    setPresent((prev) => {
      const next =
        typeof updaterOrValue === "function" ? updaterOrValue(prev) : updaterOrValue;

      if (isEqual(prev, next)) return prev;

      pastRef.current.push(prev);
      if (pastRef.current.length > maxHistory) pastRef.current.shift();
      futureRef.current = [];
      return next;
    });
  }, [isEqual, maxHistory]);

  const undo = useCallback(() => {
    setPresent((prev) => {
      if (pastRef.current.length === 0) return prev;
      const previous = pastRef.current.pop();
      futureRef.current.unshift(prev);
      return previous;
    });
  }, []);

  const redo = useCallback(() => {
    setPresent((prev) => {
      if (futureRef.current.length === 0) return prev;
      const next = futureRef.current.shift();
      pastRef.current.push(prev);
      return next;
    });
  }, []);

  // Hotkeys: Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl/Cmd+Y
  useEffect(() => {
    if (!hotkeys) return;

    const onKeyDown = (e) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const mod = isMac ? e.metaKey : e.ctrlKey;

      if (!mod) return;

      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [redo, undo, hotkeys]);

  const api = useMemo(
    () => ({ present, set, undo, redo, canUndo, canRedo }),
    [present, set, undo, redo, canUndo, canRedo]
  );

  return api;
}