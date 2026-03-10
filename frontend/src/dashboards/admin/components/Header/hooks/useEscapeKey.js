import { useEffect } from 'react';

/**
 * Registers a keydown listener that calls `close` when Escape is pressed.
 * The listener is only active while `isOpen` is true.
 *
 * @param {boolean}    isOpen
 * @param {() => void} close
 */
const useEscapeKey = (isOpen, close) => {
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);
};

export default useEscapeKey;