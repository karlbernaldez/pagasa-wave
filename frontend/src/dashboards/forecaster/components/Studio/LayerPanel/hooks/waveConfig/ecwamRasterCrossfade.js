const SOURCE_PREFIX = 'ecwam-crossfade-source-';
const LAYER_PREFIX = 'ecwam-crossfade-layer-';
const SLOTS = ['a', 'b'];

export const ECWAM_CROSSFADE_MS = 450;

const stateByMap = new WeakMap();

const idsFor = (slot) => ({
  sourceId: `${SOURCE_PREFIX}${slot}`,
  layerId: `${LAYER_PREFIX}${slot}`,
});

const removeSlot = (map, slot) => {
  const { sourceId, layerId } = idsFor(slot);
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(sourceId)) map.removeSource(sourceId);
};

const setSlotVisibility = (map, slot, visible) => {
  const { layerId } = idsFor(slot);
  if (map.getLayer(layerId)) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
  }
};

const addSlot = (map, slot, { tileUrl, opacity, showRaster, scheme, bounds, beforeId }) => {
  const { sourceId, layerId } = idsFor(slot);

  removeSlot(map, slot);
  map.addSource(sourceId, {
    type: 'raster',
    tiles: [tileUrl],
    tileSize: 256,
    scheme,
    bounds,
  });
  map.addLayer(
    {
      id: layerId,
      type: 'raster',
      source: sourceId,
      paint: {
        'raster-opacity': opacity,
        'raster-opacity-transition': { duration: ECWAM_CROSSFADE_MS, delay: 0 },
        'raster-fade-duration': 0,
        'raster-resampling': 'linear',
      },
      layout: { visibility: showRaster ? 'visible' : 'none' },
    },
    beforeId
  );

  return { sourceId, layerId };
};

const detachPendingListener = (map, state) => {
  if (!state?.pendingListener) return;
  map.off?.('sourcedata', state.pendingListener);
  state.pendingListener = null;
};

export const removeEcwamRasterCrossfade = (map) => {
  if (!map) return;
  const state = stateByMap.get(map);
  detachPendingListener(map, state);
  SLOTS.forEach((slot) => removeSlot(map, slot));
  stateByMap.delete(map);
};

export const syncEcwamRasterCrossfade = (
  map,
  {
    tileUrl,
    opacity,
    showRaster,
    scheme = 'xyz',
    bounds,
    beforeId = 'graticules',
  }
) => {
  if (!map || !tileUrl) return;

  let state = stateByMap.get(map);
  if (state?.activeSlot && !map.getSource(idsFor(state.activeSlot).sourceId)) {
    detachPendingListener(map, state);
    stateByMap.delete(map);
    state = null;
  }

  if (!state) {
    const activeSlot = 'a';
    addSlot(map, activeSlot, {
      tileUrl,
      opacity,
      showRaster,
      scheme,
      bounds,
      beforeId,
    });
    stateByMap.set(map, {
      activeSlot,
      activeUrl: tileUrl,
      pendingSlot: null,
      pendingUrl: null,
      pendingListener: null,
      sequence: 0,
    });
    return;
  }

  setSlotVisibility(map, state.activeSlot, showRaster);
  if (state.pendingSlot) setSlotVisibility(map, state.pendingSlot, showRaster);

  const activeLayerId = idsFor(state.activeSlot).layerId;
  if (map.getLayer(activeLayerId)) {
    map.setPaintProperty(activeLayerId, 'raster-opacity', opacity);
  }

  if (tileUrl === state.activeUrl) return;
  if (tileUrl === state.pendingUrl) return;

  detachPendingListener(map, state);
  if (state.pendingSlot) removeSlot(map, state.pendingSlot);

  const pendingSlot = state.activeSlot === 'a' ? 'b' : 'a';
  const { sourceId: pendingSourceId, layerId: pendingLayerId } = addSlot(map, pendingSlot, {
    tileUrl,
    opacity: 0,
    showRaster,
    scheme,
    bounds,
    beforeId,
  });

  const sequence = state.sequence + 1;
  state.sequence = sequence;
  state.pendingSlot = pendingSlot;
  state.pendingUrl = tileUrl;

  const beginCrossfade = () => {
    const currentState = stateByMap.get(map);
    if (!currentState || currentState.sequence !== sequence) return;

    detachPendingListener(map, currentState);
    const outgoingSlot = currentState.activeSlot;
    const outgoingLayerId = idsFor(outgoingSlot).layerId;

    if (!map.getLayer(pendingLayerId) || !map.getLayer(outgoingLayerId)) return;

    map.setPaintProperty(outgoingLayerId, 'raster-opacity-transition', {
      duration: ECWAM_CROSSFADE_MS,
      delay: 0,
    });
    map.setPaintProperty(pendingLayerId, 'raster-opacity-transition', {
      duration: ECWAM_CROSSFADE_MS,
      delay: 0,
    });
    map.setPaintProperty(outgoingLayerId, 'raster-opacity', 0);
    map.setPaintProperty(pendingLayerId, 'raster-opacity', opacity);
    map.triggerRepaint?.();

    setTimeout(() => {
      const latestState = stateByMap.get(map);
      if (!latestState || latestState.sequence !== sequence) return;

      removeSlot(map, outgoingSlot);
      latestState.activeSlot = pendingSlot;
      latestState.activeUrl = tileUrl;
      latestState.pendingSlot = null;
      latestState.pendingUrl = null;
    }, ECWAM_CROSSFADE_MS + 50);
  };

  if (map.isSourceLoaded?.(pendingSourceId)) {
    beginCrossfade();
    return;
  }

  const handleSourceData = (event) => {
    if (event.sourceId !== pendingSourceId || !event.isSourceLoaded) return;
    beginCrossfade();
  };

  state.pendingListener = handleSourceData;
  map.on?.('sourcedata', handleSourceData);
};
