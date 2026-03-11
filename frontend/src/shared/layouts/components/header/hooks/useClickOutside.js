import { useEffect } from 'react';

/**
 * Calls `handler` when a mousedown event occurs outside all provided refs.
 *
 * @param {React.RefObject|React.RefObject[]} refs  - One or many refs to watch.
 * @param {() => void}                        handler - Callback fired on outside click.
 */
export function useClickOutside(refs, handler) {
  useEffect(() => {
    const targets = Array.isArray(refs) ? refs : [refs];

    const listener = (event) => {
      const isInside = targets.some((ref) => ref.current?.contains(event.target));
      if (!isInside) handler();
    };

    document.addEventListener('mousedown', listener);
    return () => document.removeEventListener('mousedown', listener);
  }, [refs, handler]);
}