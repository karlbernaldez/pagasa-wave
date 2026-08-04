import { useCallback, useEffect, useRef } from 'react';
import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';

const isEditableTarget = (target) => {
  if (!(target instanceof HTMLElement)) return false;

  return Boolean(
    target.closest(
      'input, textarea, select, button, [contenteditable="true"], [role="textbox"], [role="dialog"]'
    )
  );
};

const hasOpenModal = (openModals) => Object.values(openModals || {}).some(Boolean);

export function useSpacebarPan({
  disabled = false,
  isWaveActive = false,
  isFrontActive = false,
  onToggleCanvas,
  onToggleFlagCanvas,
  openModals,
}) {
  const pausedInteractionRef = useRef(null);
  const activeStateRef = useRef({ isWaveActive, isFrontActive });

  useEffect(() => {
    activeStateRef.current = { isWaveActive, isFrontActive };
  }, [isWaveActive, isFrontActive]);

  const restoreDrawingInteraction = useCallback(() => {
    const pausedInteraction = pausedInteractionRef.current;
    if (!pausedInteraction) return;

    pausedInteractionRef.current = null;

    if (pausedInteraction.waveWasActive) {
      onToggleCanvas?.(true);
    }

    if (pausedInteraction.frontWasActive) {
      onToggleFlagCanvas?.(true);
    }

    const canvas = pausedInteraction.map?.getCanvas?.();
    if (canvas) {
      canvas.style.cursor = pausedInteraction.previousCursor;
    }
  }, [onToggleCanvas, onToggleFlagCanvas]);

  const suspendDrawingInteraction = useCallback(() => {
    if (pausedInteractionRef.current) return false;

    const { isWaveActive: waveWasActive, isFrontActive: frontWasActive } =
      activeStateRef.current;

    if (!waveWasActive && !frontWasActive) return false;

    const map = getLatestMapInstance();
    if (!map) return false;

    const canvas = map.getCanvas?.();
    pausedInteractionRef.current = {
      map,
      waveWasActive,
      frontWasActive,
      previousCursor: canvas?.style?.cursor || '',
    };

    if (waveWasActive) {
      onToggleCanvas?.(false);
    }

    if (frontWasActive) {
      onToggleFlagCanvas?.(false);
    }

    map.dragPan?.enable?.();
    if (canvas) canvas.style.cursor = 'grab';

    return true;
  }, [onToggleCanvas, onToggleFlagCanvas]);

  useEffect(() => {
    if (disabled) {
      restoreDrawingInteraction();
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (
        event.code !== 'Space' ||
        event.repeat ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        isEditableTarget(event.target) ||
        hasOpenModal(openModals)
      ) {
        return;
      }

      if (suspendDrawingInteraction()) {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event) => {
      if (event.code !== 'Space') return;

      if (pausedInteractionRef.current) {
        event.preventDefault();
        restoreDrawingInteraction();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('keyup', handleKeyUp, true);
    window.addEventListener('blur', restoreDrawingInteraction);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('keyup', handleKeyUp, true);
      window.removeEventListener('blur', restoreDrawingInteraction);
      restoreDrawingInteraction();
    };
  }, [disabled, openModals, restoreDrawingInteraction, suspendDrawingInteraction]);
}
