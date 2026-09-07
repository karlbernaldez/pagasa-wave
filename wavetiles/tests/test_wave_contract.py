from __future__ import annotations

import unittest

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
                "valid_time": valid_time,
                "forecast_hour": ("valid_time", hours),
                "latitude": latitude,
                "longitude": longitude,
            },
        )

    def test_builds_versioned_manifest(self):
        manifest = build_manifest(
            model="ww3",
            source_cycle="2026090618",
            source_format="netcdf",
            adapter_id="ww3-netcdf",
            adapter_version="1",
            forecast_hours=DEFAULT_FORECAST_HOURS,
            variables=["significant_wave_height"],
            source_files=["ww3_grdo.2026090618.nc"],
        )

        self.assertEqual(manifest["contractVersion"], CONTRACT_VERSION)
        self.assertEqual(manifest["model"], "WW3")
        self.assertEqual(manifest["frameCount"], 21)
        self.assertEqual(manifest["forecastHours"][-1], 60)

    def test_rejects_manifest_frame_count_mismatch(self):
        manifest = build_manifest(
            model="WW3",
            source_cycle="2026090618",
            source_format="netcdf",
            adapter_id="ww3-netcdf",
            adapter_version="1",
            forecast_hours=DEFAULT_FORECAST_HOURS,
            variables=["significant_wave_height"],
        )
        manifest["frameCount"] = 20

        with self.assertRaisesRegex(ContractValidationError, "frameCount"):
            validate_manifest(manifest)

    def test_accepts_canonical_dataset(self):
        validate_dataset(self.make_dataset(), expected_forecast_hours=DEFAULT_FORECAST_HOURS)

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


if __name__ == "__main__":
    unittest.main()
