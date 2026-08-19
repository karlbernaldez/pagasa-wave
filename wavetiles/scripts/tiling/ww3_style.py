"""Shared WW3 significant-wave-height bins and palettes."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np

MIN_VALID = 0.05
MAX_VISIBLE = 20.0

HW_BINS = np.array(
    [0, 0.25, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14, 20],
    dtype=np.float32,
)

HW_COLORS_LIGHT = np.array(
    [
        [0xCA, 0xED, 0xFB], [0x60, 0xCA, 0xF3], [0x0E, 0x9E, 0xD4], [0xC1, 0xF1, 0xC9],
        [0x82, 0xE2, 0x8F], [0x01, 0xB0, 0x51], [0xFF, 0xFF, 0x00], [0xFF, 0xE7, 0x01],
        [0xFE, 0xA4, 0x01], [0xFE, 0x00, 0x01], [0xAA, 0x15, 0x01], [0xAB, 0x45, 0x00],
        [0x6C, 0x33, 0x00], [0xD8, 0x6D, 0xCD], [0x79, 0x20, 0x70], [0x51, 0x15, 0x4A],
        [0x15, 0x61, 0x83], [0x0F, 0x29, 0x41], [0x81, 0x81, 0x80], [0x40, 0x40, 0x40],
    ],
    dtype=np.uint8,
)

HW_COLORS_DARK = np.array(
    [
        [8, 40, 60], [12, 70, 100], [18, 110, 150], [20, 140, 160], [30, 170, 140],
        [40, 190, 120], [90, 200, 110], [140, 210, 90], [190, 200, 70], [220, 180, 60],
        [240, 150, 50], [245, 120, 45], [250, 90, 40], [240, 60, 80], [220, 40, 120],
        [190, 30, 150], [140, 30, 170], [100, 30, 180], [160, 160, 160], [210, 210, 210],
    ],
    dtype=np.uint8,
)

HW_COLORS_NIGHT = np.array(
    [
        [8, 8, 8], [30, 0, 0], [60, 0, 0], [90, 10, 0], [120, 20, 0], [150, 30, 0],
        [180, 40, 0], [210, 60, 0], [240, 90, 0], [255, 120, 0], [255, 150, 20],
        [255, 180, 60], [255, 210, 100], [255, 240, 150], [255, 255, 200], [255, 255, 255],
        [255, 255, 255], [255, 255, 255], [200, 200, 200], [160, 160, 160],
    ],
    dtype=np.uint8,
)


@dataclass(frozen=True)
class Style:
    name: str
    palette: str
    colors: np.ndarray
    alpha_stops: tuple[tuple[float, float], ...] | None = None


STYLES = {
    "light": Style("light", "mri3-like", HW_COLORS_LIGHT),
    "dark": Style(
        "dark",
        "dark-marine",
        HW_COLORS_DARK,
        ((0.0, 0), (0.5, 40), (1.5, 90), (3.0, 160), (6.0, 220), (10.0, 255)),
    ),
    "night": Style(
        "night",
        "ecdis-night",
        HW_COLORS_NIGHT,
        ((0.0, 0), (0.5, 30), (2.0, 110), (5.0, 200), (10.0, 255)),
    ),
}

# Operational isolines: half-metre spacing through 6 m, then the existing
# higher-wave palette thresholds. These are all represented by the raster ramp.
CONTOUR_LEVELS = np.array(
    [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 7, 8, 9, 10, 12, 14],
    dtype=np.float32,
)


def color_for_height(height: float, style_name: str) -> str:
    """Return the exact raster bucket color for a wave height as #RRGGBB."""
    style = STYLES[style_name]
    index = int(np.clip(np.digitize(height, HW_BINS, right=False) - 1, 0, len(style.colors) - 1))
    red, green, blue = (int(value) for value in style.colors[index])
    return f"#{red:02X}{green:02X}{blue:02X}"
