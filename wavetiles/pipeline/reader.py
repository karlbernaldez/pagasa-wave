from __future__ import annotations

import json
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Iterator

import numpy as np
import xarray as xr

from wavetiles.pipeline.contract import (
    DEFAULT_FORECAST_HOURS,
    ContractValidationError,
    normalize_reference_time,
    validate_manifest,
    validate_normalized_cycle,
)


@dataclass(frozen=True)
class NormalizedWaveFrame:
    model: str
    source_cycle: str
    reference_time: str
    forecast_hour: int
    valid_time: np.datetime64
    latitude: np.ndarray
    longitude: np.ndarray
    significant_wave_height: np.ndarray


class NormalizedCycleReader:
    """Read one validated WaveLab normalized cycle without source-format knowledge."""

    def __init__(
        self,
        cycle_dir: str | Path,
        *,
        expected_forecast_hours=DEFAULT_FORECAST_HOURS,
    ) -> None:
        self.cycle_dir = Path(cycle_dir)
        self.expected_forecast_hours = tuple(int(value) for value in expected_forecast_hours)
        self.dataset_path, self.manifest_path = validate_normalized_cycle(
            self.cycle_dir,
            expected_forecast_hours=self.expected_forecast_hours,
        )
        try:
            with self.manifest_path.open("r", encoding="utf-8") as handle:
                self.manifest = validate_manifest(json.load(handle))
        except (OSError, json.JSONDecodeError) as error:
            raise ContractValidationError(
                f"Unable to read normalized manifest: {self.manifest_path}"
            ) from error

    @property
    def model(self) -> str:
        return self.manifest["model"]

    @property
    def source_cycle(self) -> str:
        return self.manifest["sourceCycle"]

    @property
    def reference_time(self) -> str:
        return self.manifest["referenceTime"]

    @property
    def forecast_hours(self) -> tuple[int, ...]:
        return tuple(int(value) for value in self.manifest["forecastHours"])

    def read_frame(self, forecast_hour: int) -> NormalizedWaveFrame:
        hour = int(forecast_hour)
        if hour not in self.forecast_hours:
            raise ContractValidationError(
                f"Forecast hour {hour} is not available in normalized cycle {self.cycle_dir}."
            )

        with xr.open_dataset(self.dataset_path) as dataset:
            hours = np.asarray(dataset["forecast_hour"].values, dtype=np.int64)
            matches = np.flatnonzero(hours == hour)
            if len(matches) != 1:
                raise ContractValidationError(
                    f"Normalized cycle must contain exactly one frame for forecast hour {hour}."
                )
            index = int(matches[0])
            wave = dataset["significant_wave_height"].isel(valid_time=index).load()
            latitude = np.asarray(dataset["latitude"].values, dtype=np.float64).copy()
            longitude = np.asarray(dataset["longitude"].values, dtype=np.float64).copy()
            valid_time = np.asarray(dataset["valid_time"].values).astype("datetime64[ns]")[index]

        return NormalizedWaveFrame(
            model=self.model,
            source_cycle=self.source_cycle,
            reference_time=normalize_reference_time(self.reference_time),
            forecast_hour=hour,
            valid_time=valid_time,
            latitude=latitude,
            longitude=longitude,
            significant_wave_height=np.asarray(wave.values, dtype=np.float32).copy(),
        )

    def iter_frames(self) -> Iterator[NormalizedWaveFrame]:
        for forecast_hour in self.forecast_hours:
            yield self.read_frame(forecast_hour)

    def reference_datetime(self) -> datetime:
        return datetime.fromisoformat(self.reference_time.replace("Z", "+00:00"))
