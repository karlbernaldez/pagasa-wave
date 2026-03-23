#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
ECWAM GRIB/GRIB1 → Cartopy PNG chart + GeoJSON overlay (wave lines + typhoon)

Requirements:
  pip install rasterio cartopy matplotlib numpy
Optional:
  scipy (if you want smoothing like your tile pipeline)

Inputs:
  - GRIB_FILE: GRIB/GRIB1 file (sometimes .nc extension)
  - GEOJSON_FILE: forecaster-exported annotations
Outputs:
  - OUT_PNG: a single rendered PNG
"""

from pathlib import Path
import json

import numpy as np
import rasterio
import matplotlib
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap, BoundaryNorm
from matplotlib.offsetbox import OffsetImage, AnnotationBbox
from matplotlib.ticker import FixedLocator
from PIL import Image

import cartopy.crs as ccrs
import cartopy.feature as cfeature


# =========================
# CONFIG
# =========================
GRIB_FILE = Path("../input/W1P01120000011200011.nc")
BAND_INDEX = 1

GEOJSON_FILE = Path("./annotations/forecast.geojson")  # <-- your uploaded file
OUT_PNG = Path("./ecwam_cartopy_with_geojson.png")

# Plot domain (optional). If None, use raster bounds
# Example: Philippines-ish
USE_FIXED_EXTENT = True
EXTENT_LONLAT = (100, 140, 0, 25)  # (minLon, maxLon, minLat, maxLat)

MIN_VALID = 0.05
MAX_VISIBLE = 14.0

TYPHOON_ICON = Image.open("./icons/typhoon.png")

# =========================
# BINS + PALETTE (MRI3-like)
# =========================
HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

HW_COLORS_DEFAULT = np.array(
    [
        [0xCA, 0xED, 0xFB],
        [0x60, 0xCA, 0xF3],
        [0x0E, 0x9E, 0xD4],
        [0xC1, 0xF1, 0xC9],
        [0x82, 0xE2, 0x8F],
        [0x01, 0xB0, 0x51],
        [0xFF, 0xFF, 0x00],
        [0xFF, 0xE7, 0x01],
        [0xFE, 0xA4, 0x01],
        [0xFE, 0x00, 0x01],
        [0xAA, 0x15, 0x01],
        [0xAB, 0x45, 0x00],
        [0x6C, 0x33, 0x00],
        [0xD8, 0x6D, 0xCD],
        [0x79, 0x20, 0x70],
        [0x51, 0x15, 0x4A],
        [0x15, 0x61, 0x83],
        [0x0F, 0x29, 0x41],
        [0x81, 0x81, 0x80],
        [0x40, 0x40, 0x40],
    ],
    dtype=np.uint8,
)


# =========================
# Helpers
# =========================
def read_grib_band_as_latlon_grid(path: Path, band_index: int):
    """
    Reads a raster band and returns:
      data (float32), lon2d, lat2d, extent=(minLon,maxLon,minLat,maxLat)
    Assumes EPSG:4326 (common for GRIB lat/lon grids).
    """
    with rasterio.open(path) as src:
        arr = src.read(band_index).astype(np.float32)

        # Replace huge sentinels with NaN
        arr = np.where(np.abs(arr) > 1e6, np.nan, arr)

        transform = src.transform
        height, width = arr.shape

        # Bounds in source CRS (should be lon/lat for EPSG:4326)
        left, top = transform * (0, 0)
        right, bottom = transform * (width, height)

        # Ensure north-up
        if top < bottom:
            arr = np.flipud(arr)
            top, bottom = bottom, top

        # Build lon/lat grid using affine transform (cell centers)
        # x = left + (col+0.5)*xres ; y = top + (row+0.5)*yres (yres typically negative)
        xres = transform.a
        yres = transform.e
        cols = np.arange(width) + 0.5
        rows = np.arange(height) + 0.5
        lon1d = left + cols * xres
        lat1d = top + rows * yres

        lon2d, lat2d = np.meshgrid(lon1d, lat1d)

        extent = (min(left, right), max(left, right), min(bottom, top), max(bottom, top))

    return arr, lon2d, lat2d, extent


def mask_invalid(field: np.ndarray) -> np.ndarray:
    return np.isnan(field) | (field <= MIN_VALID) | (field > MAX_VISIBLE)


def value_to_palette_color_rgb(value: float) -> tuple:
    """
    Map a wave height numeric value to an RGB color using the same bins/palette.
    Used for styling the overlay labels/lines if you want color-coded overlays.
    """
    v = float(value)
    idx = np.digitize([v], HW_BINS, right=False)[0] - 1
    idx = int(np.clip(idx, 0, len(HW_COLORS_DEFAULT) - 1))
    rgb = HW_COLORS_DEFAULT[idx] / 255.0
    return (rgb[0], rgb[1], rgb[2])


# =========================
# GeoJSON overlay rendering
# =========================
def draw_geojson_overlays(ax, geojson_path: Path):
    gj = json.loads(geojson_path.read_text(encoding="utf-8"))
    feats = gj.get("features", [])

    for f in feats:
        geom = f.get("geometry") or {}
        props = f.get("properties") or {}

        gtype = geom.get("type")
        coords = geom.get("coordinates")

        # ---- LineString: wave heights ----
        if gtype == "LineString" and coords:
            # Your rule: all LineString == wave height line
            label_val = props.get("labelValue")
            closed = bool(props.get("closedMode", False))

            # Line style (server-defined). You can hardcode or derive from labelValue.
            line_color = (1, 1, 1)  # default white-ish
            line_width = 2.5

            if label_val is not None:
                try:
                    line_color = value_to_palette_color_rgb(float(label_val))
                except Exception:
                    pass

            lons = [c[0] for c in coords]
            lats = [c[1] for c in coords]

            ax.plot(
                lons,
                lats,
                transform=ccrs.PlateCarree(),
                linewidth=line_width,
                color=line_color,
                alpha=0.95,
                zorder=20,
            )

            # Labels at endpoints only if NOT closedMode
            if (not closed) and (label_val is not None) and len(coords) >= 2:
                for (x, y) in [(coords[0][0], coords[0][1]), (coords[-1][0], coords[-1][1])]:
                    ax.text(
                        x,
                        y,
                        str(label_val),
                        transform=ccrs.PlateCarree(),
                        fontsize=12,
                        fontweight="bold",
                        color="white",
                        ha="center",
                        va="center",
                        zorder=21,
                        bbox=dict(
                            boxstyle="round,pad=0.18",
                            facecolor=line_color,
                            edgecolor="none",
                            alpha=0.9,
                        ),
                    )

        # ---- Point: typhoon if properties.type == "typhoon" ----
        elif gtype == "Point" and coords:
            if props.get("type") == "typhoon":
                try:
                    lon, lat = extract_point_lonlat(coords)
                except ValueError as e:
                    print("! Skipping invalid Point:", e)
                    continue
                name = props.get("labelValue") or props.get("title") or ""

                if gtype == "Point" and props.get("type") == "typhoon":
                    try:
                        lon, lat = extract_point_lonlat(coords)
                    except ValueError:
                        continue

                    name = props.get("labelValue") or props.get("title", "")
                    draw_typhoon_icon(ax, lon, lat, label=name, zoom=0.02)

                if name:
                    ax.text(
                        lon,
                        lat - 0.6,
                        str(name),
                        transform=ccrs.PlateCarree(),
                        fontsize=11,
                        fontweight="bold",
                        color="white",
                        ha="center",
                        va="top",
                        zorder=31,
                    )

def extract_point_lonlat(coords):
    """
    Robustly extract (lon, lat) from GeoJSON Point coordinates.
    Handles:
      [lon, lat]
      [[lon, lat]]
      [[[lon, lat]]]
    """
    while isinstance(coords, (list, tuple)) and len(coords) == 1:
        coords = coords[0]

    if (
        isinstance(coords, (list, tuple))
        and len(coords) == 2
        and all(isinstance(v, (int, float)) for v in coords)
    ):
        return coords[0], coords[1]

    raise ValueError(f"Invalid Point coordinates: {coords}")

def draw_typhoon_icon(ax, lon, lat, label=None, zoom=0.08):
    oi = OffsetImage(TYPHOON_ICON, zoom=zoom)
    ab = AnnotationBbox(
        oi,
        (lon, lat),
        xycoords=ccrs.PlateCarree()._as_mpl_transform(ax),
        frameon=False,
        zorder=30,
    )
    ax.add_artist(ab)

    # if label:
    #     lat_offset = 0.6 + zoom * 6  # dynamic spacing
    #     ax.text(
    #         lon,
    #         lat - lat_offset,
    #         label,
    #         transform=ccrs.PlateCarree(),
    #         fontsize=11,
    #         fontweight="bold",
    #         color="white",
    #         ha="center",
    #         va="top",
    #         zorder=31,
    #     )

def main():
    # --- Read grib field ---
    field, lon2d, lat2d, extent = read_grib_band_as_latlon_grid(GRIB_FILE, BAND_INDEX)

    # Mask invalids (transparent)
    invalid = mask_invalid(field)
    plot_field = field.copy()
    plot_field[invalid] = np.nan

    # --- Build colormap & norm ---
    cmap = ListedColormap(HW_COLORS_DEFAULT / 255.0)
    norm = BoundaryNorm(HW_BINS, cmap.N, clip=True)

    # --- Setup map ---
    proj = ccrs.PlateCarree()
    fig = plt.figure(figsize=(13.5, 7.5), dpi=150)
    ax = plt.axes(projection=proj)

    if USE_FIXED_EXTENT:
        ax.set_extent(EXTENT_LONLAT, crs=proj)
    else:
        ax.set_extent((extent[0], extent[1], extent[2], extent[3]), crs=proj)

    # Basemap features
    ax.add_feature(cfeature.LAND, facecolor="#fce4b0", zorder=5)   # dark land like your editor
    ax.add_feature(cfeature.COASTLINE, linewidth=0.6, zorder=6)
    ax.add_feature(cfeature.BORDERS, linewidth=0.4, zorder=6)

    # --- Plot wave height as filled raster-like field ---
    # pcolormesh wants 2D lon/lat grids; shading="auto" is robust
    pm = ax.pcolormesh(
        lon2d,
        lat2d,
        plot_field,
        cmap=cmap,
        norm=norm,
        shading="auto",
        transform=proj,
        zorder=1,
        alpha=0.85
    )

    # Colorbar (optional)
    cb = plt.colorbar(
    pm,
    ax=ax,
    orientation="horizontal",
    pad=0.03,
    fraction=0.04
    )

    cb.set_label("Significant Wave Height (m)")

    # FORCE more ticks (use your actual bins)
    cb.ax.xaxis.set_major_locator(FixedLocator(HW_BINS))

    # Optional: format labels nicely
    cb.set_ticklabels([f"{b:g}" for b in HW_BINS])

    cb.ax.tick_params(
        axis="x",
        which="major",
        labelsize=6,
        length=6,
        width=1
    )

    # --- GeoJSON overlay ---
    if GEOJSON_FILE.exists():
        draw_geojson_overlays(ax, GEOJSON_FILE)
    else:
        print(f"! GeoJSON not found: {GEOJSON_FILE}")

    # Final polish
    ax.gridlines(draw_labels=False, linewidth=0.4, linestyle=":", alpha=0.5)
    plt.title("MECO-TECO-VOTE III - WaveLab", loc="left")
    plt.title("ECWAM 2026011200", loc="right")

    OUT_PNG.parent.mkdir(parents=True, exist_ok=True)
    plt.savefig(OUT_PNG, bbox_inches="tight")
    plt.close(fig)

    print(f"✓ Saved: {OUT_PNG.resolve()}")


if __name__ == "__main__":
    main()
