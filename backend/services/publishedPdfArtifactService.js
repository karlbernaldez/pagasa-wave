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

function getPublicOrigin() {
  const configured = String(process.env.PUBLIC_ORIGIN || '').trim();
  if (configured) return configured.replace(/\/+$/, '');

  const corsOrigin = String(process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .find(Boolean);

  if (corsOrigin) return corsOrigin.replace(/\/+$/, '');
  if (process.env.NODE_ENV === 'production') {
    throw new Error('PUBLIC_ORIGIN is required for published PDF generation.');
  }
  return 'http://127.0.0.1:5173';
}

function getArtifactRoot() {
  if (process.env.PUBLISHED_PDF_DIR) {
    return path.resolve(process.env.PUBLISHED_PDF_DIR);
  }
  if (process.env.NODE_ENV === 'production') {
    return '/var/lib/wavelab/published-pdfs';
  }
  return path.resolve('tmp', 'published-pdfs');
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
    forecastPackage.publishedAt?.toISOString?.() || forecastPackage.updatedAt?.toISOString?.() || '',
    ...chartRevisions,
  ].join('|');
}

function getArtifactRow(forecastPackage, style) {
  return forecastPackage.publishedPdfArtifacts?.find((artifact) => artifact.style === style);
}

function ensureArtifactRows(forecastPackage) {
  if (!Array.isArray(forecastPackage.publishedPdfArtifacts)) {
    forecastPackage.publishedPdfArtifacts = [];
  }

  PDF_STYLES.forEach(({ id }) => {
    if (!getArtifactRow(forecastPackage, id)) {
      forecastPackage.publishedPdfArtifacts.push({
        style: id,
        status: 'pending',
      });
    }
  });
}

function updateArtifact(forecastPackage, style, values) {
  ensureArtifactRows(forecastPackage);
  const artifact = getArtifactRow(forecastPackage, style);
  Object.assign(artifact, values);
}

function buildPdfHtml({ forecastPackage, styleLabel, charts }) {
  const dateLabel = formatManilaDateKey(forecastPackage.forecastDate);
  const cards = charts
    .map(
      ({ slot, project, imageDataUrl }) => `
        <article class="chart">
          <header>
            <div>
              <p class="slot">${escapeHtml(slot.badge || slot.label)}</p>
              <h2>${escapeHtml(project?.name || slot.label)}</h2>
            </div>
            <span class="type">${escapeHtml(slot.label)}</span>
          </header>
          <div class="map">
            <img src="${imageDataUrl}" alt="${escapeHtml(slot.label)}" />
          </div>
          <footer>
            <span>Published ${escapeHtml(formatManilaDateKey(project?.publishedAt || forecastPackage.publishedAt))}</span>
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
    .slot { margin: 0 0 .5mm; color: #0369a1; font-size: 6pt; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
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

async function capturePublishedChart(page, origin, projectId, style) {
  await page.evaluateOnNewDocument((styleMode) => {
    window.localStorage.setItem('wavelab.chartStyleMode', styleMode);
  }, style);

  await page.goto(`${origin}/charts/${encodeURIComponent(projectId)}?serverPdf=1`, {
    waitUntil: 'networkidle2',
    timeout: 60_000,
  });

  const selector = `[data-published-chart-map="${projectId}"][data-map-ready="true"]`;
  await page.waitForSelector(selector, { timeout: 45_000 });
  await new Promise((resolve) => setTimeout(resolve, 1500));

  const element = await page.$(selector);
  if (!element) throw new Error(`Published map not found for project ${projectId}`);

  const image = await element.screenshot({ type: 'png' });
  return `data:image/png;base64,${image.toString('base64')}`;
}

async function generateStyleArtifact(browser, forecastPackage, style) {
  const styleDefinition = PDF_STYLES.find((item) => item.id === style);
  if (!styleDefinition) throw new Error(`Unsupported PDF style: ${style}`);

  const origin = getPublicOrigin();
  const charts = [];

  for (const slot of REQUIRED_FORECAST_CHARTS) {
    const chart = forecastPackage.charts.find((item) => item.chartType === slot.chartType);
    const project = chart?.project;
    if (!project?._id || project.status !== PROJECT_STATUS.PUBLISHED) {
      throw new Error(`Published chart unavailable for ${slot.chartType}`);
    }

    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 });
      const imageDataUrl = await capturePublishedChart(page, origin, String(project._id), style);
      charts.push({
        slot: { ...slot, badge: slot.label.replace(' Wave Forecast', '').toUpperCase() },
        project,
        imageDataUrl,
      });
    } finally {
      await page.close();
    }
  }

  const renderPage = await browser.newPage();
  try {
    await renderPage.setContent(
      buildPdfHtml({
        forecastPackage,
        styleLabel: styleDefinition.label,
        charts,
      }),
      { waitUntil: 'load' }
    );

    return await renderPage.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true,
      margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
    });
  } finally {
    await renderPage.close();
  }
}

async function loadPublishedPackage(packageId) {
  return ForecastPackage.findById(packageId).populate('charts.project');
}

async function generatePackageArtifacts(packageId) {
  const forecastPackage = await loadPublishedPackage(packageId);
  if (!forecastPackage || forecastPackage.status !== FORECAST_PACKAGE_STATUS.PUBLISHED) {
    return;
  }

  ensureArtifactRows(forecastPackage);
  const sourceRevision = getSourceRevision(forecastPackage);
  const packageDir = path.join(getArtifactRoot(), String(forecastPackage._id));
  await fs.mkdir(packageDir, { recursive: true });

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=swiftshader',
    ],
  });

  try {
    for (const { id: style } of PDF_STYLES) {
      updateArtifact(forecastPackage, style, {
        status: 'generating',
        error: '',
        sourceRevision,
      });
      await forecastPackage.save();

      try {
        const pdfBuffer = await generateStyleArtifact(browser, forecastPackage, style);
        const fileName = `wave-chart-set-${formatManilaDateKey(forecastPackage.forecastDate)}-${style}.pdf`;
        const finalPath = path.join(packageDir, fileName);
        const temporaryPath = `${finalPath}.tmp-${process.pid}-${Date.now()}`;

        await fs.writeFile(temporaryPath, pdfBuffer);
        await fs.rename(temporaryPath, finalPath);

        updateArtifact(forecastPackage, style, {
          status: 'ready',
          filePath: finalPath,
          fileName,
          fileSize: pdfBuffer.length,
          sha256: crypto.createHash('sha256').update(pdfBuffer).digest('hex'),
          generatedAt: new Date(),
          sourceRevision,
          error: '',
        });
      } catch (error) {
        updateArtifact(forecastPackage, style, {
          status: 'failed',
          error: String(error?.message || error).slice(0, 1000),
          generatedAt: null,
        });
      }

      await forecastPackage.save();
    }
  } finally {
    await browser.close();
  }
}

export function queuePublishedPackagePdfGeneration(packageId) {
  const key = String(packageId || '');
  if (!key) return null;
  if (generationPromises.has(key)) return generationPromises.get(key);

  const promise = generatePackageArtifacts(key)
    .catch((error) => {
      console.error('[PublishedPdf] Package generation failed:', error);
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

  const artifact = (forecastPackage.publishedPdfArtifacts || []).find((item) => item.style === style);
  return { forecastPackage, artifact: artifact || null };
}

export async function ensurePublishedPdfArtifactForDate(dateKey, style) {
  const result = await getPublishedPdfArtifactForDate(dateKey, style);
  if (!result) return null;

  if (!result.artifact || ['pending', 'failed'].includes(result.artifact.status)) {
    queuePublishedPackagePdfGeneration(result.forecastPackage._id);
  }

  return result;
}

export function getPublishedPdfStyles() {
  return PDF_STYLES;
}
