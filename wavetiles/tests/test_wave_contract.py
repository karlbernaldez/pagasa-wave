from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

from wavetiles.pipeline.contract import (
    CONTRACT_VERSION,
    DEFAULT_FORECAST_HOURS,
    ContractValidationError,
    build_manifest,
    validate_dataset,
    validate_manifest,
    validate_normalized_cycle,
)


class WaveContractTests(unittest.TestCase):
    def make_dataset(self) -> xr.Dataset:
        hours = list(DEFAULT_FORECAST_HOURS)
        valid_time = pd.date_range("2026-09-06T18:00:00Z", periods=len(hours), freq="3h")
        latitude = np.array([10.0, 11.0])
        longitude = np.array([120.0, 121.0, 122.0])
        values = np.ones((len(hours), len(latitude), len(longitude)), dtype=np.float32)
        return xr.Dataset(
            data_vars={
                "significant_wave_height": (
                    ("valid_time", "latitude", "longitude"),
                    values,
                    {"units": "m"},
                ),
            },
            coords={
                "valid_time": valid_time.tz_localize(None),
                "forecast_hour": ("valid_time", hours),
                "latitude": latitude,
                "longitude": longitude,
            },
            attrs={
                "contract_version": CONTRACT_VERSION,
                "model": "WW3",
                "source_cycle": "2026090618",
                "reference_time": "2026-09-06T18:00:00Z",
            },
        )

    def make_manifest(self) -> dict:
        return build_manifest(
            model="WW3",
            source_cycle="2026090618",
            reference_time="2026-09-06T18:00:00Z",
            source_format="netcdf",
            adapter_id="ww3-netcdf",
            adapter_version="1",
            forecast_hours=DEFAULT_FORECAST_HOURS,
            variables=["significant_wave_height"],
            source_files=["ww3_grdo.20260906T18.nc"],
        )

    def write_cycle(self, root: Path, *, manifest: dict | None = None) -> Path:
        cycle_dir = root / "WW3" / "2026090618"
        cycle_dir.mkdir(parents=True)
        self.make_dataset().to_netcdf(cycle_dir / "wave.nc")
        with (cycle_dir / "manifest.json").open("w", encoding="utf-8") as handle:
            json.dump(manifest or self.make_manifest(), handle)
        return cycle_dir

    def test_builds_versioned_manifest(self):
        manifest = self.make_manifest()

        self.assertEqual(manifest["contractVersion"], CONTRACT_VERSION)
        self.assertEqual(manifest["model"], "WW3")
        self.assertEqual(manifest["sourceCycle"], "2026090618")
        self.assertEqual(manifest["referenceTime"], "2026-09-06T18:00:00Z")
        self.assertEqual(manifest["frameCount"], 21)
        self.assertEqual(manifest["forecastHours"][-1], 60)

    def test_rejects_manifest_frame_count_mismatch(self):
        manifest = self.make_manifest()
        manifest["frameCount"] = 20

        with self.assertRaisesRegex(ContractValidationError, "frameCount"):
            validate_manifest(manifest)

    def test_accepts_canonical_dataset(self):
        validate_dataset(self.make_dataset(), expected_forecast_hours=DEFAULT_FORECAST_HOURS)

    def test_validates_complete_normalized_cycle(self):
        with tempfile.TemporaryDirectory() as temporary:
            cycle_dir = self.write_cycle(Path(temporary))
            dataset_path, manifest_path = validate_normalized_cycle(cycle_dir)

            self.assertEqual(dataset_path, cycle_dir / "wave.nc")
            self.assertEqual(manifest_path, cycle_dir / "manifest.json")

    def test_rejects_manifest_dataset_source_cycle_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest = self.make_manifest()
            manifest["sourceCycle"] = "2026090612"
            cycle_dir = self.write_cycle(Path(temporary), manifest=manifest)

            with self.assertRaisesRegex(ContractValidationError, "sourceCycle does not match"):
                validate_normalized_cycle(cycle_dir)

    def test_rejects_manifest_dataset_forecast_hour_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            manifest = self.make_manifest()
            manifest["forecastHours"][-1] = 63
            cycle_dir = self.write_cycle(Path(temporary), manifest=manifest)

            with self.assertRaisesRegex(ContractValidationError, "forecastHours does not match"):
                validate_normalized_cycle(cycle_dir)

    def test_rejects_wrong_units(self):
        dataset = self.make_dataset()
        dataset["significant_wave_height"].attrs["units"] = "cm"

        with self.assertRaisesRegex(ContractValidationError, "units must be m"):
            validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)

    def test_rejects_missing_forecast_frame(self):
        dataset = self.make_dataset().isel(valid_time=slice(0, -1))

        with self.assertRaisesRegex(ContractValidationError, "forecast_hour axis"):
            validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)

    def test_rejects_entirely_missing_wave_height(self):
        dataset = self.make_dataset()
        dataset["significant_wave_height"][:] = np.nan

        with self.assertRaisesRegex(ContractValidationError, "entirely missing"):
            validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)

    def test_rejects_valid_time_that_does_not_match_reference_time(self):
        dataset = self.make_dataset()
        shifted = dataset["valid_time"].values + np.timedelta64(3, "h")
        dataset = dataset.assign_coords(valid_time=("valid_time", shifted))

        with self.assertRaisesRegex(ContractValidationError, "reference_time"):
            validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)

    def test_rejects_descending_latitude(self):
        dataset = self.make_dataset().sortby("latitude", ascending=False)

        with self.assertRaisesRegex(ContractValidationError, "latitude must be strictly ascending"):
            validate_dataset(dataset, expected_forecast_hours=DEFAULT_FORECAST_HOURS)


if __name__ == "__main__":
    unittest.main()
