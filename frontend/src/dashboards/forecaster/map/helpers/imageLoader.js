export function loadImage(map, name, path) {
  if (map.hasImage(name)) return Promise.resolve(true);

  return new Promise((resolve) => {
    map.loadImage(path, (error, image) => {
      if (error) {
        resolve(false);
        return;
      }

      if (!map.hasImage(name)) {
        map.addImage(name, image);
      }

      resolve(true);
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
