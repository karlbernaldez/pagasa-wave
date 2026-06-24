import GIF from 'gif.js.optimized';

const PAGASA_SATELLITE_API_URL = 'https://www.panahon.gov.ph/api/v1/satellite';
const PAGASA_ORIGIN = 'https://www.panahon.gov.ph';
const SATELLITE_FRAME_IDS = Array.from({ length: 24 }, (_, index) => 24 - index);
const FRAME_DELAY_MS = 180;

function buildSatelliteApiUrl(frameId) {
  const url = new URL(PAGASA_SATELLITE_API_URL);
  url.searchParams.set('id', String(frameId));
  return url.toString();
}

function toAbsoluteUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  const trimmed = value.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (trimmed.startsWith('/')) return `${PAGASA_ORIGIN}${trimmed}`;
  return `${PAGASA_ORIGIN}/${trimmed.replace(/^\/+/, '')}`;
}

function looksLikeImageUrl(value) {
  return typeof value === 'string' && /\.(png|jpe?g|webp|gif)(\?|$)/i.test(value);
}

function findImageUrl(value) {
  if (!value) return null;

  if (typeof value === 'string') {
    const url = toAbsoluteUrl(value);
    return url && looksLikeImageUrl(url) ? url : null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = findImageUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (typeof value !== 'object') return null;

  const preferredKeys = ['image', 'imageUrl', 'image_url', 'url', 'src', 'file', 'filename', 'path', 'link', 'data'];
  for (const key of preferredKeys) {
    const url = findImageUrl(value[key]);
    if (url) return url;
  }

  for (const key of Object.keys(value)) {
    if (preferredKeys.includes(key)) continue;
    const url = findImageUrl(value[key]);
    if (url) return url;
  }

  return null;
}

async function fetchSatelliteFrameBlobUrl(frameId) {
  const apiUrl = buildSatelliteApiUrl(frameId);
  const response = await fetch(apiUrl, { cache: 'no-store' });
  if (!response.ok) throw new Error(`PAGASA satellite API id=${frameId} returned ${response.status}`);

  const contentType = response.headers.get('content-type') || '';
  if (/image\//i.test(contentType)) {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  let payload;
  try {
    payload = await response.json();
  } catch {
    return apiUrl;
  }

  return findImageUrl(payload) || apiUrl;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = url;
  });
}

export async function preloadHimawariAndCreateGif() {
  const frames = [];
  const objectUrls = [];

  for (const id of SATELLITE_FRAME_IDS) {
    try {
      const imageUrl = await fetchSatelliteFrameBlobUrl(id);
      if (imageUrl.startsWith('blob:')) objectUrls.push(imageUrl);
      const image = await loadImage(imageUrl);
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
