import MapboxDraw from '@mapbox/mapbox-gl-draw';
import { updateFeatureCoordinates } from '@/api/featureServices';
import {
  publishAnnotationHistoryCommand,
  requestAnnotationHistoryRefresh,
} from '@dashboards/forecaster/history/annotationHistoryEvents';
import drawStyles from '@dashboards/forecaster/draw/styles';
import DrawLineString from '@dashboards/forecaster/draw/linestring';
import DrawRectangle from '@dashboards/forecaster/draw/rectangle';
import DrawCircle from '@dashboards/forecaster/draw/circle';
import SimpleSelect from '@dashboards/forecaster/draw/simple_select';

const geometrySnapshots = new Map();

function cloneCoordinates(coordinates) {
  if (typeof structuredClone === 'function') return structuredClone(coordinates);
  return JSON.parse(JSON.stringify(coordinates));
}

function coordinatesEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function getFeatureSourceId(feature) {
  const properties = feature?.properties || {};
  return String(
    feature?.sourceId ||
      properties.sourceId ||
      properties.stableId ||
      properties.annotationId ||
      feature?.id ||
      ''
  ).trim();
}

function getProjectId(feature) {
  const properties = feature?.properties || {};
  return String(
    properties.project || feature?.project || localStorage.getItem('projectId') || ''
  ).split(':')[0];
}

function getFeatureLabel(feature) {
  const properties = feature?.properties || {};
  return (
    feature?.name ||
    properties.displayName ||
    properties.name ||
    properties.title ||
    (properties.isFront ? 'surface front' : 'wave annotation')
  );
}

function isEditableGeometryFeature(feature) {
  return feature?.geometry?.type === 'LineString' || feature?.geometry?.type === 'Polygon';
}

function snapshotFeature(feature) {
  if (!isEditableGeometryFeature(feature)) return;
  const sourceId = getFeatureSourceId(feature);
  if (!sourceId || !Array.isArray(feature.geometry?.coordinates)) return;
  geometrySnapshots.set(sourceId, cloneCoordinates(feature.geometry.coordinates));
}

function snapshotFeatures(features = []) {
  features.forEach(snapshotFeature);
}

function installGeometryHistory(map, draw) {
  if (map.__annotationGeometryHistoryInstalled) return;
  map.__annotationGeometryHistoryInstalled = true;

  const snapshotCurrentDrawFeatures = () => {
    try {
      snapshotFeatures(draw.getAll()?.features || []);
    } catch {
      // Draw may not be ready yet.
    }
  };

  const handleSelectionChange = (event) => {
    snapshotFeatures(event?.features || []);
  };

  const handleCreate = (event) => {
    snapshotFeatures(event?.features || []);
  };

  const handleDelete = (event) => {
    (event?.features || []).forEach((feature) => {
      const sourceId = getFeatureSourceId(feature);
      if (sourceId) geometrySnapshots.delete(sourceId);
    });
  };

  const handleUpdate = async (event) => {
    for (const feature of event?.features || []) {
      if (!isEditableGeometryFeature(feature)) continue;

      const sourceId = getFeatureSourceId(feature);
      const nextCoordinates = cloneCoordinates(feature.geometry.coordinates);
      const previousCoordinates = geometrySnapshots.get(sourceId);
      const projectId = getProjectId(feature);

      geometrySnapshots.set(sourceId, nextCoordinates);

      if (
        !sourceId ||
        !previousCoordinates ||
        coordinatesEqual(previousCoordinates, nextCoordinates)
      ) {
        continue;
      }

      try {
        await updateFeatureCoordinates(sourceId, nextCoordinates);

        publishAnnotationHistoryCommand({
          label: `Edit ${getFeatureLabel(feature)}`,
          undo: async () => {
            await updateFeatureCoordinates(sourceId, previousCoordinates);
            geometrySnapshots.set(sourceId, cloneCoordinates(previousCoordinates));
            requestAnnotationHistoryRefresh(projectId);
          },
          redo: async () => {
            await updateFeatureCoordinates(sourceId, nextCoordinates);
            geometrySnapshots.set(sourceId, cloneCoordinates(nextCoordinates));
            requestAnnotationHistoryRefresh(projectId);
          },
        });
      } catch (error) {
        console.error('[GEOMETRY SAVE ERROR]', error);
        geometrySnapshots.set(sourceId, cloneCoordinates(previousCoordinates));
        requestAnnotationHistoryRefresh(projectId);
      }
    }
  };

  map.on('draw.selectionchange', handleSelectionChange);
  map.on('draw.create', handleCreate);
  map.on('draw.delete', handleDelete);
  map.on('draw.update', handleUpdate);

  window.requestAnimationFrame(snapshotCurrentDrawFeatures);
}

export function initDrawControl(map) {
  if (map.drawControl) {
    installGeometryHistory(map, map.drawControl);
    return map.drawControl;
  }

  const draw = new MapboxDraw({
    displayControlsDefault: false,
    modes: {
      ...MapboxDraw.modes,
      simple_select: SimpleSelect,
      draw_line_string: DrawLineString,
      draw_rectangle: DrawRectangle,
      draw_circle: DrawCircle,
    },
    styles: drawStyles,
  });

  map.addControl(draw);
  map.drawControl = draw;
  installGeometryHistory(map, draw);
  return draw;
}
