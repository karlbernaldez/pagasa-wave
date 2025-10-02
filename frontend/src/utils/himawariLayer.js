import React, { useEffect, useState } from 'react';

// Himawari layer management functions
export const initHimawariLayer = async (map, options = {}) => {
  const {
    sector = 'full_disk',
    band = 'band_13',
    opacity = 0.8,
    onTimestampUpdate = () => {},
    onError = () => {}
  } = options;

  try {
    // Get latest available timestamp
    const timestamp = await getLatestHimawariTime(sector, band);
    
    if (!timestamp) {
      throw new Error('Failed to fetch Himawari timestamp');
    }

    // Add Himawari layer to map
    addHimawariLayer(map, timestamp, sector, band, opacity);
    
    // Update callback with timestamp
    onTimestampUpdate(timestamp);
    
    return timestamp;
  } catch (error) {
    console.error('Error initializing Himawari layer:', error);
    onError(error);
    return null;
  }
};

// Get latest available time from SLIDER API
const getLatestHimawariTime = async (sector, band) => {
  try {
    const url = `https://rammb-slider.cira.colostate.edu/data/json/himawari/${sector}/${band}/available_times.json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.timestamps_int && data.timestamps_int.length > 0) {
      return data.timestamps_int[data.timestamps_int.length - 1];
    }
  } catch (error) {
    console.error('Error fetching Himawari times:', error);
  }

  // Fallback: current time minus 30 minutes
  const fallbackTime = new Date(Date.now() - 30 * 60 * 1000);
  return formatTimestamp(fallbackTime);
};

// Format timestamp for SLIDER
const formatTimestamp = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
};

// Add Himawari raster layer
const addHimawariLayer = (map, timestamp, sector, band, opacity) => {
  const sourceId = 'himawari-source';
  const layerId = 'himawari-layer';

  // Remove existing layer and source if they exist
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }

  // SLIDER tile URL structure
  const tileUrl = `https://rammb-slider.cira.colostate.edu/data/imagery/${timestamp}/himawari---${sector}/${band}/{z}/{x}/{y}.png`;

  // Add source
  map.addSource(sourceId, {
    type: 'raster',
    tiles: [tileUrl],
    tileSize: 256,
    minzoom: 0,
    maxzoom: 8
  });

  // Add layer at the bottom slot (before wind-layer)
  map.addLayer({
    id: layerId,
    type: 'raster',
    source: sourceId,
    slot: 'bottom',
    paint: {
      'raster-opacity': opacity,
      'raster-fade-duration': 0
    }
  }, 'wind-layer'); // Insert before wind-layer
};

// Update Himawari layer opacity
export const updateHimawariOpacity = (map, opacity) => {
  if (map && map.getLayer('himawari-layer')) {
    map.setPaintProperty('himawari-layer', 'raster-opacity', opacity);
  }
};

// Toggle Himawari layer visibility
export const toggleHimawariVisibility = (map, visible) => {
  if (map && map.getLayer('himawari-layer')) {
    map.setLayoutProperty('himawari-layer', 'visibility', visible ? 'visible' : 'none');
  }
};

// Refresh Himawari layer with new timestamp
export const refreshHimawariLayer = async (map, sector, band, opacity) => {
  try {
    const timestamp = await getLatestHimawariTime(sector, band);
    if (timestamp) {
      addHimawariLayer(map, timestamp, sector, band, opacity);
      return timestamp;
    }
  } catch (error) {
    console.error('Error refreshing Himawari layer:', error);
  }
  return null;
};

// React Hook for Himawari layer control
export const useHimawariLayer = (map, initialOptions = {}) => {
  const [sector, setSector] = useState(initialOptions.sector || 'full_disk');
  const [band, setBand] = useState(initialOptions.band || 'band_13');
  const [opacity, setOpacity] = useState(initialOptions.opacity || 0.8);
  const [visible, setVisible] = useState(initialOptions.visible !== false);
  const [timestamp, setTimestamp] = useState(null);
  const [loading, setLoading] = useState(false);

  // Initialize Himawari layer
  useEffect(() => {
    if (!map) return;

    const initLayer = async () => {
      setLoading(true);
      const ts = await initHimawariLayer(map, {
        sector,
        band,
        opacity,
        onTimestampUpdate: setTimestamp,
        onError: (err) => console.error('Himawari error:', err)
      });
      setLoading(false);
    };

    // Wait for map to be fully loaded
    if (map.loaded()) {
      initLayer();
    } else {
      map.once('load', initLayer);
    }
  }, [map]);

  // Update layer when sector or band changes
  useEffect(() => {
    if (!map || !map.loaded()) return;

    const updateLayer = async () => {
      setLoading(true);
      const ts = await refreshHimawariLayer(map, sector, band, opacity);
      if (ts) setTimestamp(ts);
      setLoading(false);
    };

    updateLayer();
  }, [map, sector, band]);

  // Update opacity
  useEffect(() => {
    if (!map || !map.loaded()) return;
    updateHimawariOpacity(map, opacity);
  }, [map, opacity]);

  // Toggle visibility
  useEffect(() => {
    if (!map || !map.loaded()) return;
    toggleHimawariVisibility(map, visible);
  }, [map, visible]);

  // Auto-refresh every 10 minutes
  useEffect(() => {
    if (!map || !visible) return;

    const interval = setInterval(async () => {
      const ts = await refreshHimawariLayer(map, sector, band, opacity);
      if (ts) setTimestamp(ts);
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [map, sector, band, opacity, visible]);

  const refresh = async () => {
    if (!map) return;
    setLoading(true);
    const ts = await refreshHimawariLayer(map, sector, band, opacity);
    if (ts) setTimestamp(ts);
    setLoading(false);
  };

  return {
    sector,
    setSector,
    band,
    setBand,
    opacity,
    setOpacity,
    visible,
    setVisible,
    timestamp,
    loading,
    refresh
  };
};

// Himawari Control Panel Component
export const HimawariControl = ({ 
  sector, 
  setSector, 
  band, 
  setBand, 
  opacity, 
  setOpacity, 
  visible, 
  setVisible,
  timestamp,
  loading,
  refresh,
  isDarkMode = false 
}) => {
  const formatDisplayTime = (ts) => {
    if (!ts) return 'No data';
    
    const date = new Date();
    date.setUTCFullYear(
      parseInt(ts.substr(0, 4)),
      parseInt(ts.substr(4, 2)) - 1,
      parseInt(ts.substr(6, 2))
    );
    date.setUTCHours(
      parseInt(ts.substr(8, 2)),
      parseInt(ts.substr(10, 2)),
      parseInt(ts.substr(12, 2))
    );
    
    return date.toUTCString();
  };

  const bgColor = isDarkMode ? '#1a1a1a' : '#ffffff';
  const textColor = isDarkMode ? '#ffffff' : '#000000';
  const borderColor = isDarkMode ? '#333' : '#ccc';
  const hoverColor = isDarkMode ? '#0052a3' : '#0066cc';

  return (
    <div style={{
      background: bgColor,
      color: textColor,
      padding: '12px',
      borderRadius: '8px',
      border: `1px solid ${borderColor}`,
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      minWidth: '250px'
    }}>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '10px'
      }}>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold' }}>
          Himawari-9 Satellite
        </h4>
        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={visible}
            onChange={(e) => setVisible(e.target.checked)}
            style={{ marginRight: '5px' }}
          />
          <span style={{ fontSize: '11px' }}>Show</span>
        </label>
      </div>

      {visible && (
        <>
          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontWeight: '500' }}>
              Sector:
            </label>
            <select 
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '11px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                background: bgColor,
                color: textColor
              }}
            >
              <option value="full_disk">Full Disk</option>
              <option value="japan">Japan</option>
              <option value="target">Target Area</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontWeight: '500' }}>
              Band:
            </label>
            <select 
              value={band}
              onChange={(e) => setBand(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '4px',
                fontSize: '11px',
                border: `1px solid ${borderColor}`,
                borderRadius: '4px',
                background: bgColor,
                color: textColor
              }}
            >
              <option value="band_13">IR1 - 10.4µm</option>
              <option value="band_14">IR2 - 11.2µm</option>
              <option value="band_15">IR3 - 12.4µm</option>
              <option value="band_07">Water Vapor</option>
              <option value="geocolor">GeoColor</option>
            </select>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <label style={{ display: 'block', marginBottom: '3px', fontWeight: '500' }}>
              Opacity: {opacity.toFixed(1)}
            </label>
            <input 
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => setOpacity(parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
          </div>

          <button 
            onClick={refresh}
            disabled={loading}
            style={{
              width: '100%',
              padding: '6px',
              background: loading ? borderColor : '#0066cc',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '11px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Loading...' : 'Refresh Imagery'}
          </button>

          <div style={{
            fontSize: '10px',
            color: isDarkMode ? '#999' : '#666',
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: `1px solid ${borderColor}`
          }}>
            {formatDisplayTime(timestamp)}
          </div>
        </>
      )}
    </div>
  );
};

export default {
  initHimawariLayer,
  updateHimawariOpacity,
  toggleHimawariVisibility,
  refreshHimawariLayer,
  useHimawariLayer,
  HimawariControl
};