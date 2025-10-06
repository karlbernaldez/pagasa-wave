import { fetchSatelliteImageById } from '../api/satelliteAPI';
import GIF from 'gif.js.optimized'; // lightweight JS library to create GIFs in browser

export async function preloadHimawariAndCreateGif() {
  const frames = [];
  const SAT_FRAMES = 24;

  // 1. Fetch all frames
  for (let i = 1; i <= SAT_FRAMES; i++) {
    try {
      const blobUrl = await fetchSatelliteImageById(i);
      const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = blobUrl;
      });
      frames.push(img);
    } catch (err) {
      console.error(`Failed to fetch frame ${i}`, err);
    }
  }

  if (frames.length === 0) return null;

  // 2. Create a GIF from frames
  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: '/gif.worker.js', // ensure this is available in public/
    width: frames[0].width,
    height: frames[0].height,
  });

  frames.forEach(frame => {
    gif.addFrame(frame, { delay: 200 }); // 200ms per frame
  });

  return new Promise(resolve => {
    gif.on('finished', blob => {
      // Convert blob to URL to use in Mapbox
      const url = URL.createObjectURL(blob);
      resolve(url);
    });
    gif.render();
  });
}
