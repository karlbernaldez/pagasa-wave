export let isMapLoaded = false;
export let mapSourceIds = [];

export function setGlobalMapLoaded(value) {
  isMapLoaded = value;
}

// ----------------------------
// Custom Layers Source IDs
// ----------------------------
export function setGlobalSourceIds(sourceIds = []) {
  mapSourceIds = Array.from(new Set(sourceIds));
}

export function addGlobalSourceId(sourceId) {
  if (!sourceId) return;
  if (!mapSourceIds.includes(sourceId)) {
    mapSourceIds.push(sourceId);
  }
}

export function clearGlobalSourceIds() {
  mapSourceIds = [];
}
