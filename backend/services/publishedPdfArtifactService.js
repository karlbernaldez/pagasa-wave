import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import puppeteer from 'puppeteer';

import ForecastPackage from '../models/ForecastPackage.js';
import { FORECAST_PACKAGE_STATUS, REQUIRED_FORECAST_CHARTS } from '../utils/forecastPackage.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const PDF_STYLES = Object.freeze([
  { id: 'wave-wind', label: 'Wave & Wind' },
  { id: 'wave-only', label: 'Wave Only' },
  { id: 'visually-impaired', label: 'Accessible' },
]);
const PDF_STYLE_IDS = new Set(PDF_STYLES.map((style) => style.id));
const generationPromises = new Map();
const MAX_SNAPSHOT_BYTES = 4 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function getArtifactRoot() {
  const configured = String(process.env.PUBLISHED_ARTIFACT_DIR || '').trim();
  if (configured) return path.resolve(configured);

  const legacyPdfRoot = String(process.env.PUBLISHED_PDF_DIR || '').trim();
  if (legacyPdfRoot) {
    return path.join(path.dirname(path.resolve(legacyPdfRoot)), 'published-artifacts');
  }

  if (process.env.NODE_ENV === 'production') {
    return '/var/lib/wavelab/published-artifacts';
  }

  return path.resolve('tmp', 'published-artifacts');
}

function formatManilaDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value: partValue }) => [type, partValue]));
  return `${values.year}-${values.month}-${values.day}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getSourceRevision(forecastPackage) {
  const chartRevisions = (forecastPackage.charts || []).map((chart) => {
    const project = chart.project;
    return `${chart.chartType}:${project?._id || project}:${project?.version || 0}`;
  });

  return [
    forecastPackage._id,
    forecastPackage.publishedAt?.toISOString?.() ||
      forecastPackage.updatedAt?.toISOString?.() ||
      '',
    ...chartRevisions,
  ].join('|');
}

function getPdfArtifactRow(forecastPackage, style) {
  return forecastPackage.publishedPdfArtifacts?.find((artifact) => artifact.style === style);
}

function ensurePdfArtifactRows(forecastPackage) {
  if (!Array.isArray(forecastPackage.publishedPdfArtifacts)) {
    forecastPackage.publishedPdfArtifacts = [];
  }

  PDF_STYLES.forEach(({ id }) => {
    if (!getPdfArtifactRow(forecastPackage, id)) {
      forecastPackage.publishedPdfArtifacts.push({
        style: id,
        status: 'pending',
      });
    }
  });
}

function updatePdfArtifact(forecastPackage, style, values) {
  ensurePdfArtifactRows(forecastPackage);
  Object.assign(getPdfArtifactRow(forecastPackage, style), values);
}

function getSnapshotRow(forecastPackage, style, chartType) {
  return forecastPackage.publishedChartSnapshots?.find(
    (snapshot) => snapshot.style === style && snapshot.chartType === chartType
  );
}

function upsertSnapshotRow(forecastPackage, style, chartType, values) {
  if (!Array.isArray(forecastPackage.publishedChartSnapshots)) {
    forecastPackage.publishedChartSnapshots = [];
  }

  const existing = getSnapshotRow(forecastPackage, style, chartType);
  if (existing) {
    Object.assign(existing, values);
    return existing;
  }

  forecastPackage.publishedChartSnapshots.push({ style, chartType, ...values });
  return getSnapshotRow(forecastPackage, style, chartType);
}

function getSnapshotReadiness(forecastPackage, style) {
  const sourceRevision = getSourceRevision(forecastPackage);
  const snapshots = REQUIRED_FORECAST_CHARTS.map((slot) => {
    const chart = (forecastPackage.charts || []).find((item) => item.chartType === slot.chartType);
    const projectId = String(chart?.project?._id || chart?.project || '');
    const snapshot = getSnapshotRow(forecastPackage, style, slot.chartType);
    const ready = Boolean(
      snapshot?.filePath &&
        snapshot?.sha256 &&
        snapshot?.sourceRevision === sourceRevision &&
        String(snapshot?.project || '') === projectId
    );

    return {
      chartType: slot.chartType,
      label: slot.label,
      projectId,
      snapshot,
      ready,
    };
  });

  return {
    ready: snapshots.every((item) => item.ready),
    readyCount: snapshots.filter((item) => item.ready).length,
    requiredCount: snapshots.length,
    snapshots,
    sourceRevision,
  };
}

function decodeSnapshotDataUrl(value) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/=\r\n]+)$/.exec(String(value || ''));
  if (!match) {
    throw new Error('Published chart snapshot must be a PNG data URL.');
  }

  const buffer = Buffer.from(match[1], 'base64');
  if (!buffer.length || buffer.length > MAX_SNAPSHOT_BYTES) {
    throw new Error('Published chart snapshot exceeds the 4 MB size limit.');
  }

  if (!buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Published chart snapshot is not a valid PNG image.');
  }

  return buffer;
}

function getPackageDirectory(forecastPackage) {
  return path.join(getArtifactRoot(), String(forecastPackage._id));
}

function getSnapshotPath(forecastPackage, style, chartType) {
  return path.join(getPackageDirectory(forecastPackage), 'snapshots', style, `${chartType}.png`);
}

function getPdfPath(forecastPackage, style) {
  const dateKey = formatManilaDateKey(forecastPackage.forecastDate);
  return path.join(
    getPackageDirectory(forecastPackage),
    'pdf',
    `wave-chart-set-${dateKey}-${style}.pdf`
  );
}

async function writeAtomic(filePath, buffer) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const temporaryPath = `${filePath}.tmp-${process.pid}-${Date.now()}`;
  await fs.writeFile(temporaryPath, buffer);
  await fs.rename(temporaryPath, filePath);
}

function buildPdfHtml({ forecastPackage, styleLabel, charts }) {
  const dateLabel = formatManilaDateKey(forecastPackage.forecastDate);
  const cards = charts
    .map(
      ({ slot, project, imageDataUrl }) => `
        <article class="chart">
          <header>
            <div>
              <p class="slot">${escapeHtml(slot.label)}</p>
              <h2>${escapeHtml(project?.name || slot.label)}</h2>
            </div>
            <span class="type">${escapeHtml(styleLabel)}</span>
          </header>
          <div class="map">
            <img src="${imageDataUrl}" alt="${escapeHtml(slot.label)}" />
          </div>
          <footer>
            <span>Published ${escapeHtml(
              formatManilaDateKey(project?.publishedAt || forecastPackage.publishedAt)
            )}</span>
            <span>DOST-PAGASA WaveLab</span>
          </footer>
        </article>
      `
    )
    .join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    @page { size: A4 landscape; margin: 0; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 297mm; height: 210mm; background: #fff; }
    body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; }
    .page { width: 297mm; height: 210mm; padding: 6mm; display: grid; grid-template-rows: auto 1fr auto; gap: 2.5mm; }
    .top { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #cbd5e1; padding-bottom: 3mm; }
    .brand { color: #0369a1; font-size: 7pt; font-weight: 900; letter-spacing: .14em; text-transform: uppercase; }
    h1 { margin: 1mm 0 0; font-size: 16pt; }
    .summary { margin: 1mm 0 0; color: #475569; font-size: 8pt; font-weight: 700; }
    .badge { border: 1px solid #86efac; border-radius: 999px; background: #f0fdf4; color: #047857; padding: 2mm 3.5mm; font-size: 7pt; font-weight: 900; }
    .grid { min-height: 0; display: grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap: 2.5mm; }
    .chart { min-height: 0; display: grid; grid-template-rows: auto 1fr auto; gap: 1.5mm; border: 1px solid #bfdbfe; border-radius: 4mm; padding: 2mm; background: #f8fafc; overflow: hidden; }
    .chart header, .chart footer { display: flex; justify-content: space-between; gap: 3mm; align-items: flex-start; }
    .slot { margin: 0 0 .5mm; color: #0369a1; font-size: 6pt; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
    h2 { margin: 0; font-size: 8pt; line-height: 1.1; }
    .type { color: #64748b; font-size: 6pt; font-weight: 900; text-transform: uppercase; }
    .map { min-height: 0; overflow: hidden; border: 1px solid #dbeafe; border-radius: 3mm; background: #e2e8f0; }
    .map img { width: 100%; height: 100%; object-fit: contain; display: block; }
    .chart footer { color: #64748b; font-size: 5.8pt; font-weight: 700; }
    .foot { display: flex; justify-content: space-between; gap: 4mm; border-top: 1px solid #e2e8f0; padding-top: 1mm; color: #64748b; font-size: 5.5pt; }
  </style>
</head>
<body>
  <main class="page">
    <section class="top">
      <div>
        <div class="brand">DOST-PAGASA - WaveLab</div>
        <h1>Wave chart set</h1>
        <p class="summary">Valid ${escapeHtml(dateLabel)} - ${escapeHtml(styleLabel)} - Published operational output</p>
      </div>
      <div class="badge">Official published PDF</div>
    </section>
    <section class="grid">${cards}</section>
    <footer class="foot">
      <span>Supplementary marine forecast guidance. Refer to official PAGASA bulletins, warnings, and advisories.</span>
      <span>Generated ${escapeHtml(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))}</span>
    </footer>
  </main>
</body>
</html>`;
}

async function loadPublishedPackage(packageId) {
  return ForecastPackage.findById(packageId).populate('charts.project');
}

async function generateStylePdf(browser, forecastPackage, style) {
  const styleDefinition = PDF_STYLES.find((item) => item.id === style);
  if (!styleDefinition) throw new Error(`Unsupported PDF style: ${style}`);

  const readiness = getSnapshotReadiness(forecastPackage, style);
  if (!readiness.ready) {
    throw new Error(
      `Published chart snapshots are incomplete for ${style}: ${readiness.readyCount}/${readiness.requiredCount}`
    );
  }

  const charts = [];
  for (const item of readiness.snapshots) {
    const chart = forecastPackage.charts.find((row) => row.chartType === item.chartType);
    const image = await fs.readFile(item.snapshot.filePath);
    charts.push({
      slot: REQUIRED_FORECAST_CHARTS.find((slot) => slot.chartType === item.chartType),
      project: chart?.project,
      imageDataUrl: `data:image/png;base64,${image.toString('base64')}`,
    });
  }

  const page = await browser.newPage();
  try {
    await page.setContent(
      buildPdfHtml({
        forecastPackage,
        styleLabel: styleDefinition.label,
        charts,
      }),
      { waitUntil: 'load' }
    );

    return await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } finally {
    await page.close();
  }
}

async function generatePackageArtifacts(packageId) {
  const forecastPackage = await loadPublishedPackage(packageId);
  if (!forecastPackage || forecastPackage.status !== FORECAST_PACKAGE_STATUS.PUBLISHED) return;

  ensurePdfArtifactRows(forecastPackage);
  const sourceRevision = getSourceRevision(forecastPackage);
  const readyStyles = PDF_STYLES.filter(({ id }) => getSnapshotReadiness(forecastPackage, id).ready);
  if (!readyStyles.length) {
    await forecastPackage.save();
    return;
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    for (const { id: style } of readyStyles) {
      updatePdfArtifact(forecastPackage, style, {
        status: 'generating',
        error: '',
        sourceRevision,
      });
      await forecastPackage.save();

      try {
        const pdfBuffer = await generateStylePdf(browser, forecastPackage, style);
        const finalPath = getPdfPath(forecastPackage, style);
        await writeAtomic(finalPath, pdfBuffer);

        updatePdfArtifact(forecastPackage, style, {
          status: 'ready',
          filePath: finalPath,
          fileName: path.basename(finalPath),
          fileSize: pdfBuffer.length,
          sha256: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
          generatedAt: new Date(),
          sourceRevision,
          error: '',
        });
      } catch (error) {
        const errorMessage = String(error?.message || error).slice(0, 1000);
        console.error('[PublishedPdf] Static PDF composition failed', {
          packageId: String(forecastPackage._id),
          style,
          message: errorMessage,
        });
        updatePdfArtifact(forecastPackage, style, {
          status: 'failed',
          error: errorMessage,
          generatedAt: null,
        });
      }

      await forecastPackage.save();
    }
  } finally {
    await browser.close();
  }
}

export async function initializePublishedPackageArtifacts(packageId) {
  const forecastPackage = await loadPublishedPackage(packageId);
  if (!forecastPackage || forecastPackage.status !== FORECAST_PACKAGE_STATUS.PUBLISHED) return null;

  ensurePdfArtifactRows(forecastPackage);
  const sourceRevision = getSourceRevision(forecastPackage);
  PDF_STYLES.forEach(({ id }) => {
    updatePdfArtifact(forecastPackage, id, {
      status: 'pending',
      sourceRevision,
      error: '',
      generatedAt: null,
    });
  });
  await forecastPackage.save();
  return forecastPackage;
}

export async function savePublishedChartSnapshot({
  packageId,
  style,
  chartType,
  projectId,
  imageDataUrl,
}) {
  if (!isPublishedPdfStyle(style)) throw new Error('Unsupported published chart style.');

  const forecastPackage = await loadPublishedPackage(packageId);
  if (!forecastPackage || forecastPackage.status !== FORECAST_PACKAGE_STATUS.PUBLISHED) {
    throw new Error('Forecast Package must be published before snapshots can be stored.');
  }

  const chart = (forecastPackage.charts || []).find((item) => item.chartType === chartType);
  const resolvedProjectId = String(chart?.project?._id || chart?.project || '');
  if (!chart || !resolvedProjectId || resolvedProjectId !== String(projectId || '')) {
    throw new Error('Snapshot project does not match the published Forecast Package chart.');
  }
  if (chart.project?.status !== PROJECT_STATUS.PUBLISHED) {
    throw new Error('Snapshot project must be published.');
  }

  const image = decodeSnapshotDataUrl(imageDataUrl);
  const sourceRevision = getSourceRevision(forecastPackage);
  const filePath = getSnapshotPath(forecastPackage, style, chartType);
  await writeAtomic(filePath, image);

  upsertSnapshotRow(forecastPackage, style, chartType, {
    project: chart.project._id,
    filePath,
    fileName: path.basename(filePath),
    fileSize: image.length,
    sha256: crypto.createHash('sha256').update(image).digest('hex'),
    sourceRevision,
    capturedAt: new Date(),
  });

  updatePdfArtifact(forecastPackage, style, {
    status: 'pending',
    filePath: '',
    fileName: '',
    fileSize: 0,
    sha256: '',
    generatedAt: null,
    sourceRevision,
    error: '',
  });

  await forecastPackage.save();
  return getSnapshotReadiness(forecastPackage, style);
}

export function queuePublishedPackagePdfGeneration(packageId) {
  const key = String(packageId || '');
  if (!key) return null;
  if (generationPromises.has(key)) return generationPromises.get(key);

  const promise = generatePackageArtifacts(key)
    .catch((error) => {
      console.error('[PublishedPdf] Package composition failed:', error);
    })
    .finally(() => generationPromises.delete(key));

  generationPromises.set(key, promise);
  return promise;
}

export function isPublishedPdfStyle(value) {
  return PDF_STYLE_IDS.has(String(value || ''));
}

export async function getPublishedPdfArtifactForDate(dateKey, style) {
  if (!isPublishedPdfStyle(style)) return null;

  const forecastPackage = await ForecastPackage.findOne({
    status: FORECAST_PACKAGE_STATUS.PUBLISHED,
    forecastDate: {
      $gte: new Date(`${dateKey}T00:00:00+08:00`),
      $lt: new Date(`${dateKey}T23:59:59.999+08:00`),
    },
  }).lean();

  if (!forecastPackage) return null;

  const artifact = (forecastPackage.publishedPdfArtifacts || []).find(
    (item) => item.style === style
  );
  return {
    forecastPackage,
    artifact: artifact || null,
    readiness: getSnapshotReadiness(forecastPackage, style),
  };
}

export async function ensurePublishedPdfArtifactForDate(dateKey, style) {
  const result = await getPublishedPdfArtifactForDate(dateKey, style);
  if (!result) return null;

  if (
    result.readiness.ready &&
    (!result.artifact || ['pending', 'generating', 'failed'].includes(result.artifact.status))
  ) {
    queuePublishedPackagePdfGeneration(result.forecastPackage._id);
  }

  return result;
}

export async function getPublishedPackageArtifactReadiness(packageId) {
  const forecastPackage = await loadPublishedPackage(packageId);
  if (!forecastPackage) return null;

  return {
    packageId: String(forecastPackage._id),
    styles: Object.fromEntries(
      PDF_STYLES.map(({ id }) => {
        const readiness = getSnapshotReadiness(forecastPackage, id);
        const artifact = getPdfArtifactRow(forecastPackage, id);
        return [
          id,
          {
            ready: readiness.ready,
            readyCount: readiness.readyCount,
            requiredCount: readiness.requiredCount,
            pdfStatus: artifact?.status || 'pending',
          },
        ];
      })
    ),
  };
}

export function getPublishedPdfStyles() {
  return PDF_STYLES;
}
