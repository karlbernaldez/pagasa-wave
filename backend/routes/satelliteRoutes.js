import express from "express";
import {
  getSatelliteImageById,
  getAllSatelliteImages,
} from "../controllers/satelliteController.js";

const router = express.Router();

// GET all 24 satellite images (base64 JSON)
router.get("/", getAllSatelliteImages);

// GET single satellite image (raw binary)
router.get("/:id", getSatelliteImageById);

export default router;
