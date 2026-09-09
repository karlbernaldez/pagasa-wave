const imageLoadState = new WeakMap();

function getMapImageState(map) {
  let state = imageLoadState.get(map);
  if (!state) {
    state = {
      loaded: new Set(),
      pending: new Map(),
    };
    imageLoadState.set(map, state);
  }
  return state;
}

export function loadImage(map, name, path) {
  const state = getMapImageState(map);

  if (state.loaded.has(name) && map.hasImage(name)) {
    return Promise.resolve(true);
  }

  const pending = state.pending.get(name);
  if (pending) return pending;

  const request = new Promise((resolve) => {
    map.loadImage(path, (error, image) => {
      state.pending.delete(name);

      if (error || !image) {
        console.warn(`Failed to load image ${name} from ${path}:`, error || 'empty image');
        resolve(false);
        return;
      }

      try {
        // Replace any stale/placeholder registration with the real image. Using
        // remove/add also handles images whose dimensions differ from an older
        // registration, which updateImage does not reliably support.
        if (map.hasImage(name)) map.removeImage(name);
        map.addImage(name, image);
        state.loaded.add(name);
        resolve(true);
      } catch (registrationError) {
        console.warn(`Failed to register image ${name}:`, registrationError);
        resolve(false);
      }
    });
  });

  state.pending.set(name, request);
  return request;
}

// Initialize all custom images. Repeated callers share the same in-flight
// requests, so map setup and annotation restoration do not duplicate loads.
export function loadCustomImages(map) {
  const singleImages = [
    { name: 'typhoon', path: '/hurricane.png' },
    { name: 'low_pressure', path: '/LPA.png' },
    { name: 'high_pressure', path: '/HPA.png' },
    { name: 'less_1', path: '/L1.png' },
  ];

  const windBarbs = [
    { name: '0kts', path: '/barbs/0kts.svg' },
    { name: '5kts', path: '/barbs/5kts.svg' },
    { name: '10kts', path: '/barbs/10kts.svg' },
    { name: '15kts', path: '/barbs/15kts.svg' },
    { name: '20kts', path: '/barbs/20kts.svg' },
    { name: '25kts', path: '/barbs/25kts.svg' },
    { name: '30kts', path: '/barbs/30kts.svg' },
  ];

  return Promise.allSettled([
    ...singleImages.map((img) => loadImage(map, img.name, img.path)),
    ...windBarbs.map((img) => loadImage(map, img.name, img.path)),
  ]);
}
