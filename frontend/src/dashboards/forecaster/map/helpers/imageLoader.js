export function loadImage(map, name, path) {
  if (!map.hasImage(name)) {
    map.loadImage(path, (error, image) => {
      if (error) {
        // console.error(`Error loading image ${name} from ${path}:`, error);
        return;
      }
      if (!map.hasImage(name)) {
        map.addImage(name, image);
      }
    });
  }
}

// Initialize all custom images
export function loadCustomImages(map) {
  const singleImages = [
    { name: 'typhoon', path: '/hurricane.png' },
    { name: 'low_pressure', path: '/LPA.png' },
    { name: 'high_pressure', path: '/HPA.png' },
    { name: 'less_1', path: '/L1.png' }
  ];

  const windBarbs = [
    { name: '0kts', path: '/barbs/0kts.svg' },
    { name: '5kts', path: '/barbs/5kts.svg' },
    { name: '10kts', path: '/barbs/10kts.svg' },
    { name: '15kts', path: '/barbs/15kts.svg' },
    { name: '20kts', path: '/barbs/20kts.svg' },
    { name: '25kts', path: '/barbs/25kts.svg' },
    { name: '30kts', path: '/barbs/30kts.svg' }
  ];

  // Load standard images
  singleImages.forEach(img => loadImage(map, img.name, img.path));

  // Load wind barb images
  windBarbs.forEach(img => loadImage(map, img.name, img.path));
}