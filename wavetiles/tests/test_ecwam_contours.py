from __future__ import annotations

import sys
from pathlib import Path

import numpy as np

TILING_DIR = Path(__file__).resolve().parents[1] / "scripts" / "tiling"
sys.path.insert(0, str(TILING_DIR))

from ecwam_contours import generate_contours  # noqa: E402
from ww3_style import color_for_height  # noqa: E402


def test_generate_ecwam_contours_use_shared_wave_palette():
    lat = np.array([10.0, 11.0, 12.0], dtype=np.float64)
    lon = np.array([120.0, 121.0, 122.0], dtype=np.float64)
    data = np.array(
        [
            [0.0, 1.0, 2.0],
            [1.0, 2.0, 3.0],
            [2.0, 3.0, 4.0],
        ],
        dtype=np.float32,
    )

    document = generate_contours(lat, lon, data, levels=np.array([1.0, 2.5, 4.5]))

    assert document["type"] == "FeatureCollection"
    assert document["properties"]["model"] == "ECWAM"
    assert document["properties"]["variable"] == "swh"
    assert document["properties"]["units"] == "m"
    assert document["features"]

    heights = {feature["properties"]["height"] for feature in document["features"]}
    assert 1.0 in heights
    assert 2.5 in heights
    assert 4.5 not in heights

    for feature in document["features"]:
        properties = feature["properties"]
        height = properties["height"]
        assert properties["label"] == f"{height:g} m"
        assert properties["color_light"] == color_for_height(height, "light")
        assert properties["color_dark"] == color_for_height(height, "dark")
        assert len(feature["geometry"]["coordinates"]) >= 2
