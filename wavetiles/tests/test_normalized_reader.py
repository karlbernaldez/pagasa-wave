from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

import numpy as np
import pandas as pd
import xarray as xr

from wavetiles.pipeline.contract import CONTRACT_VERSION, DEFAULT_FORECAST_HOURS, build_manifest
from wavetiles.pipeline.reader import NormalizedCycleReader


class NormalizedCycleReaderTests(unittest.TestCase):
    def write_cycle(self, root: Path) -> Path:
        cycle_dir = root / "WW3" / "2026090618"
        cycle_dir.mkdir(parents=True)
        hours = list(DEFAULT_FORECAST_HOURS)
        valid_time = pd.date_range("2026-09-06T18:00:00Z", periods=len(hours), freq="3h")
        latitude = np.array([10.0, 11.0], dtype=np.float64)
        longitude = np.array([120.0, 121.0, 122.0], dtype=np.float64)
        values = np.stack(
            [np.full((2, 3), 1.0 + hour / 100.0, dtype=np.float32) for hour in hours]
        )
        dataset = xr.Dataset(
            data_vars={
                "significant_wave_height": (
                    ("valid_time", "latitude", "longitude"),
                    values,
                    {"units": "m"},
                )
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
        dataset.to_netcdf(cycle_dir / "wave.nc")
        manifest = build_manifest(
            model="WW3",
            source_cycle="2026090618",
            reference_time="2026-09-06T18:00:00Z",
            source_format="netcdf",
            adapter_id="ww3-netcdf",
            adapter_version="1",
            forecast_hours=hours,
            variables=["significant_wave_height"],
        )
        with (cycle_dir / "manifest.json").open("w", encoding="utf-8") as handle:
            json.dump(manifest, handle)
        return cycle_dir

    def test_reads_metadata_without_source_format_knowledge(self):
        with tempfile.TemporaryDirectory() as temporary:
            reader = NormalizedCycleReader(self.write_cycle(Path(temporary)))

            self.assertEqual(reader.model, "WW3")
            self.assertEqual(reader.source_cycle, "2026090618")
            self.assertEqual(reader.reference_time, "2026-09-06T18:00:00Z")
            self.assertEqual(reader.forecast_hours, DEFAULT_FORECAST_HOURS)

    def test_reads_requested_canonical_frame(self):
        with tempfile.TemporaryDirectory() as temporary:
            reader = NormalizedCycleReader(self.write_cycle(Path(temporary)))
            frame = reader.read_frame(24)

            self.assertEqual(frame.forecast_hour, 24)
            self.assertEqual(str(frame.valid_time), "2026-09-07T18:00:00.000000000")
            np.testing.assert_array_equal(frame.latitude, [10.0, 11.0])
            np.testing.assert_array_equal(frame.longitude, [120.0, 121.0, 122.0])
            np.testing.assert_allclose(frame.significant_wave_height, 1.24)

    def test_iterates_all_retained_frames(self):
        with tempfile.TemporaryDirectory() as temporary:
            reader = NormalizedCycleReader(self.write_cycle(Path(temporary)))
            frames = list(reader.iter_frames())

            self.assertEqual(len(frames), 21)
            self.assertEqual(frames[0].forecast_hour, 0)
            self.assertEqual(frames[-1].forecast_hour, 60)


if __name__ == "__main__":
    unittest.main()
