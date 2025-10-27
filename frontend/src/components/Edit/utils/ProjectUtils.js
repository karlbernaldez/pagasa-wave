import JSZip from 'jszip';
import Swal from 'sweetalert2';
import { captureMapSnapshot, getLatestMapInstance } from '../../../utils/mapUtils';

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForMapReady = (map, timeout = 15000) =>
  new Promise((resolve) => {
    if (!map) return resolve();
    let resolved = false;

    const cleanup = () => {
      map.off('data', onData);
      map.off('idle', onIdle);
      clearTimeout(timer);
    };

    const onData = (e) => {
      if (e.sourceId === 'himawari-video' && e.isSourceLoaded && !resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    const onIdle = () => {
      if (!resolved) {
        resolved = true;
        cleanup();
        resolve();
      }
    };

    const timer = setTimeout(() => {
      if (!resolved) {
        console.warn(`⏱️ Map not ready after ${timeout / 1000}s, continuing anyway.`);
        resolved = true;
        cleanup();
        resolve();
      }
    }, timeout);

    if (!map.isStyleLoaded()) {
      map.once('render', onIdle);
    } else {
      const video = map.getSource('himawari-video')?.getVideo();
      if (video) {
        resolved = true;
        cleanup();
        resolve();
      } else {
        map.on('data', onData);
        map.once('render', onIdle);
      }
    }
  });

function waitForIdle(map, delayMs = 600) {
  return new Promise((resolve) => {
    if (!map) return resolve();
    map.once('idle', () => setTimeout(resolve, delayMs));
  });
}

// --- Layer visibility helpers ---
const mapLayers = [
  'PAR', 'PAR_dash', 'TCID', 'TCAD',
  'graticules', 'ERA5_c1', 'ERA5_c2',
  'wind-layer', 'Satellite'
];

const disableLayers = (map) => {
  if (!map) return;
  mapLayers.forEach((layer) => {
    if (map.getLayer(layer)) map.setLayoutProperty(layer, 'visibility', 'none');
  });
};

const restoreLayers = (map) => {
  if (!map) return;

  const layersState = {
    PAR: localStorage.getItem('PAR') === 'true',
    Satellite: localStorage.getItem('Satellite') === 'true',
    TCID: localStorage.getItem('TCID') === 'true',
    TCAD: localStorage.getItem('TCAD') === 'true',
    ShippingZone: localStorage.getItem('SHIPPING_ZONE') === 'true',
    WindLayer: localStorage.getItem('wind-layer') === 'true',
  };

  mapLayers.forEach((layer) => {
    if (!map.getLayer(layer)) return;
    let visible = 'none';
    switch (layer) {
      case 'PAR':
      case 'PAR_dash':
        visible = layersState.PAR ? 'visible' : 'none';
        break;
      case 'TCID':
        visible = layersState.TCID ? 'visible' : 'none';
        break;
      case 'TCAD':
        visible = layersState.TCAD ? 'visible' : 'none';
        break;
      case 'graticules':
      // case 'ERA5_c1':
      // case 'ERA5_c2':
        visible = layersState.ShippingZone ? 'visible' : 'none';
        break;
      case 'wind-layer':
        visible = layersState.WindLayer ? 'visible' : 'none';
        break;
      case 'Satellite':
        visible = layersState.Satellite ? 'visible' : 'none';
        break;
    }
    map.setLayoutProperty(layer, 'visibility', visible);
  });
};

// --- Snapshot helper ---
async function captureSnapshot(map, setCapturedImages) {
  if (!map) return;
  await waitForMapReady(map);

  captureMapSnapshot(map, setCapturedImages, {
    watermarkText: 'DOST-PAGASA',
    watermarkStyle: 'diagonal-repeat',
    labelData: {
      projectName: 'WA10132025',
      chartType: 'Wave Analysis',
      annotator: 'Karl Bernaldez',
      date: 'October 10, 2025',
    },
    labelFont: '14px Arial',
    labelColor: 'white',
    labelBgColor: 'rgba(0, 0, 0, 0.7)',
    labelPadding: 12,
  });
}

// --- Second snapshot after theme toggle ---
async function captureSecondSnapshot(map, setCapturedImages, setIsDarkMode, isDarkMode) {
  console.log('🌗 Capturing second snapshot with toggled theme...');
  if (!map || typeof setIsDarkMode !== 'function') return;

  setIsDarkMode(!isDarkMode);
  const latestMap = getLatestMapInstance();
  if (!latestMap) return console.error('⚠️ Could not retrieve latest map instance');

  // Wait for new style to load before snapshot
  // await new Promise((resolve) => {
  //   const onStyleLoad = async () => {
  //     latestMap.off('style.load', onStyleLoad);
  //     restoreLayers(latestMap);
  //     await delay(1000); // allow tiles to render
  //     resolve();
  //   };
  //   latestMap.on('style.load', onStyleLoad);
  // });

  await waitForMapReady(latestMap);

  await captureSnapshot(latestMap, setCapturedImages);
}

// --- Main export function ---
export async function downloadCachedSnapshotZip(setIsDarkMode, features, map, setCapturedImages) {
  if (!map) return console.error('❌ No valid map reference found');

  Swal.fire({
    title: 'Preparing Export...',
    html: 'Please wait while generating snapshots and ZIP.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });

  disableLayers(map);

  await map.fitBounds(
    [
      [93, 0],
      [153.8595159535438, 25],
    ],
    { padding: { top: 200, bottom: 100, left: 100, right: 200 }, maxZoom: 8 }
  );

  await captureSnapshot(map, setCapturedImages);
  await captureSecondSnapshot(map, setCapturedImages, setIsDarkMode, localStorage.getItem('isDarkMode') === 'true');

  // --- ZIP Creation ---
  const projectName = localStorage.getItem('projectName') || 'map_snapshots';
  const zip = new JSZip();
  const snapshots = { map_snapshot_light: 'map_snapshot_light.png', map_snapshot_dark: 'map_snapshot_dark.png' };

  for (const [key, fileName] of Object.entries(snapshots)) {
    const data = localStorage.getItem(key);
    if (data) zip.file(fileName, data.split(',')[1], { base64: true });
  }

  if (features?.type === 'FeatureCollection') zip.file('features.geojson', JSON.stringify(features, null, 2));

  const blob = await zip.generateAsync({ type: 'blob' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${projectName.replace(/\s+/g, '_')}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  Swal.close();
  Swal.fire({
    icon: 'success',
    title: 'Downloaded',
    text: 'Snapshots and GeoJSON exported as ZIP.',
    toast: true,
    position: 'top-end',
    timer: 3000,
    showConfirmButton: false,
    willOpen: (popup) => { popup.style.zIndex = '9999'; },
  });

  restoreLayers(map);
}

// --- Logout ---
export const logout = () => logoutUser();

// --- Project Creation ---
export const handleCreateProject = async ({
  projectName,
  chartType,
  description,
  forecastDate,
  onNew,
  setShowModal,
  setMainOpen,
  setProjectOpen,
  setProjectName,
  setChartType,
  setDescription,
}) => {
  if (!projectName.trim()) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Project Name is required!',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    return;
  }

  try {
    const payload = { name: projectName, chartType, description, forecastDate };
    const created = await createProject(payload);

    ['projectId', 'projectName', 'chartType', 'forecastDate'].forEach((key) =>
      localStorage.setItem(key, key === 'projectId' ? created._id : eval(key))
    );

    if (onNew) onNew({ name: projectName, chartType, description, forecastDate });

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Project "${projectName}" created successfully`,
      showConfirmButton: false,
      timer: 2000,
    });

    // Reset UI state
    setShowModal(false);
    setMainOpen(false);
    setProjectOpen(false);
    setProjectName('');
    setChartType('');
    setDescription('');

    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: err.message,
      showConfirmButton: false,
      timer: 3000,
    });
  }
};