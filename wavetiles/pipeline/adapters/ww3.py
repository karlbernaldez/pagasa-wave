from __future__ import annotations

import json
import os
import re
import shutil
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Sequence

import numpy as np
import xarray as xr

from wavetiles.pipeline.adapters.base import NormalizationResult, SourceCycle, WaveModelAdapter
from wavetiles.pipeline.contract import (
    CONTRACT_VERSION,
    DEFAULT_FORECAST_HOURS,
    ContractValidationError,
    build_manifest,
    validate_dataset,
    validate_manifest,
)

CYCLE_RE = re.compile(r"^\d{10}$")
LAT_NAMES = ("lat", "latitude", "Latitude", "LATITUDE", "nav_lat", "y", "YLAT")
LON_NAMES = ("lon", "longitude", "Longitude", "LONGITUDE", "nav_lon", "x", "XLON")
TIME_NAMES = ("time", "Time", "forecast_time", "valid_time")
WAVE_HEIGHT_ALIASES = ("hs", "swh", "significant_wave_height")


class WW3AdapterError(RuntimeError):
    """Raised when WW3 source data cannot be normalized safely."""


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _reference_tag(value: datetime) -> str:
    return _as_utc(value).strftime("%Y%m%d%H")


def _expected_file_name(reference_time: datetime, forecast_hour: int) -> str:
    valid_time = _as_utc(reference_time) + timedelta(hours=forecast_hour)
    return f"ww3_grdo.{valid_time:%Y%m%dT%H}.nc"


def _find_coordinate(dataset: xr.Dataset, candidates: Sequence[str], kind: str) -> xr.DataArray:
    for name in candidates:
        if name in dataset.coords or name in dataset.variables:
            coordinate = dataset[name]
            if coordinate.ndim != 1:
                raise WW3AdapterError(
                    f"WW3 {kind} coordinate {name!r} must be one-dimensional for contract v1."
                )
            return coordinate
    raise WW3AdapterError(f"WW3 source is missing a recognizable {kind} coordinate.")


def _find_wave_height(dataset: xr.Dataset) -> xr.DataArray:
    for name in WAVE_HEIGHT_ALIASES:
        if name in dataset.data_vars:
            return dataset[name]
    available = ", ".join(sorted(dataset.data_vars))
    raise WW3AdapterError(f"WW3 significant wave height variable was not found. Available: {available}")


def _validate_source_time(dataset: xr.Dataset, expected_valid_time: datetime, path: Path) -> None:
    expected = np.datetime64(_as_utc(expected_valid_time).replace(tzinfo=None), "ns")
    for name in TIME_NAMES:
        if name not in dataset.coords and name not in dataset.variables:
            continue
        values = np.asarray(dataset[name].values).reshape(-1)
        if len(values) != 1:
            raise WW3AdapterError(
                f"WW3 source {path.name} must contain exactly one {name} value, got {len(values)}."
            )
        try:
            actual = values.astype("datetime64[ns]")[0]
        except (TypeError, ValueError) as error:
            raise WW3AdapterError(
                f"WW3 source {path.name} contains an unreadable {name} timestamp."
            ) from error
        if actual != expected:
            raise WW3AdapterError(
                f"WW3 source timestamp mismatch for {path.name}: expected {expected}, got {actual}."
            )
        return


def _first_time_slice(variable: xr.DataArray) -> xr.DataArray:
    result = variable
    for dimension in TIME_NAMES:
        if dimension in result.dims:
            if result.sizes[dimension] != 1:
                raise WW3AdapterError(
                    f"WW3 source variable has {result.sizes[dimension]} values on {dimension}; "
                    "one source file must represent one valid time."
                )
            result = result.isel({dimension: 0}, drop=True)
    return result.squeeze(drop=True)


def _wave_height_to_metres(variable: xr.DataArray) -> xr.DataArray:
    units = str(variable.attrs.get("units", "m")).strip().lower()
    if units in {"m", "meter", "meters", "metre", "metres"}:
        converted = variable.astype(np.float32)
    elif units in {"cm", "centimeter", "centimeters", "centimetre", "centimetres"}:
        converted = (variable / 100.0).astype(np.float32)
    else:
        raise WW3AdapterError(f"Unsupported WW3 wave-height units: {units or '<missing>'}")
    converted.attrs = {
        "units": "m",
        "long_name": "significant wave height",
        "standard_name": "sea_surface_wave_significant_height",
    }
    return converted


def _canonicalize_longitudes(values: np.ndarray) -> np.ndarray:
    longitude = np.asarray(values, dtype=np.float64)
    normalized = ((longitude + 180.0) % 360.0) - 180.0
    normalized[np.isclose(normalized, -180.0) & np.isclose(longitude, 180.0)] = 180.0
    return normalized


def _normalize_frame(path: Path, expected_valid_time: datetime) -> xr.DataArray:
    try:
        with xr.open_dataset(path) as dataset:
            _validate_source_time(dataset, expected_valid_time, path)
            latitude = _find_coordinate(dataset, LAT_NAMES, "latitude")
            longitude = _find_coordinate(dataset, LON_NAMES, "longitude")
            variable = _first_time_slice(_find_wave_height(dataset))
            latitude_dimension = latitude.dims[0]
            longitude_dimension = longitude.dims[0]
            extra_dimensions = [
                dimension
                for dimension in variable.dims
                if dimension not in {latitude_dimension, longitude_dimension}
            ]
            if extra_dimensions:
                raise WW3AdapterError(
                    f"WW3 wave-height variable has unsupported dimensions: {extra_dimensions}"
                )
            if latitude_dimension not in variable.dims or longitude_dimension not in variable.dims:
                raise WW3AdapterError(
                    "WW3 wave-height dimensions do not match the latitude/longitude coordinates."
                )
            variable = _wave_height_to_metres(
                variable.transpose(latitude_dimension, longitude_dimension)
            ).load()
            variable = variable.rename(
                {latitude_dimension: "latitude", longitude_dimension: "longitude"}
            )
            variable = variable.assign_coords(
                latitude=("latitude", np.asarray(latitude.values, dtype=np.float64)),
                longitude=("longitude", _canonicalize_longitudes(longitude.values)),
            )
            return variable.sortby("latitude").sortby("longitude")
    except WW3AdapterError:
        raise
    except Exception as error:
        raise WW3AdapterError(f"Unable to read WW3 NetCDF source {path}: {error}") from error


def _assert_same_grid(reference: xr.DataArray, candidate: xr.DataArray, path: Path) -> None:
    if not np.array_equal(reference["latitude"].values, candidate["latitude"].values):
        raise WW3AdapterError(f"WW3 latitude grid changed within one retained cycle: {path}")
    if not np.array_equal(reference["longitude"].values, candidate["longitude"].values):
        raise WW3AdapterError(f"WW3 longitude grid changed within one retained cycle: {path}")


class WW3NetCDFAdapter(WaveModelAdapter):
    """Normalize the retained WW3 NetCDF window into WaveLab contract v1."""

    adapter_id = "ww3-netcdf"
    adapter_version = "1"
    model_code = "WW3"

    def discover_cycle(
        self,
        source_root: Path,
        *,
        reference_time: datetime | None = None,
    ) -> SourceCycle:
        if reference_time is None:
            raise WW3AdapterError(
                "WW3 normalization requires an explicit reference_time so WaveLab T+0 is not "
                "confused with the native source-cycle hour."
            )
        reference_time = _as_utc(reference_time)
        root = Path(source_root)
        candidates = [root] if CYCLE_RE.fullmatch(root.name) else []
        if root.is_dir() and not candidates:
            candidates = sorted(
                (
                    path
                    for path in root.iterdir()
                    if path.is_dir() and CYCLE_RE.fullmatch(path.name)
                ),
                key=lambda path: path.name,
                reverse=True,
            )
        for cycle_dir in candidates:
            files = tuple(
                cycle_dir / _expected_file_name(reference_time, hour)
                for hour in DEFAULT_FORECAST_HOURS
            )
            if all(path.is_file() for path in files):
                return SourceCycle(
                    model=self.model_code,
                    cycle=cycle_dir.name,
                    source_format="netcdf",
                    files=files,
                    reference_time=reference_time,
                )
        expected = _expected_file_name(reference_time, DEFAULT_FORECAST_HOURS[0])
        raise WW3AdapterError(
            f"No complete WW3 source cycle under {root} contains {expected} through T+60."
        )

    def normalize(
        self,
        source_cycle: SourceCycle,
        normalized_root: Path,
        *,
        forecast_hours: Sequence[int] = DEFAULT_FORECAST_HOURS,
    ) -> NormalizationResult:
        hours = tuple(int(value) for value in forecast_hours)
        if hours != DEFAULT_FORECAST_HOURS:
            raise WW3AdapterError(
                f"WW3 adapter v1 currently requires the retained forecast hours {DEFAULT_FORECAST_HOURS}."
            )
        if source_cycle.model.upper() != self.model_code:
            raise WW3AdapterError(f"WW3 adapter cannot normalize model {source_cycle.model!r}.")
        if source_cycle.source_format.lower() != "netcdf":
            raise WW3AdapterError("WW3 adapter v1 requires NetCDF source files.")

        reference_time = _as_utc(source_cycle.reference_time)
        expected_files = tuple(
            path.parent / _expected_file_name(reference_time, hour)
            for path, hour in zip(source_cycle.files, hours)
        )
        if len(source_cycle.files) != len(hours) or tuple(source_cycle.files) != expected_files:
            raise WW3AdapterError(
                "WW3 source file list must exactly match reference_time + T+0..T+60 in 3-hour steps."
            )
        missing = [str(path) for path in source_cycle.files if not path.is_file()]
        if missing:
            raise WW3AdapterError(f"WW3 source files are missing: {', '.join(missing)}")

        frames: list[xr.DataArray] = []
        for path, hour in zip(source_cycle.files, hours):
            expected_valid_time = reference_time + timedelta(hours=hour)
            frame = _normalize_frame(path, expected_valid_time)
            if frames:
                _assert_same_grid(frames[0], frame, path)
            frames.append(frame)

        valid_times = np.asarray(
            [np.datetime64((reference_time + timedelta(hours=hour)).replace(tzinfo=None)) for hour in hours],
            dtype="datetime64[ns]",
        )
        combined = xr.concat(frames, dim="valid_time")
        combined = combined.assign_coords(valid_time=("valid_time", valid_times))
        combined.name = "significant_wave_height"
        combined.attrs.update(
            {
                "units": "m",
                "long_name": "significant wave height",
                "standard_name": "sea_surface_wave_significant_height",
            }
        )
        dataset = combined.to_dataset()
        dataset = dataset.assign_coords(forecast_hour=("valid_time", np.asarray(hours, dtype=np.int16)))
        dataset.attrs = {
            "contract_version": CONTRACT_VERSION,
            "model": self.model_code,
            "source_cycle": source_cycle.cycle,
            "reference_time": reference_time.isoformat().replace("+00:00", "Z"),
            "source_format": source_cycle.source_format,
            "adapter_id": self.adapter_id,
            "adapter_version": self.adapter_version,
        }
        validate_dataset(dataset, expected_forecast_hours=hours)

        manifest = build_manifest(
            model=self.model_code,
            source_cycle=source_cycle.cycle,
            reference_time=reference_time,
            source_format=source_cycle.source_format,
            adapter_id=self.adapter_id,
            adapter_version=self.adapter_version,
            forecast_hours=hours,
            variables=dataset.data_vars,
            source_files=(path.name for path in source_cycle.files),
        )
        validate_manifest(manifest)

        reference_tag = _reference_tag(reference_time)
        model_root = Path(normalized_root) / self.model_code
        target_dir = model_root / reference_tag
        model_root.mkdir(parents=True, exist_ok=True)
        if target_dir.exists():
            existing_manifest = target_dir / "manifest.json"
            existing_dataset = target_dir / "wave.nc"
            if existing_manifest.is_file() and existing_dataset.is_file():
                try:
                    with existing_manifest.open("r", encoding="utf-8") as handle:
                        current = validate_manifest(json.load(handle))
                    if (
                        current["sourceCycle"] == source_cycle.cycle
                        and current["referenceTime"] == manifest["referenceTime"]
                        and current["forecastHours"] == manifest["forecastHours"]
                    ):
                        with xr.open_dataset(existing_dataset) as existing:
                            validate_dataset(existing, expected_forecast_hours=hours)
                        return NormalizationResult(
                            model=self.model_code,
                            source_cycle=source_cycle.cycle,
                            reference_time=reference_time,
                            normalized_dir=target_dir,
                            dataset_path=existing_dataset,
                            manifest_path=existing_manifest,
                            frame_count=len(hours),
                            forecast_hours=hours,
                        )
                except (OSError, json.JSONDecodeError, ContractValidationError):
                    pass
            raise WW3AdapterError(
                f"Normalized target already exists but is not a matching valid cycle: {target_dir}"
            )

        temporary_dir = model_root / f".normalize-{reference_tag}-{uuid.uuid4().hex[:8]}"
        temporary_dir.mkdir(mode=0o755)
        dataset_path = temporary_dir / "wave.nc"
        manifest_path = temporary_dir / "manifest.json"
        try:
            encoding = {
                "significant_wave_height": {
                    "zlib": True,
                    "complevel": 4,
                    "shuffle": True,
                    "dtype": "float32",
                }
            }
            dataset.to_netcdf(dataset_path, engine="netcdf4", format="NETCDF4", encoding=encoding)
            with manifest_path.open("w", encoding="utf-8") as handle:
                json.dump(manifest, handle, indent=2, sort_keys=True)
                handle.write("\n")
            with xr.open_dataset(dataset_path) as written:
                validate_dataset(written, expected_forecast_hours=hours)
            with manifest_path.open("r", encoding="utf-8") as handle:
                validate_manifest(json.load(handle))
            os.replace(temporary_dir, target_dir)
        except Exception:
            shutil.rmtree(temporary_dir, ignore_errors=True)
            raise

        return NormalizationResult(
            model=self.model_code,
            source_cycle=source_cycle.cycle,
            reference_time=reference_time,
            normalized_dir=target_dir,
            dataset_path=target_dir / "wave.nc",
            manifest_path=target_dir / "manifest.json",
            frame_count=len(hours),
            forecast_hours=hours,
        )
