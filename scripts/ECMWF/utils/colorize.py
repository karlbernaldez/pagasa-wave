#!/usr/bin/env python3
import numpy as np
import rioxarray
import rasterio
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from pathlib import Path

TIFF_DIR = Path("./ECMWF/ecmwf_data/TIFF")          # from compute.py
OUT_DIR = Path("./ECMWF/ecmwf_data/COLORIZED")      # colorized output
OUT_DIR.mkdir(parents=True, exist_ok=True)

print("🎨 Applying SOLARSTORM colormap to TIFF files")
print(f"📂 Source TIFF directory:  {TIFF_DIR}")
print(f"📂 Output COLORIZED folder: {OUT_DIR}")
print("--------------------------------------------------")

# 🧹 CLEANUP: ensure only 4 latest outputs exist
for old in OUT_DIR.glob("*"):
    old.unlink()

# ✅ Only use the latest 4 TIFFs (in case compute.py incorrectly left more)
tiff_files = sorted(TIFF_DIR.glob("*.tif"), reverse=True)[:4]

if not tiff_files:
    print("❌ No TIFF files found. Run compute.py first.")
    exit(1)

print(f"🔍 Found {len(tiff_files)} TIFFs for colorizing.")

# -------------------------------------------------------
# 🌈 WindVisualizer Class
# -------------------------------------------------------
class WindVisualizer:
    """Enhanced wind speed visualization with SOLARSTORM colormap."""

    def __init__(self, max_wind_kt=80, gamma=0.6, alpha=0.85):
        self.max_wind_kt = max_wind_kt
        self.gamma = gamma
        self.alpha = int(alpha * 255)
        self.cmap = self._create_solarstorm_cmap()

    def _create_solarstorm_cmap(self):
        solarstorm = [
            (0.00, "#2a00b5"), (0.08, "#0047ff"), (0.12, "#00c6ff"),
            (0.24, "#00ffc8"), (0.40, "#23ce26"), (0.48, "#ffe600"),
            (0.58, "#ff8c00"), (0.68, "#ff004c"), (0.88, "#ff00b8"),
            (0.94, "#ffffff"), (1.00, "#aaaaaa")
        ]
        return LinearSegmentedColormap.from_list("solarstorm", solarstorm, N=4096)

    def load_wind_data(self, filepath):
        da = rioxarray.open_rasterio(filepath).squeeze(drop=True)
        wind_knots = da.values * 1.94384  # m/s → knots
        return wind_knots, da.rio.transform(), da.rio.crs

    def normalize_wind(self, wind_knots):
        normalized = np.clip(wind_knots / self.max_wind_kt, 0, 1)
        return normalized ** self.gamma

    def apply_colormap(self, normalized):
        rgba = (self.cmap(normalized) * 255).astype(np.uint8)
        rgba[:, :, 3] = self.alpha  # transparent overlay
        return rgba

    def save_geotiff(self, rgba, transform, crs, output_path):
        profile = {
            "driver": "GTiff",
            "height": rgba.shape[0],
            "width": rgba.shape[1],
            "count": 4,
            "dtype": "uint8",
            "transform": transform,
            "crs": crs,
            "compress": "DEFLATE",
            "tiled": True,
            "blockxsize": 256,
            "blockysize": 256,
            "photometric": "RGB",
            "ALPHA": "YES",
        }
        with rasterio.open(output_path, "w", **profile) as dst:
            dst.write(rgba[:, :, 0], 1)
            dst.write(rgba[:, :, 1], 2)
            dst.write(rgba[:, :, 2], 3)
            dst.write(rgba[:, :, 3], 4)
        print(f"✅ Colorized TIFF → {output_path.name}")

    def create_preview(self, rgba, preview_path):
        plt.figure(figsize=(10, 7))
        plt.imshow(rgba)
        plt.axis("off")
        plt.savefig(preview_path, dpi=250, bbox_inches="tight")
        plt.close()
        print(f"🖼️ Preview PNG → {preview_path.name}")

    def process(self, tif_file):
        print(f"\n🌪 Colorizing: {tif_file.name}")

        wind_knots, transform, crs = self.load_wind_data(tif_file)
        normalized = self.normalize_wind(wind_knots)
        rgba = self.apply_colormap(normalized)

        out_tif = OUT_DIR / f"{tif_file.stem}_solarstorm.tif"
        out_png = OUT_DIR / f"{tif_file.stem}_preview.png"

        self.save_geotiff(rgba, transform, crs, out_tif)
        self.create_preview(rgba, out_png)


# -------------------------------------------------------
# 🚀 PROCESS ONLY LATEST 4 TIFF FILES
# -------------------------------------------------------
visualizer = WindVisualizer()

for tif in tiff_files:
    visualizer.process(tif)

print("\n✅ DONE — COLORIZED TIFFs ready for Mapbox upload.")
print(f"📂 Output folder: {OUT_DIR}")
