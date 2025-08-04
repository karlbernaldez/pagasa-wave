import JSZip from 'jszip';
import Swal from 'sweetalert2';
import { createProject } from '../../../api/projectAPI';
import { logoutUser } from '../../../api/auth';

export const logout = () => {
  // Clear all data in localStorage
  localStorage.clear();

  // Call the logoutUser function to handle the logout process
  logoutUser();
};

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

  if (!forecastDate) {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon: 'error',
      title: 'Forecast Date is required!',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
    });
    return;
  }

  try {
    const token = localStorage.getItem("authToken");
    const payload = {
      name: projectName,
      chartType,
      description,
      forecastDate,
    };

    const created = await createProject(payload, token);

    localStorage.setItem("projectId", created._id);
    localStorage.setItem("projectName", projectName);
    localStorage.setItem("chartType", chartType);
    localStorage.setItem("forecastDate", forecastDate);

    if (onNew) {
      onNew({ name: projectName, chartType, description, forecastDate });
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

export async function downloadCachedSnapshotZip(setIsDarkMode, features) {
  const isDarkMode = localStorage.getItem("isDarkMode") === "true";
  const projectName = localStorage.getItem("projectName") || "map_snapshots";

  const waitForSnapshot = async (key, timeoutMs = 6000, interval = 200) => {
    const maxTries = Math.floor(timeoutMs / interval);
    for (let i = 0; i < maxTries; i++) {
      const snapshot = localStorage.getItem(key);
      if (snapshot) return true;
      await new Promise(res => setTimeout(res, interval));
    }
    return false;
  };

  // Step 0: Clear old snapshots
  localStorage.removeItem("map_snapshot_light");
  localStorage.removeItem("map_snapshot_dark");

  // Step 1: Show downloading modal
  Swal.fire({
    title: 'Downloading...',
    html: 'Please wait while we prepare the ZIP file.',
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading(),
  });

  // Step 2: Toggle to opposite theme
  if (typeof setIsDarkMode === 'function') {
    setIsDarkMode(!isDarkMode);
  }

  // Step 3: Wait for opposite snapshot
  const oppositeKey = isDarkMode ? "map_snapshot_light" : "map_snapshot_dark";
  await waitForSnapshot(oppositeKey);

  // Step 4: Toggle back to original theme
  if (typeof setIsDarkMode === 'function') {
    setIsDarkMode(isDarkMode);
  }

  // Step 5: Wait for original snapshot
  const currentKey = isDarkMode ? "map_snapshot_dark" : "map_snapshot_light";
  await waitForSnapshot(currentKey);

  // Step 6: Get both snapshots
  const lightSnapshot = localStorage.getItem("map_snapshot_light");
  const darkSnapshot = localStorage.getItem("map_snapshot_dark");

  // Step 7: Prepare ZIP
  const zip = new JSZip();

  // Handle snapshots (base64)
  if (lightSnapshot) {
    zip.file("map_snapshot_light.png", lightSnapshot.split(',')[1], { base64: true });
  }
  if (darkSnapshot) {
    zip.file("map_snapshot_dark.png", darkSnapshot.split(',')[1], { base64: true });
  }

  // Handle GeoJSON - Fixed: Pass string directly instead of Blob
  if (features && features.type === "FeatureCollection" && Array.isArray(features.features)) {
    const geojsonString = JSON.stringify(features, null, 2);
    zip.file("features.geojson", geojsonString);
  } else {
    console.error('Invalid or malformed GeoJSON:', features);
    Swal.fire({
      icon: 'error',
      title: 'Invalid GeoJSON Format',
      text: 'The provided GeoJSON is not valid. It will not be included in the download.',
      toast: true,
      position: 'top-end',
      timer: 3000,
      showConfirmButton: false,
    });
  }

  // Step 8: Generate the ZIP file
  const blob = await zip.generateAsync({ type: "blob" });

  // Step 9: Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `${projectName.replace(/\s+/g, "_")}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Step 10: Close loading modal and show success
  Swal.close();
  Swal.fire({
    icon: 'success',
    title: 'Downloaded',
    text: 'Snapshots and GeoJSON exported as ZIP.',
    toast: true,
    position: 'top-end',
    timer: 3000,
    showConfirmButton: false,
    willOpen: (popup) => {
      popup.style.zIndex = '9999'; // ensure it's on top
    }
  });
}
