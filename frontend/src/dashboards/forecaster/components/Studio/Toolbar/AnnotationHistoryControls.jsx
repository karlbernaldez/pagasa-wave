import { useEffect } from 'react';
import { LoaderCircle, Redo2, Undo2 } from 'lucide-react';

import { fetchFeatures } from '@/api/featureServices';
import {
  subscribeToAnnotationHistoryCommands,
  subscribeToAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';
import { useAnnotationHistory } from '@dashboards/forecaster/hooks/useAnnotationHistory';
import { getLatestMapInstance } from '@dashboards/forecaster/map/helpers/mapInstance';
import { syncAnnotationFeaturesToMap } from '@dashboards/forecaster/utils/mapSetup';
import { applyAnnotationStylesToMap } from '@dashboards/forecaster/utils/layers/annotationStylePersistence';

const cn = (...classes) => classes.filter(Boolean).join(' ');
const FRONT_TYPE_LABELS = {
  cold: 'Cold Front',
  warm: 'Warm Front',
  stationary: 'Stationary Front',
  occluded: 'Occluded Front',
};

function resolveLayerType(feature) {
  const properties = feature?.properties || {};
  if (properties.isFront) {
    return FRONT_TYPE_LABELS[properties.frontType] || feature?.name || 'Surface Front';
  }
  return properties.type || properties.markerType || 'Wave Height';
}

function toLayer(feature) {
  const properties = feature?.properties || {};
  const type = resolveLayerType(feature);
  const id = feature.sourceId || properties.sourceId || properties.stableId;
  const isMarker = ['typhoon', 'low_pressure', 'high_pressure', 'less_1', 'text_note'].includes(type);
  const name = properties.displayName || feature.name || properties.name || properties.title || type;

  return {
    id,
    sourceID: id,
    name,
    visible: true,
    locked: false,
    type,
    markerType: properties.markerType || (isMarker ? type : undefined),
    mapLayerId: properties.mapLayerId || (isMarker ? `${type}_${name}` : undefined),
    owner: properties.owner,
    canEdit: properties.canEdit !== false,
    frontSymbolSide: properties.frontSymbolSide || properties.style?.frontSymbolSide,
    style: properties.style || {},
    properties: { ...properties, displayName: name },
  };
}

export default function AnnotationHistoryControls({
  disabled = false,
  isDarkMode,
  mapRef,
  projectId,
  setLayers,
  theme,
}) {
  const { canUndo, canRedo, isApplying, record, undo, redo } = useAnnotationHistory({
    projectId,
    onError: (error) => console.error('[ANNOTATION HISTORY ERROR]', error),
  });

  useEffect(() => subscribeToAnnotationHistoryCommands(record), [record]);

  useEffect(
    () =>
      subscribeToAnnotationHistoryRefresh(async ({ projectId: refreshedProjectId } = {}) => {
        if (!projectId || String(refreshedProjectId || '') !== String(projectId)) return;

        try {
          const features = await fetchFeatures(projectId);
          const projectFeatures = (Array.isArray(features) ? features : []).filter(
            (feature) => String(feature?.properties?.project || feature?.project || '') === String(projectId)
          );

          setLayers?.(projectFeatures.map(toLayer).filter((layer) => Boolean(layer.id)));

          const map = getLatestMapInstance(mapRef);
          if (map) {
            const effectiveMapRef = mapRef?.current ? mapRef : { current: map };
            await syncAnnotationFeaturesToMap(map, projectFeatures, {
              isDarkMode,
              mapRef: effectiveMapRef,
            });
            applyAnnotationStylesToMap(map, projectFeatures);
          }
        } catch (error) {
          console.error('[ANNOTATION HISTORY REFRESH ERROR]', error);
        }
      }),
    [isDarkMode, mapRef, projectId, setLayers]
  );

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
