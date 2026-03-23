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
  const speed_ms  = feature.properties.windSpeed;
  const speed_kts = (speed_ms * 1.94384).toFixed(1);
  const dir       = feature.properties.windDirection.toFixed(2);

  const t = isDarkMode
    ? {
        outerBg:     'rgba(13, 26, 43, 0.85)',
        outerBorder: 'rgba(59, 130, 246, 0.25)',
        innerBg:     'rgba(26, 42, 64, 0.90)',
        shadow:      '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(59,130,246,0.15)',
        titleColor:  '#e2e8f0',
        labelColor:  '#64748b',
        valueColor:  '#cbd5e1',
        subColor:    '#475569',
        iconStroke:  '#38bdf8',
        divider:     'rgba(59,130,246,0.12)',
        accentBar:   'linear-gradient(90deg, #3b82f6, #06b6d4)',
      }
    : {
        outerBg:     'rgba(255, 255, 255, 0.80)',
        outerBorder: 'rgba(148, 163, 184, 0.30)',
        innerBg:     'rgba(255, 255, 255, 0.92)',
        shadow:      '0 12px 40px rgba(59,130,246,0.15), 0 2px 8px rgba(0,0,0,0.08)',
        titleColor:  '#0f172a',
        labelColor:  '#64748b',
        valueColor:  '#1e293b',
        subColor:    '#94a3b8',
        iconStroke:  '#3b82f6',
        divider:     'rgba(148,163,184,0.20)',
        accentBar:   'linear-gradient(90deg, #3b82f6, #06b6d4)',
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
      <div style="height:3px; background:${t.accentBar};"></div>

      <div style="padding:14px 16px; background:${t.innerBg};">

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <div style="
            width:30px; height:30px; border-radius:8px;
            background:${isDarkMode ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.08)'};
            border:1px solid ${isDarkMode ? 'rgba(59,130,246,0.3)' : 'rgba(59,130,246,0.2)'};
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
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

        <div style="height:1px; background:${t.divider}; margin-bottom:10px;"></div>

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
              <div style="
                width:18px; height:18px; border-radius:50%;
                background:${isDarkMode ? 'rgba(59,130,246,0.12)' : 'rgba(59,130,246,0.07)'};
                display:flex; align-items:center; justify-content:center;
                transform:rotate(${dir}deg);
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

// ── Model display name map ────────────────────────────────────────────────────

const WAVE_MODEL_LABELS = {
  WW3:  'Wave Watch III',
  MRI3: 'MRI III',
  ECWAM: 'ECWAM'
};

const waveModelLabel = (model = '') => {
  const key = model.trim().toUpperCase();
  return WAVE_MODEL_LABELS[key] ?? model.toUpperCase();
};

// ── Wave popup ────────────────────────────────────────────────────────────────

/**
 * @param {object} feature   - Mapbox GeoJSON feature
 * @param {boolean} isDarkMode
 * @param {string}  model    - Model name extracted from the layer id (e.g. 'WW3')
 */
export function createWavePopup(feature, isDarkMode = false, model = '') {
  const props      = feature.properties;
  const waveDir    = props.waveDirection != null ? Number(props.waveDirection).toFixed(1) : null;
  const wavePeriod = props.wavePeriod    != null ? Number(props.wavePeriod).toFixed(1)    : null;
  const waveHeight = props.waveHeight    != null ? Number(props.waveHeight).toFixed(2)    : null;

  // e.g. "NOAA WW3 Surface" or "MRI WaveWatch III Surface"
  const modelLabel = `${waveModelLabel(model)} Surface`;

  const t = isDarkMode
    ? {
        outerBg:     'rgba(8, 20, 40, 0.88)',
        outerBorder: 'rgba(99, 179, 237, 0.22)',
        innerBg:     'rgba(16, 36, 64, 0.92)',
        shadow:      '0 12px 40px rgba(0,0,0,0.65), 0 0 0 1px rgba(99,179,237,0.12)',
        titleColor:  '#e2e8f0',
        labelColor:  '#64748b',
        valueColor:  '#cbd5e1',
        subColor:    '#475569',
        iconStroke:  '#67e8f9',
        iconBg:      'rgba(99,179,237,0.15)',
        iconBorder:  'rgba(99,179,237,0.28)',
        compassBg:   'rgba(99,179,237,0.12)',
        divider:     'rgba(99,179,237,0.10)',
        accentBar:   'linear-gradient(90deg, #0ea5e9, #6366f1)',
      }
    : {
        outerBg:     'rgba(255, 255, 255, 0.82)',
        outerBorder: 'rgba(148, 163, 184, 0.28)',
        innerBg:     'rgba(255, 255, 255, 0.94)',
        shadow:      '0 12px 40px rgba(14,165,233,0.12), 0 2px 8px rgba(0,0,0,0.07)',
        titleColor:  '#0f172a',
        labelColor:  '#64748b',
        valueColor:  '#1e293b',
        subColor:    '#94a3b8',
        iconStroke:  '#0ea5e9',
        iconBg:      'rgba(14,165,233,0.08)',
        iconBorder:  'rgba(14,165,233,0.18)',
        compassBg:   'rgba(14,165,233,0.07)',
        divider:     'rgba(148,163,184,0.18)',
        accentBar:   'linear-gradient(90deg, #0ea5e9, #6366f1)',
      };

  const row = (label, valueHtml) => `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <span style="font-size:11px; color:${t.labelColor}; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">${label}</span>
      <div style="text-align:right;">${valueHtml}</div>
    </div>
  `;

  const val   = (v, unit) => `<span style="font-size:14px; font-weight:700; color:${t.valueColor};">${v} ${unit}</span>`;
  const null_ = ()        => `<span style="font-size:13px; color:${t.subColor};">—</span>`;

  const dirRow = waveDir != null
    ? `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <span style="font-size:11px; color:${t.labelColor}; font-weight:500; text-transform:uppercase; letter-spacing:0.05em;">Direction</span>
        <div style="display:flex; align-items:center; gap:6px;">
          <div style="
            width:18px; height:18px; border-radius:50%;
            background:${t.compassBg};
            display:flex; align-items:center; justify-content:center;
            transform:rotate(${waveDir}deg);
          ">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="${t.iconStroke}">
              <polygon points="5,1 8,9 5,7 2,9"/>
            </svg>
          </div>
          <span style="font-size:14px; font-weight:700; color:${t.valueColor};">${waveDir}°</span>
        </div>
      </div>`
    : row('Direction', null_());

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
      <div style="height:3px; background:${t.accentBar};"></div>

      <div style="padding:14px 16px; background:${t.innerBg};">

        <div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
          <div style="
            width:30px; height:30px; border-radius:8px;
            background:${t.iconBg};
            border:1px solid ${t.iconBorder};
            display:flex; align-items:center; justify-content:center; flex-shrink:0;
          ">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
              stroke="${t.iconStroke}" stroke-width="2.5" stroke-linecap="round">
              <path d="M2 12c.6-.6 1.4-1 2-1 1.5 0 2 1 3.5 1S10 11 11.5 11s2 1 3.5 1 2-1 3.5-1 2 1 3.5 1c.6 0 1.4-.4 2-1"/>
            </svg>
          </div>
          <div>
            <div style="font-size:13px; font-weight:700; color:${t.titleColor}; line-height:1;">Wave</div>
            <div style="font-size:10px; color:${t.labelColor}; margin-top:2px; text-transform:uppercase; letter-spacing:0.06em;">${modelLabel}</div>
          </div>
        </div>

        <div style="height:1px; background:${t.divider}; margin-bottom:10px;"></div>

        <div style="display:grid; gap:9px;">
          ${waveHeight != null ? row('Height',  val(waveHeight, 'm')) : row('Height',  null_())}
          ${wavePeriod != null ? row('Period',   val(wavePeriod, 's')) : row('Period',  null_())}
          ${dirRow}
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