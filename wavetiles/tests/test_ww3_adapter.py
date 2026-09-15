from __future__ import annotations

import json
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

import numpy as np
import xarray as xr

from wavetiles.pipeline.adapters.ww3 import WW3AdapterError, WW3NetCDFAdapter
from wavetiles.pipeline.contract import CONTRACT_VERSION, DEFAULT_FORECAST_HOURS, validate_dataset


class WW3AdapterTests(unittest.TestCase):
    reference_time = datetime(2026, 9, 6, 18, tzinfo=timezone.utc)
    source_cycle = "2026090618"

    def write_source_cycle(
        self,
        root: Path,
        *,
        units: str = "m",
        cycle: str | None = None,
    ) -> Path:
        cycle_dir = root / (cycle or self.source_cycle)
        cycle_dir.mkdir(parents=True)
        latitude = np.array([12.0, 11.0, 10.0], dtype=np.float32)
        longitude = np.array([120.0, 121.0, 122.0], dtype=np.float32)

        for index, hour in enumerate(DEFAULT_FORECAST_HOURS):
            valid_time = self.reference_time + timedelta(hours=hour)
            values = np.full((1, 3, 3), 1.0 + index / 10.0, dtype=np.float32)
            dataset = xr.Dataset(
                data_vars={
                    "hs": (
                        ("time", "lat", "lon"),
                        values,
                        {"units": units},
                    )
                },
                coords={
                    "time": [np.datetime64(valid_time.replace(tzinfo=None))],
                    "lat": latitude,
                    "lon": longitude,
                },
            )
            dataset.to_netcdf(cycle_dir / f"ww3_grdo.{valid_time:%Y%m%dT%H}.nc")
        return cycle_dir

    def test_normalizes_21_frames_into_one_cycle_file(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_root = root / "input"
            normalized_root = root / "normalized"
            self.write_source_cycle(input_root)

            adapter = WW3NetCDFAdapter()
            source = adapter.discover_cycle(input_root, reference_time=self.reference_time)
            result = adapter.normalize(source, normalized_root)

            self.assertEqual(result.source_cycle, self.source_cycle)
            self.assertEqual(result.frame_count, 21)
            self.assertEqual(result.normalized_dir, normalized_root / "WW3" / "2026090618")
            self.assertTrue(result.dataset_path.is_file())
            self.assertTrue(result.manifest_path.is_file())

            with xr.open_dataset(result.dataset_path) as dataset:
                validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)
                self.assertEqual(dataset.attrs["contract_version"], CONTRACT_VERSION)
                self.assertEqual(dataset.attrs["source_cycle"], self.source_cycle)
                self.assertEqual(dataset.attrs["reference_time"], "2026-09-06T18:00:00Z")
                self.assertEqual(dataset.sizes["valid_time"], 21)
                np.testing.assert_array_equal(dataset["forecast_hour"].values, DEFAULT_FORECAST_HOURS)
                np.testing.assert_array_equal(dataset["latitude"].values, [10.0, 11.0, 12.0])
                self.assertAlmostEqual(
                    float(dataset["significant_wave_height"].isel(valid_time=0).mean()),
                    1.0,
                )

            with result.manifest_path.open("r", encoding="utf-8") as handle:
                manifest = json.load(handle)
            self.assertEqual(manifest["sourceCycle"], self.source_cycle)
            self.assertEqual(manifest["referenceTime"], "2026-09-06T18:00:00Z")
            self.assertEqual(manifest["frameCount"], 21)
            self.assertEqual(len(manifest["sourceFiles"]), 21)

    def test_existing_matching_normalized_cycle_is_idempotent(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_root = root / "input"
            normalized_root = root / "normalized"
            self.write_source_cycle(input_root)

            adapter = WW3NetCDFAdapter()
            source = adapter.discover_cycle(input_root, reference_time=self.reference_time)
            first = adapter.normalize(source, normalized_root)
            second = adapter.normalize(source, normalized_root)

            self.assertEqual(first.dataset_path, second.dataset_path)
            self.assertEqual(first.manifest_path, second.manifest_path)

    def test_converts_centimetres_to_metres(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_root = root / "input"
            normalized_root = root / "normalized"
            cycle_dir = self.write_source_cycle(input_root, units="cm")
            first_file = cycle_dir / "ww3_grdo.20260906T18.nc"
            with xr.open_dataset(first_file) as original:
                changed = original.load()
            changed["hs"][:] = 250.0
            changed.to_netcdf(first_file, mode="w")

            adapter = WW3NetCDFAdapter()
            source = adapter.discover_cycle(input_root, reference_time=self.reference_time)
            result = adapter.normalize(source, normalized_root)

            with xr.open_dataset(result.dataset_path) as dataset:
                self.assertAlmostEqual(
                    float(dataset["significant_wave_height"].isel(valid_time=0).mean()),
                    2.5,
                )
                self.assertEqual(dataset["significant_wave_height"].attrs["units"], "m")

    def test_rejects_mislabeled_internal_source_time(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            input_root = root / "input"
            normalized_root = root / "normalized"
            cycle_dir = self.write_source_cycle(input_root)
            first_file = cycle_dir / "ww3_grdo.20260906T18.nc"
            with xr.open_dataset(first_file) as original:
                changed = original.load()
            changed = changed.assign_coords(time=[np.datetime64("2026-09-06T21:00:00")])
            changed.to_netcdf(first_file, mode="w")

            adapter = WW3NetCDFAdapter()
            source = adapter.discover_cycle(input_root, reference_time=self.reference_time)
            with self.assertRaisesRegex(WW3AdapterError, "timestamp mismatch"):
                adapter.normalize(source, normalized_root)

    def test_requires_explicit_reference_time(self):
        with tempfile.TemporaryDirectory() as temporary:
            input_root = Path(temporary) / "input"
            self.write_source_cycle(input_root)

            with self.assertRaisesRegex(WW3AdapterError, "explicit reference_time"):
                WW3NetCDFAdapter().discover_cycle(input_root)

    def test_requires_18z_reference_time(self):
        with tempfile.TemporaryDirectory() as temporary:
            input_root = Path(temporary) / "input"
            self.write_source_cycle(input_root)
            invalid_reference = datetime(2026, 9, 6, 12, tzinfo=timezone.utc)

            with self.assertRaisesRegex(WW3AdapterError, "18Z"):
                WW3NetCDFAdapter().discover_cycle(input_root, reference_time=invalid_reference)

    def test_does_not_fall_back_to_12z_source_cycle(self):
        with tempfile.TemporaryDirectory() as temporary:
            input_root = Path(temporary) / "input"
            self.write_source_cycle(input_root, cycle="2026090612")

            with self.assertRaisesRegex(WW3AdapterError, "2026090618"):
                WW3NetCDFAdapter().discover_cycle(input_root, reference_time=self.reference_time)

    def test_rejects_incomplete_retained_window(self):
        with tempfile.TemporaryDirectory() as temporary:
            input_root = Path(temporary) / "input"
            cycle_dir = self.write_source_cycle(input_root)
            (cycle_dir / "ww3_grdo.20260907T00.nc").unlink()

            with self.assertRaisesRegex(WW3AdapterError, "No complete WW3 18Z source cycle"):
                WW3NetCDFAdapter().discover_cycle(input_root, reference_time=self.reference_time)


if __name__ == "__main__":
    unittest.main()
