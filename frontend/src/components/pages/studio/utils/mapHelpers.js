export async function fetchLatestGeoJSON() {
  try {
    const res = await fetch('/geojson/today.geojson');
    if (!res.ok) throw new Error(`Failed to fetch GeoJSON: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error('Error fetching GeoJSON:', err);
    return { type: 'FeatureCollection', features: [] };
  }
}

export function createWindPopup(feature) {
  const speed_ms = feature.properties.windSpeed;
  const speed_kts = (speed_ms * 1.94384).toFixed(1);
  const dir = feature.properties.windDirection.toFixed(2);
  const waveDir = feature.properties.waveDirection?.toFixed(2) ?? 'N/A';
  const wavePeriod = feature.properties.wavePeriod?.toFixed(2) ?? 'N/A';

  return `
    <div style="position: relative; padding-bottom: 40px;">
      <!-- Main Popup Card -->
      <div style="
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
        font-size: 13px;
        min-width: 240px;
        max-width: 280px;
        background: rgba(255, 255, 255, 0.15);
        backdrop-filter: blur(24px) saturate(180%);
        -webkit-backdrop-filter: blur(24px) saturate(180%);
        border: 1px solid rgba(255, 255, 255, 0.25);
        border-radius: 16px;
        overflow: hidden;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 2px 8px rgba(0, 0, 0, 0.1);
      ">
        <!-- Wind Section -->
        <div style="
          background: rgba(255, 255, 255, 0.45);
          padding: 16px;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.3);
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#667eea" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
            </svg>
            <span style="
              font-weight: 700;
              font-size: 14px;
              color: #0f172a;
              letter-spacing: -0.01em;
            ">Wind Data</span>
          </div>
          
          <div style="display: grid; gap: 8px;">
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline;">
              <span style="color: #475569; font-size: 12px; font-weight: 500;">Speed</span>
              <div style="text-align: right;">
                <span style="
                  font-weight: 600;
                  color: #0f172a;
                  font-size: 16px;
                ">${speed_kts} kts</span>
                <span style="
                  color: #64748b;
                  font-size: 11px;
                  margin-left: 6px;
                ">(${speed_ms.toFixed(2)} m/s)</span>
              </div>
            </div>
            
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline;">
              <span style="color: #475569; font-size: 12px; font-weight: 500;">Direction</span>
              <span style="
                font-weight: 600;
                color: #0f172a;
                font-size: 16px;
                text-align: right;
              ">${dir}°</span>
            </div>
          </div>
        </div>
        
        <!-- Wave Section -->
        <div style="
          background: rgba(255, 255, 255, 0.35);
          padding: 16px;
          backdrop-filter: blur(10px);
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 12px;
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#764ba2" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M2 12c.6-.6 1.4-1 2-1 1.5 0 2 1 3.5 1S10 11 11.5 11s2 1 3.5 1 2-1 3.5-1 2 1 3.5 1c.6 0 1.4-.4 2-1"/>
              <path d="M2 17c.6-.6 1.4-1 2-1 1.5 0 2 1 3.5 1s2-1 3.5-1 2 1 3.5 1 2-1 3.5-1 2 1 3.5 1c.6 0 1.4-.4 2-1"/>
            </svg>
            <span style="
              font-weight: 700;
              font-size: 14px;
              color: #0f172a;
              letter-spacing: -0.01em;
            ">Wave Data</span>
          </div>
          
          <div style="display: grid; gap: 8px;">
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline;">
              <span style="color: #475569; font-size: 12px; font-weight: 500;">Direction</span>
              <span style="
                font-weight: 600;
                color: #0f172a;
                font-size: 16px;
                text-align: right;
              ">${waveDir}${waveDir !== 'N/A' ? '°' : ''}</span>
            </div>
            
            <div style="display: grid; grid-template-columns: 80px 1fr; gap: 12px; align-items: baseline;">
              <span style="color: #475569; font-size: 12px; font-weight: 500;">Period</span>
              <span style="
                font-weight: 600;
                color: #0f172a;
                font-size: 16px;
                text-align: right;
              ">${wavePeriod}${wavePeriod !== 'N/A' ? ' s' : ''}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Connector Line and Point -->
      <div style="
        position: absolute;
        left: 50%;
        bottom: 0;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
        pointer-events: none;
      ">
        <!-- Vertical Line -->
        <div style="
          width: 2px;
          height: 64px;
          background: linear-gradient(to bottom, rgba(255, 255, 255, 0.6), rgba(255, 255, 255, 0.3));
          box-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        "></div>
        
        <!-- Point/Dot -->
        <div style="
          width: 8px;
          height: 8px;
          background: rgba(255, 255, 255, 0.9);
          border: 2px solid rgba(102, 126, 234, 0.8);
          border-radius: 50%;
          box-shadow: 
            0 0 12px rgba(102, 126, 234, 0.6),
            0 0 4px rgba(255, 255, 255, 0.8);
        "></div>
      </div>
    </div>
  `;
}

export function getWindTileset(isDarkMode) {
  return isDarkMode
    ? "mapbox://votewave.darktif"
    : "mapbox://votewave.windtif";
}

export function getWindSourceId(isDarkMode) {
  return isDarkMode
    ? "wind-darkstorm"
    : "wind-solarstorm";
}
