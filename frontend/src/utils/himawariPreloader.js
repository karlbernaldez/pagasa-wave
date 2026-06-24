import { fetchSatelliteImageById } from '@/api/satelliteAPI';
import GIF from 'gif.js.optimized';

const SATELLITE_FRAME_IDS = Array.from({ length: 24 }, (_, index) => 24 - index);
const FRAME_DELAY_MS = 180;

function loadImage(blobUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = blobUrl;
  });
}

export async function preloadHimawariAndCreateGif() {
  const frames = [];
  const objectUrls = [];

  for (const id of SATELLITE_FRAME_IDS) {
    try {
      const blobUrl = await fetchSatelliteImageById(id);
      objectUrls.push(blobUrl);
      const image = await loadImage(blobUrl);
      frames.push(image);
    } catch (err) {
      console.error(`Failed to fetch satellite frame ${id}`, err);
    }
  }

  if (!frames.length) return null;

  const gif = new GIF({
    workers: 2,
    quality: 10,
    workerScript: '/gif.worker.js',
    width: frames[0].width,
    height: frames[0].height,
  });

  frames.forEach((frame) => {
    gif.addFrame(frame, { delay: FRAME_DELAY_MS });
  });

  return new Promise((resolve) => {
    gif.on('finished', (blob) => {
      objectUrls.forEach((url) => URL.revokeObjectURL(url));
      resolve(URL.createObjectURL(blob));
    });
    gif.render();
  });
}
