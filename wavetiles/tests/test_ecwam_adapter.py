from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

import numpy as np
import xarray as xr

from wavetiles.pipeline.adapters.ecwam import ECWAMAdapterError, ECWAMGRIBAdapter
from wavetiles.pipeline.contract import DEFAULT_FORECAST_HOURS, validate_normalized_cycle


class ECWAMAdapterTests(unittest.TestCase):
    reference = datetime(2026, 9, 6, 18, tzinfo=timezone.utc)

    def make_cycle(self, root: Path, cycle: str = "2026090618", *, omit_hour: int | None = None) -> Path:
        cycle_dir = root / cycle
        cycle_dir.mkdir(parents=True)
        cycle_time = datetime.strptime(cycle, "%Y%m%d%H").replace(tzinfo=timezone.utc)
        for hour in DEFAULT_FORECAST_HOURS:
            if hour == omit_hour:
                continue
            valid = cycle_time + timedelta(hours=hour)
            name = f"W1P{cycle_time:%m%d}{cycle_time:%H}00{valid:%m%d%H}001"
            (cycle_dir / name).write_bytes(b"grib")
        return cycle_dir

    def synthetic_frame(self, path: Path, expected_valid_time: datetime, grid_points: int) -> xr.DataArray:
        self.assertEqual(grid_points, 6)
        hour = int((expected_valid_time - self.reference).total_seconds() // 3600)
        values = np.full((2, 3), 1.0 + hour / 100.0, dtype=np.float32)
        return xr.DataArray(
            values,
            dims=("latitude", "longitude"),
            coords={
                "latitude": np.array([10.0, 11.0], dtype=np.float64),
                "longitude": np.array([120.0, 121.0, 122.0], dtype=np.float64),
            },
            attrs={"units": "m"},
            name="significant_wave_height",
        )

    def test_discovers_exact_18z_cycle_in_forecast_order(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.make_cycle(root)
            adapter = ECWAMGRIBAdapter(grid_points=6)

            cycle = adapter.discover_cycle(root, reference_time=self.reference)

            self.assertEqual(cycle.cycle, "2026090618")
            self.assertEqual(cycle.reference_time, self.reference)
            self.assertEqual(cycle.source_format, "grib1")
            self.assertEqual(len(cycle.files), 21)
            self.assertIn("0906", cycle.files[0].name)
            self.assertIn("0618", cycle.files[0].name)
            self.assertIn("090906", cycle.files[-1].name)

    def test_rejects_incomplete_required_18z_cycle(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.make_cycle(root, omit_hour=24)
            self.make_cycle(root, cycle="2026090612")
            adapter = ECWAMGRIBAdapter(grid_points=6)

            with self.assertRaisesRegex(ECWAMAdapterError, "No complete ECWAM 18Z source cycle"):
                adapter.discover_cycle(root, reference_time=self.reference)

    def test_normalizes_21_frames_into_contract(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            cycle_dir = self.make_cycle(root / "source")
            normalized = root / "normalized"
            adapter = ECWAMGRIBAdapter(grid_points=6)
            source_cycle = adapter.discover_cycle(cycle_dir, reference_time=self.reference)

            with patch("wavetiles.pipeline.adapters.ecwam._normalize_frame", side_effect=self.synthetic_frame):
                result = adapter.normalize(source_cycle, normalized)

            self.assertEqual(result.model, "ECWAM")
            self.assertEqual(result.source_cycle, "2026090618")
            self.assertEqual(result.frame_count, 21)
            validate_normalized_cycle(result.normalized_dir)

            with xr.open_dataset(result.dataset_path) as dataset:
                self.assertEqual(dataset.attrs["model"], "ECWAM")
                self.assertEqual(dataset.attrs["source_cycle"], "2026090618")
                self.assertEqual(dataset.attrs["source_format"], "grib1")
                self.assertEqual(dataset.attrs["source_grid_points"], 6)
                self.assertEqual(dataset.sizes["valid_time"], 21)
                np.testing.assert_allclose(
                    dataset["significant_wave_height"].isel(valid_time=-1).values,
                    1.60,
                )

            manifest = json.loads(result.manifest_path.read_text(encoding="utf-8"))
            self.assertEqual(manifest["adapter"]["id"], "ecwam-grib1")
            self.assertEqual(manifest["sourceFormat"], "grib1")
            self.assertEqual(manifest["frameCount"], 21)

    def test_rejects_non_18z_reference(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            self.make_cycle(root)
            adapter = ECWAMGRIBAdapter(grid_points=6)

            with self.assertRaisesRegex(ECWAMAdapterError, "18Z"):
                adapter.discover_cycle(
                    root,
                    reference_time=datetime(2026, 9, 6, 12, tzinfo=timezone.utc),
                )


if __name__ == "__main__":
    unittest.main()
