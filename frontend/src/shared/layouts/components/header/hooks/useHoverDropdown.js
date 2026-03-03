import { useState, useRef, useCallback } from 'react';

/**
 * Manages the open/close state for a hover-triggered dropdown with a
 * configurable close delay (prevents flicker when moving between trigger and menu).
 *
 * @param {number} [closeDelay=150] - ms to wait before closing after mouse leave.
 * @returns {{ isOpen, handlers }}
 */
export function useHoverDropdown(closeDelay = 150) {
  const [isOpen, setIsOpen]   = useState(false);
  const timeoutRef             = useRef(null);

  const open = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  }, []);

  const scheduleClose = useCallback(() => {
    timeoutRef.current = setTimeout(() => setIsOpen(false), closeDelay);
  }, [closeDelay]);

  const close = useCallback(() => {
    clearTimeout(timeoutRef.current);
    setIsOpen(false);
  }, []);

  /** Spread these directly onto the wrapping element: <div {...handlers}> */
  const handlers = {
    onMouseEnter: open,
    onMouseLeave: scheduleClose,
  };

  return { isOpen, open, close, handlers };
}