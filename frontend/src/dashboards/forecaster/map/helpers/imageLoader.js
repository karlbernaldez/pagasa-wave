const TRANSPARENT_PLACEHOLDER = {
  width: 1,
  height: 1,
  data: new Uint8Array([0, 0, 0, 0]),
};

export function loadImage(map, name, path) {
  if (map.hasImage(name)) return Promise.resolve(true);

  // Register the image name immediately so persisted symbol layers can be
  // restored while the real asset is still loading. Mapbox requires every
  // icon-image reference to exist when the layer is created.
  map.addImage(name, TRANSPARENT_PLACEHOLDER);

  return new Promise((resolve) => {
    map.loadImage(path, (error, image) => {
      if (error || !image) {
        resolve(false);
        return;
      }

      try {
        if (typeof map.updateImage === 'function') {
          map.updateImage(name, image);
        } else {
          if (map.hasImage(name)) map.removeImage(name);
          map.addImage(name, image);
        }
        resolve(true);
      } catch (error) {
        console.warn(`Failed to register image ${name}:`, error);
        resolve(false);
      }
    });
  });
}

// Initialize all custom images
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
