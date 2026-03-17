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

export function createWindPopup(feature, isDarkMode = false) {
  const speed_ms = feature.properties.windSpeed;
  const speed_kts = (speed_ms * 1.94384).toFixed(1);
  const dir = feature.properties.windDirection.toFixed(2);

  // ─── Theme tokens ──────────────────────────────────────────────────────────
  const t = isDarkMode
    ? {
      // Dark — deep navy glass matching the app
      outerBg: 'rgba(13, 26, 43, 0.85)',
      outerBorder: 'rgba(59, 130, 246, 0.25)',
      innerBg: 'rgba(26, 42, 64, 0.90)',
      shadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15)',
      titleColor: '#e2e8f0',
      labelColor: '#64748b',
      valueColor: '#cbd5e1',
      subColor: '#475569',
      iconStroke: '#38bdf8',
      divider: 'rgba(59,130,246,0.12)',
      accentBar: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    }
    : {
      // Light — frosted white glass
      outerBg: 'rgba(255, 255, 255, 0.80)',
      outerBorder: 'rgba(148, 163, 184, 0.30)',
      innerBg: 'rgba(255, 255, 255, 0.92)',
      shadow: '0 12px 40px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.08)',
      titleColor: '#0f172a',
      labelColor: '#64748b',
      valueColor: '#1e293b',
      subColor: '#94a3b8',
      iconStroke: '#3b82f6',
      divider: 'rgba(148,163,184,0.20)',
      accentBar: 'linear-gradient(90deg, #3b82f6, #06b6d4)',
    };

  return `
    <div style="
      font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
      min-width: 210px;
      background: ${t.outerBg};
      backdrop-filter: blur(28px) saturate(200%);
      -webkit-backdrop-filter: blur(28px) saturate(200%);
      border: 1px solid ${t.outerBorder};
      border-radius: 16px;
      overflow: hidden;
      box-shadow: ${t.shadow};
    ">

      <!-- Gradient accent bar -->
      <div style="height: 3px; background: ${t.accentBar};"></div>

      <div style="padding: 14px 16px; background: ${t.innerBg};">

        <!-- Header -->
        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <div style="
            width: 30px; height: 30px; border-radius: 8px;
            background: ${isDarkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'};
            border: 1px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'};
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="${t.iconStroke}" stroke-width="2.5" stroke-linecap="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
            </svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:700; color:${t.titleColor}; line-height:1;">Wind</div>
            <div style="font-size:10px; color:${t.labelColor}; margin-top:2px; text-transform:uppercase; letter-spacing:0.06em;">ECMWF Surface</div>
          </div>
        </div>

        <!-- Divider -->
        <div style="height:1px; background:${t.divider}; margin-bottom:10px;"></div>

        <!-- Data rows -->
        <div style="display:grid; gap:9px;">

          <div style="display:flex; justify-content:space-between; align-items:baseline;">
            <span style="font-size:11px; color:${t.labelColor}; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">Speed</span>
            <div style="text-align:right;">
              <span style="font-size:14px; font-weight:700; color:${t.valueColor};">${speed_kts} kts</span>
              <span style="font-size:10px; color:${t.subColor}; margin-left:5px;">${speed_ms.toFixed(2)} m/s</span>
            </div>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:11px; color:${t.labelColor}; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">Direction</span>
            <div style="display:flex; align-items:center; gap:6px;">
              <!-- Compass arrow rotated to wind direction -->
              <div style="
                width:18px; height:18px; border-radius:50%;
                background: ${isDarkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.07)'};
                display:flex; align-items:center; justify-content:center;
                transform: rotate(${dir}deg);
              ">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="${t.iconStroke}">
                  <polygon points="5,1 8,9 5,7 2,9"/>
                </svg>
              </div>
              <span style="font-size:14px; font-weight:700; color:${t.valueColor};">${dir}°</span>
            </div>
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
