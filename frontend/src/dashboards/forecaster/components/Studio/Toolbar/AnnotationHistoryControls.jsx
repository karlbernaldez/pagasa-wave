import { useEffect } from 'react';
import { LoaderCircle, Redo2, Undo2 } from 'lucide-react';

import { useAnnotationHistory } from '@dashboards/forecaster/hooks/useAnnotationHistory';
import { subscribeToAnnotationHistoryCommands } from '@dashboards/forecaster/history/annotationHistoryEvents';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export default function AnnotationHistoryControls({ disabled = false, projectId, theme }) {
  const { canUndo, canRedo, isApplying, record, undo, redo } = useAnnotationHistory({
    projectId,
    onError: (error) => console.error('[ANNOTATION HISTORY ERROR]', error),
  });

  useEffect(() => subscribeToAnnotationHistoryCommands(record), [record]);

  const controlsDisabled = disabled || isApplying;

  return (
    <div className="flex shrink-0 items-center gap-1.5" aria-label="Annotation history controls">
      <button
        type="button"
        aria-label="Undo last annotation change"
        title="Undo"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => void undo()}
        disabled={controlsDisabled || !canUndo}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl border opacity-100 transition-colors disabled:opacity-100',
          controlsDisabled || !canUndo ? theme.disabled : theme.button
        )}
      >
        {isApplying ? (
          <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
        ) : (
          <Undo2 size={16} aria-hidden="true" />
        )}
      </button>
      <button
        type="button"
        aria-label="Redo last annotation change"
        title="Redo"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => void redo()}
        disabled={controlsDisabled || !canRedo}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-2xl border opacity-100 transition-colors disabled:opacity-100',
          controlsDisabled || !canRedo ? theme.disabled : theme.button
        )}
      >
        <Redo2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}
