import JSZip from 'jszip';
import Swal from 'sweetalert2';
import { captureMapSnapshot } from '@/utils/mapUtils';
import { createProject, deleteProjectById } from '@/api/projectAPI';

import { isMapLoaded, mapSourceIds } from '@dashboards/forecaster/map/helpers/mapGlobalState';

function waitForLayersRendered(map, layerIds = []) {
  console.log(layerIds)
  return new Promise((resolve) => {
    const check = () => {
      console.groupCollapsed('[waitForLayersRendered] render check');

      for (const id of layerIds) {
        const layer = map.getLayer(id);

        if (!layer) {
          console.log(`⏳ Layer missing: ${id}`);
          console.groupEnd();
          return;
        }

        const sourceId = layer.source;
        if (!sourceId) {
          console.log(`⚠️ Layer has no source: ${id}`);
          console.groupEnd();
          return;
        }

        const source = map.getSource(sourceId);
        if (!source) {
          console.log(`⏳ Source not found: ${sourceId} (layer: ${id})`);
          console.groupEnd();
          return;
        }

        const loaded = map.isSourceLoaded(sourceId);
        console.log(
          `🔎 ${id}`,
          `source=${sourceId}`,
          `loaded=${loaded}`
        );

        if (!loaded) {
          console.groupEnd();
          return;
        }
      }

      console.log('✅ All layers rendered:', layerIds);
      console.groupEnd();

      map.off('render', check);
      resolve();
    };

    map.on('render', check);
    check();
  });
}

// --- Layer visibility helpers ---
const mapLayers = [
  'PAR', 'PAR_dash', 'TCID', 'TCAD',
  'graticules', 'ERA5_c1', 'ERA5_c2',
  'wind-layer', 'Satellite'
];

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

async function toggleThemeAndWait(setIsDarkMode, value) {
  console.log('🎨 toggleThemeAndWait → start');
  console.log('🌓 Target theme:', value ? 'dark' : 'light');

  setIsDarkMode(value);
  localStorage.setItem('isDarkMode', String(value));
  console.log('✅ Theme state updated');

  // wait until mapSetup marks it ready
  while (!isMapLoaded) {
    console.log('⏳ Waiting for global isMapLoaded…');
    await new Promise(r => setTimeout(r, 50));
  }

  console.log('🎉 toggleThemeAndWait → complete');
}
// --- Snapshot helper ---
// --- Snapshot helper ---
async function captureSnapshot(theme) {
  if (!map) return null;

  if (theme !== "light" && theme !== "dark") {
    throw new Error("captureSnapshot requires theme: 'light' | 'dark'");
  }

  console.group("📸 captureSnapshot", theme);

  await map.fitBounds(
    [
      [93, 0],
      [153.8595159535438, 25],
    ],
    {
      padding: { top: 200, bottom: 100, left: 100, right: 200 },
      maxZoom: 8,
    }
  );

  await waitForLayersRendered(map, mapSourceIds);

  const image = captureMapSnapshot(null, {
    forceTheme: theme,
    watermarkText: "DOST-PAGASA",
    watermarkStyle: "diagonal-repeat",
    labelData: {
      projectName: "WA10132025",
      chartType: "Wave Analysis",
      annotator: "Karl Bernaldez",
      date: "October 10, 2025",
    },
  });

  console.groupEnd();
  return image;
}

// --- Main export function ---
export async function downloadCachedSnapshotZip(
  setIsDarkMode,
  features,
  isDarkMode
) {
  if (!map) throw new Error("No map reference");

  console.group("📦 downloadCachedSnapshotZip");

  const originalTheme = isDarkMode;

  // ✅ LOCAL BUFFER (NOT React state)
  const snapshotBuffer = {
    light: null,
    dark: null,
  };

  // --- LIGHT SNAPSHOT ---
  await toggleThemeAndWait(setIsDarkMode, false);
  snapshotBuffer.light = await captureSnapshot("light");

  // --- DARK SNAPSHOT ---
  await toggleThemeAndWait(setIsDarkMode, true);
  snapshotBuffer.dark = await captureSnapshot("dark");

  // --- RESTORE ---
  await toggleThemeAndWait(setIsDarkMode, originalTheme);

  // --- ZIP ---
  const zip = new JSZip();
  const projectName = localStorage.getItem("projectName") || "map_snapshots";

  if (snapshotBuffer.light) {
    zip.file(
      "map_snapshot_light.png",
      snapshotBuffer.light.split(",")[1],
      { base64: true }
    );
  }

  if (snapshotBuffer.dark) {
    zip.file(
      "map_snapshot_dark.png",
      snapshotBuffer.dark.split(",")[1],
      { base64: true }
    );
  }

  if (features?.type === "FeatureCollection") {
    zip.file("features.geojson", JSON.stringify(features, null, 2));
  }

  const blob = await zip.generateAsync({ type: "blob" });

  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${projectName.replace(/\s+/g, "_")}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  restoreLayers(map);

  console.log("✅ Export complete");
  console.groupEnd();
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
    const payload = {
      name: projectName,
      chartType,
      description,
      forecastDate,
    };

    console.log('🚀 Creating project with payload:', payload);

    const created = await createProject(payload);

    console.log('✅ Project created:', created);

    // ✅ SAFE localStorage persistence (no eval)
    const storageValues = {
      projectId: created._id,
      projectName,
      chartType,
      forecastDate,
    };

    Object.entries(storageValues).forEach(([key, value]) => {
      if (value != null) {
        localStorage.setItem(key, String(value));
      }
    });

    if (onNew) {
      onNew({
        name: projectName,
        chartType,
        description,
        forecastDate,
      });
    }

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: `Project "${projectName}" created successfully`,
      showConfirmButton: false,
      timer: 2000,
    });

    setShowModal(false);

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

export const handleDeleteProject = async ({
  projectId,
  onDelete,
  navigateAfterDelete = true,
}) => {
  if (!projectId) {
    return Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'No project selected!',
      showConfirmButton: false,
      timer: 3000,
    });
  }

  try {
    // Call the API
    const result = await deleteProjectById(projectId);
    console.log('🗑️ Project deleted:', result);

    // Remove from localStorage
    ['projectId', 'projectName', 'chartType', 'forecastDate'].forEach((key) =>
      localStorage.removeItem(key)
    );

    // Fire success toast
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'success',
      title: 'Project deleted successfully',
      showConfirmButton: false,
      timer: 2000,
    });

    // Trigger UI refresh if parent wants it
    if (typeof onDelete === 'function') onDelete(projectId);

    // Navigate or reload
    if (navigateAfterDelete) {
      setTimeout(() => window.location.reload(), 1200);
    }

  } catch (error) {
    console.error('❌ Delete failed:', error);

    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: error.message || 'Failed to delete project',
      showConfirmButton: false,
      timer: 3000,
    });
  }
};
