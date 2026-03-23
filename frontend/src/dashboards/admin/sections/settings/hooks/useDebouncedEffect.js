// hooks/useDebouncedEffect.js
import { useEffect, useRef } from "react";

export function useDebouncedEffect(effect, deps, delay = 600) {
  const cleanupRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (cleanupRef.current) cleanupRef.current();
      cleanupRef.current = effect() ?? null;
    }, delay);

    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}