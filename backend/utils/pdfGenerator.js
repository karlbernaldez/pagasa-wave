import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const asset = (file) => path.join(__dirname, '..', 'assets', file);
const templateFile = path.join(__dirname, '..', 'templates', 'Chart.html');

export const createStyledPdfBuffer = async () => {
  console.log('[PDF] Building data URIs and template...');

  // Load images as base64 Data URIs
  const toBase64DataUri = async (filepath, mime) => {
    const file = await fs.readFile(filepath);
    return `data:${mime};base64,${file.toString('base64')}`;
  };

  const templateHtml = await fs.readFile(templateFile, 'utf-8');
  const compiled = handlebars.compile(templateHtml);

  const html = compiled({
    reportTitle: 'Wave Charts Report',
    reportDateText: '1100000UTC FEB 2026 - WW3',
    preparedByName: 'KARL SANTIAGO B. BERNALDEZ',
    preparedByTitle: 'Technical Specialist I',
    certifiedByName: 'JEHAN FE S. PANTI',
    certifiedByTitle: 'Weather Specialist II',
    pagasaLogoDataUri: await toBase64DataUri(asset('image2.png'), 'image/png'),
    agencyLogoDataUri: await toBase64DataUri(asset('image3.png'), 'image/png'),
    chartImageDataUri: await toBase64DataUri(asset('image1.png'), 'image/png'),
    signatureDataUri: await toBase64DataUri(asset('image4.png'), 'image/png')
  });

  console.log('[PDF] Rendering HTML to PDF via Puppeteer...');

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'] // important for your environment!
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdf = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0mm',
      bottom: '0mm',
      left: '0mm',
      right: '0mm'
    }
  });

  await browser.close();

  console.log('[PDF] PDF buffer generated successfully!');
  return pdf;
};
