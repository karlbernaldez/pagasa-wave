import numpy as np
import rioxarray
import rasterio
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from pathlib import Path

class WindVisualizer:
    """Enhanced wind speed visualization with SOLARSTORM + DARKSTORM colormaps."""

    def __init__(self, max_wind_kt=80, gamma=0.6, alpha=0.85):
        self.max_wind_kt = max_wind_kt
        self.gamma = gamma
        self.alpha = alpha  # keep float
        self.cmap_solar = self._create_solarstorm_cmap()
        self.cmap_dark = self._create_darkstorm_cmap()

    # -------------------------------------------------------
    # COLOR MAPS
    # -------------------------------------------------------
    def _create_solarstorm_cmap(self):
        solarstorm = [
            (0.00, "#2a00b5"), (0.08, "#0047ff"), (0.12, "#00c6ff"),
            (0.24, "#00ffc8"), (0.40, "#23ce26"), (0.48, "#ffe600"),
            (0.58, "#ff8c00"), (0.68, "#ff004c"), (0.88, "#ff00b8"),
            (0.94, "#ffffff"), (1.00, "#aaaaaa"),
        ]
        return LinearSegmentedColormap.from_list("solarstorm", solarstorm, N=4096)

    def _create_darkstorm_cmap(self):
        darkstorm = [
            (0.00, "#000009"), (0.08, "#001A33"), (0.16, "#003A66"),
            (0.28, "#007B92"), (0.42, "#00FFC8"), (0.54, "#00FF84"),
            (0.66, "#FFD800"), (0.78, "#FF8C00"), (0.88, "#FF0055"),
            (0.96, "#FF00DE"), (1.00, "#FFFFFF"),
        ]
        return LinearSegmentedColormap.from_list("darkstorm", darkstorm, N=4096)

    # -------------------------------------------------------
    # DATA LOAD / NORMALIZE
    # -------------------------------------------------------
    def load_wind_data(self, filepath):
        if not Path(filepath).exists():
            raise FileNotFoundError(f"Wind data file not found: {filepath}")

        da = rioxarray.open_rasterio(filepath)
        wind_ms = da.squeeze().values
        wind_knots = wind_ms * 1.94384

        return wind_knots, da.rio.transform(), da.rio.crs

    def normalize(self, wind_knots):
        arr = np.clip(wind_knots / self.max_wind_kt, 0, 1)
        return arr ** self.gamma

    # -------------------------------------------------------
    # APPLY COLOR + SAVE TIFF
    # -------------------------------------------------------
    def apply_cmap(self, normalized, cmap):
        rgba = (cmap(normalized) * 255).astype(np.uint8)
        rgba[:, :, 3] = int(self.alpha * 255)
        return rgba

    def save_tif(self, rgba, transform, crs, filename):
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
        with rasterio.open(filename, "w", **profile) as dst:
            for i in range(4):
                dst.write(rgba[:, :, i], i + 1)
        print(f"✅ Saved: {filename}")

    # -------------------------------------------------------
    # SINGLE PNG PREVIEW (Both maps side-by-side)
    # -------------------------------------------------------
    def save_preview_dual(self, solar_rgba, dark_rgba, wind_knots,
                          out_file="wind_dual_preview.png", dpi=150):

        fig, axes = plt.subplots(1, 2, figsize=(18, 8))

        # ---------------- Solarstorm Preview ----------------
        axes[0].imshow(solar_rgba)
        axes[0].set_title("SOLARSTORM (Bright)", fontsize=14, fontweight="bold")
        axes[0].axis("off")

        sm1 = plt.cm.ScalarMappable(cmap=self.cmap_solar,
                                    norm=plt.Normalize(0, self.max_wind_kt))
        sm1.set_array([])
        plt.colorbar(sm1, ax=axes[0], orientation="horizontal", fraction=0.046)

        # ---------------- Darkstorm Preview ----------------
        axes[1].imshow(dark_rgba)
        axes[1].set_title("DARKSTORM (Night Mode)", fontsize=14, fontweight="bold")
        axes[1].axis("off")

        sm2 = plt.cm.ScalarMappable(cmap=self.cmap_dark,
                                    norm=plt.Normalize(0, self.max_wind_kt))
        sm2.set_array([])
        plt.colorbar(sm2, ax=axes[1], orientation="horizontal", fraction=0.046)

        plt.tight_layout()
        plt.savefig(out_file, dpi=dpi, bbox_inches="tight")
        plt.close()

        print(f"🖼️ Preview saved: {out_file}")

    # -------------------------------------------------------
    # MAIN PROCESS (Solarstorm + Darkstorm + Single Preview)
    # -------------------------------------------------------
    def process_all(self, input_path,
                    tif_solar="wind_solarstorm.tif",
                    tif_dark="wind_darkstorm.tif",
                    preview_png="wind_dual_preview.png"):

        print(f"\n🌪️ Processing wind data: {input_path}")

        wind_knots, transform, crs = self.load_wind_data(input_path)
        normalized = self.normalize(wind_knots)

        # Solarstorm
        print("🌈 Generating Solarstorm...")
        rgba_solar = self.apply_cmap(normalized, self.cmap_solar)
        self.save_tif(rgba_solar, transform, crs, tif_solar)

        # Darkstorm
        print("🌙 Generating Darkstorm (Night Mode)...")
        rgba_dark = self.apply_cmap(normalized, self.cmap_dark)
        self.save_tif(rgba_dark, transform, crs, tif_dark)

        # One combined PNG preview
        print("🖼️ Saving dual preview PNG…")
        self.save_preview_dual(rgba_solar, rgba_dark, wind_knots, preview_png)

        print("\n🎉 All outputs generated successfully!\n")


# -------------------------------------------------------
# RUN SCRIPT
# -------------------------------------------------------
if __name__ == "__main__":
    visualizer = WindVisualizer(
        max_wind_kt=80,
        gamma=0.6,
        alpha=0.85
    )

    visualizer.process_all(
        input_path="wind_speed.tif",
        tif_solar="wind_solarstorm.tif",
        tif_dark="wind_darkstorm.tif",
        preview_png="wind_dual_preview.png"
    )
