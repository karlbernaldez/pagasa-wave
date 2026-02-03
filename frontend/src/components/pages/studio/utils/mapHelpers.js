export async function fetchGeoJSON(path) {
  try {
    const res = await fetch(path);

    if (!res.ok) {
      throw new Error(`Failed to fetch GeoJSON (${path}): ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.error('[GeoJSON Fetch Error]', path, err);
    return {
      type: 'FeatureCollection',
      features: []
    };
  }
}

export function fetchLatestGeoJSON({ model, product, date } = {}) {
  const path = `/geojson/${model}-${product}-${date}.geojson`;
  return fetchGeoJSON(path);
}

export function createWindPopup(feature) {
  const speed_ms = feature.properties.windSpeed;
  const speed_kts = (speed_ms * 1.94384).toFixed(1);
  const dir = feature.properties.windDirection.toFixed(2);

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
      font-size: 13px;
      min-width: 220px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.2);
    ">
      <div style="
        background: rgba(255,255,255,.45);
        padding: 16px;
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#667eea" stroke-width="2.5" stroke-linecap="round">
            <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
          </svg>
          <strong style="font-size:14px;color:#0f172a;">Wind</strong>
        </div>

        <div style="display:grid;gap:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#475569;font-size:12px;">Speed</span>
            <span style="font-weight:600;">
              ${speed_kts} kts
              <span style="font-size:11px;color:#64748b;">
                (${speed_ms.toFixed(2)} m/s)
              </span>
            </span>
          </div>

          <div style="display:flex;justify-content:space-between;">
            <span style="color:#475569;font-size:12px;">Direction</span>
            <span style="font-weight:600;">${dir}°</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

export function createWavePopup(feature) {
  const waveDir = feature.properties.waveDirection?.toFixed(2) ?? 'N/A';
  const wavePeriod = feature.properties.wavePeriod?.toFixed(2) ?? 'N/A';

  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif;
      font-size: 13px;
      min-width: 220px;
      background: rgba(255, 255, 255, 0.15);
      backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255, 255, 255, 0.25);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,.2);
    ">
      <div style="
        background: rgba(255,255,255,.35);
        padding: 16px;
      ">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="#764ba2" stroke-width="2.5" stroke-linecap="round">
            <path d="M2 12c.6-.6 1.4-1 2-1 1.5 0 2 1 3.5 1S10 11 11.5 11s2 1 3.5 1 2-1 3.5-1 2 1 3.5 1c.6 0 1.4-.4 2-1"/>
          </svg>
          <strong style="font-size:14px;color:#0f172a;">Wave</strong>
        </div>

        <div style="display:grid;gap:8px;">
          <div style="display:flex;justify-content:space-between;">
            <span style="color:#475569;font-size:12px;">Direction</span>
            <span style="font-weight:600;">
              ${waveDir}${waveDir !== 'N/A' ? '°' : ''}
            </span>
          </div>

          <div style="display:flex;justify-content:space-between;">
            <span style="color:#475569;font-size:12px;">Period</span>
            <span style="font-weight:600;">
              ${wavePeriod}${wavePeriod !== 'N/A' ? ' s' : ''}
            </span>
          </div>
        </div>
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

export function getWaveSourceId(isDarkMode) {
  return isDarkMode
    ? "wave-dark"
    : "wave-light";
}
