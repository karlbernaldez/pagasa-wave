// services/satelliteService.js
import fetch from "node-fetch";
import { promises as fsp } from "fs";
import fs from "fs";
import path from "path";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import cron from "node-cron";
import dotenv from "dotenv";
import sharp from "sharp";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TOKEN = process.env.TOKEN || "";
const PANAHON_SESSION = process.env.PANAHON_SESSION || "";
const XSRF_TOKEN = process.env.XSRF_TOKEN || "";
const PANAHON_COOKIE = `_ga=GA1.1.895444753.1751268319; panahon_session=${PANAHON_SESSION}; XSRF-TOKEN=${XSRF_TOKEN}`;

const SAVE_DIR = path.resolve(process.env.SAVE_DIR || path.join(__dirname, "..", "frames"));
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, "..", "public"));
const TMP_DIR = path.resolve(process.env.TMP_DIR || path.join(__dirname, "..", "tmp"));
const FRAME_COUNT = Number(process.env.FRAME_COUNT || 24);
const GIF_DELAY = process.env.GIF_DELAY || "8"; // ImageMagick -delay value (1/100s)
const CRON_EXPR = process.env.CRON || "*/30 * * * *";

await fsp.mkdir(SAVE_DIR, { recursive: true });
await fsp.mkdir(PUBLIC_DIR, { recursive: true });
await fsp.mkdir(TMP_DIR, { recursive: true });

let isRunning = false;
let lastRun = null;
let lastStatus = { ok: false, message: "not run yet", frames: 0, time: null };

function execFileAsync(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, opts, (err, stdout, stderr) => {
      if (err) return reject(new Error(`${err.message}\n${stderr || ""}`));
      resolve(stdout);
    });
  });
}

function pad(n) {
  return String(n).padStart(2, "0");
}

export async function fetchSatelliteFrame(id) {
  const idStr = pad(id);
  const outfile = path.join(SAVE_DIR, `${idStr}.png`);
  const url = `https://www.panahon.gov.ph/api/v1/satellite?id=${id}&parameter=sat&token=${TOKEN}`;

  const res = await fetch(url, {
    headers: {
      Cookie: PANAHON_COOKIE,
      "User-Agent": "Mozilla/5.0",
      Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
    },
    timeout: 20000,
  });

  if (!res.ok) throw new Error(`Frame ${id} fetch failed: ${res.status} ${res.statusText}`);

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  await fsp.writeFile(outfile, buffer);

  // ✅ validate image before returning path
  try {
    await sharp(buffer).metadata(); // throws if not valid
  } catch {
    await fsp.unlink(outfile); // remove bad file
    throw new Error(`Invalid PNG for frame ${id}`);
  }

  return outfile;
}

async function fetchWithRetry(id, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fetchSatelliteFrame(id);
    } catch (err) {
      if (attempt < retries) {
        console.warn(`Retrying frame ${id} (attempt ${attempt})...`);
      } else {
        throw err;
      }
    }
  }
}

async function buildGifImageMagick() {
  let files = (await fsp.readdir(SAVE_DIR))
    .filter(f => f.endsWith(".png"))
    .sort()
    .reverse();

  // remove invalid/empty images
  const validFiles = [];
  for (const f of files) {
    const full = path.join(SAVE_DIR, f);
    try {
      const stat = await fsp.stat(full);
      if (stat.size > 0) {
        await sharp(full).metadata(); // throws if invalid
        validFiles.push(full);
      }
    } catch {
      console.warn(`Skipping invalid frame: ${f}`);
      await fsp.unlink(full).catch(() => { }); // cleanup broken file
    }
  }

  if (validFiles.length === 0) throw new Error("No valid frames available to build GIF");

  const tmpOut = path.join(TMP_DIR, "himawari.tmp.gif");
  const finalOut = path.join(PUBLIC_DIR, "himawari.gif");

  const args = ["-delay", "50", "-loop", "0", ...validFiles, tmpOut];

  await execFileAsync("convert", args);
  await fsp.rename(tmpOut, finalOut);
  return finalOut;
}

export async function buildMp4() {
  const gifPath = path.join(PUBLIC_DIR, "himawari.gif");
  const mp4Path = path.join(PUBLIC_DIR, "himawari.mp4");

  if (!fs.existsSync(gifPath)) {
    throw new Error("GIF not found, cannot build MP4");
  }

  const args = [
    "-y",                   // overwrite output
    "-i", gifPath,          // input GIF
    "-movflags", "faststart", // optimize for web
    "-pix_fmt", "yuv420p",  // H.264 compatible pixel format
    "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", // width/height divisible by 2
    mp4Path
  ];

  await execFileAsync("ffmpeg", args);

  return mp4Path;
}

// Optional GeoTIFF helper (requires gdal_translate installed)
export async function buildGeoTiff(inputFile, outputFile, bbox = { minLon: 115.0, maxLon: 135.0, minLat: 5.0, maxLat: 25.0 }) {
  // -a_ullr minLon maxLat maxLon minLat
  const args = [
    "-of", "GTiff",
    "-a_ullr",
    String(bbox.minLon), String(bbox.maxLat), String(bbox.maxLon), String(bbox.minLat),
    inputFile,
    outputFile,
  ];
  await execFileAsync("gdal_translate", args);
  return outputFile;
}

async function pruneFrames() {
  const saved = (await fsp.readdir(SAVE_DIR)).filter((f) => f.endsWith(".png")).sort();
  if (saved.length > FRAME_COUNT) {
    const extra = saved.slice(0, saved.length - FRAME_COUNT);
    for (const f of extra) {
      await fsp.unlink(path.join(SAVE_DIR, f));
    }
  }
}

export async function runJob() {
  if (isRunning) {
    return { ok: false, message: "job already running" };
  }
  isRunning = true;
  lastRun = new Date();
  lastStatus = { ok: false, message: "running", frames: 0, time: lastRun.toISOString() };

  try {
    // Fetch frames sequentially, continue if some fail
    for (let i = 1; i <= FRAME_COUNT; i++) {
      try {
        await fetchWithRetry(i);
      } catch (err) {
        console.error(`Warning: failed to fetch frame ${i}:`, err.message);
      }
    }

    await pruneFrames();

    const files = (await fsp.readdir(SAVE_DIR)).filter((f) => f.endsWith(".png")).sort();
    lastStatus.frames = files.length;

    if (files.length === 0) throw new Error("No frames downloaded");

    // Build GIF
    const gifPath = await buildGifImageMagick();
    console.log("GIF created:", gifPath);

    // Build MP4
    let mp4Path = null;
    try {
      mp4Path = await buildMp4();
      console.log("MP4 created:", mp4Path);
    } catch (err) {
      console.error("Failed to build MP4:", err.message);
    }

    lastStatus = {
      ok: true,
      message: "gif + mp4 created",
      frames: files.length,
      gif: gifPath,
      mp4: mp4Path,
      time: new Date().toISOString()
    };

    return lastStatus;

  } catch (err) {
    console.error("runJob error:", err);
    lastStatus = { ok: false, message: err.message, time: new Date().toISOString() };
    return lastStatus;
  } finally {
    isRunning = false;
  }
}

let cronTask = null;
export function startScheduler() {
  if (cronTask) return;
  // schedule and run immediately on start
  cronTask = cron.schedule(CRON_EXPR, () => {
    console.log("Cron tick: starting satellite runJob()");
    runJob().catch((e) => console.error("cron runJob fail", e));
  }, { scheduled: true });
  // kick off once immediately
  runJob().catch((e) => console.error("initial runJob failed", e));
}

export function getStatus() {
  return { isRunning, lastRun, lastStatus };
}

export function getGifPath() {
  const p = path.join(PUBLIC_DIR, "himawari.gif");
  return fs.existsSync(p) ? p : null;
}
