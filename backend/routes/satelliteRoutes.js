// routes/satelliteRoutes.js
import express from "express";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import {
  runJob,
  getStatus,
  getGifPath,
} from "../services/satelliteServices.js";

const router = express.Router();

// ✅ Serve latest GIF
router.get("/latest", (req, res) => {
  const gif = getGifPath();
  if (!gif) {
    return res.status(404).json({ ok: false, message: "No GIF available yet" });
  }
  res.sendFile(path.resolve(gif));
});

// ✅ Proxy single frame by id (streaming, no disk write)
router.get("/proxy/:id", async (req, res) => {
  const { id } = req.params;
  const url = `https://www.panahon.gov.ph/api/v1/satellite?id=${id}&parameter=sat&token=${process.env.TOKEN}`;

  try {
    const response = await fetch(url, {
      headers: {
        Cookie: process.env.PANAHON_COOKIE,
        "User-Agent": "Mozilla/5.0",
        Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
      },
      timeout: 20000,
    });

    if (!response.ok) {
      throw new Error(`Remote fetch failed: ${response.status} ${response.statusText}`);
    }

    res.setHeader("Content-Type", "image/png");
    response.body.pipe(res); // 🔄 Direct stream to client
  } catch (err) {
    console.error("proxy error:", err);
    res.status(500).json({ ok: false, message: err.message });
  }
});

// ✅ Manual trigger (protected by API key)
router.post("/trigger", async (req, res) => {
  if (req.headers["x-api-key"] !== process.env.ADMIN_KEY) {
    return res.status(403).json({ ok: false, message: "Forbidden" });
  }

  const result = await runJob();
  res.json(result);
});

// ✅ Status endpoint with gifUrl
router.get("/status", (req, res) => {
  const gif = getGifPath();
  res.json({
    ...getStatus(),
    gifUrl: gif ? "/api/satellite/latest" : null,
  });
});

export default router;
