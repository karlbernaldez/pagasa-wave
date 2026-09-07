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
ECWAM_FILE_RE = re.compile(
    r"^W1P(?P<cycle_mmdd>\d{4})(?P<cycle_hhmm>\d{4})(?P<valid_mmddhh>\d{6})(?P<suffix>\d{3})$"
)
DEFAULT_GRID_POINTS = 271051
WAVE_HEIGHT_ALIASES = ("swh", "hs", "significant_wave_height")


class ECWAMAdapterError(RuntimeError):
    """Raised when ECWAM source data cannot be normalized safely."""


def _as_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def _reference_tag(value: datetime) -> str:
    return _as_utc(value).strftime("%Y%m%d%H")


def _valid_time_from_name(path: Path, cycle_time: datetime) -> datetime | None:
    match = ECWAM_FILE_RE.fullmatch(path.name)
    if not match:
        return None
    if match.group("cycle_mmdd") != cycle_time.strftime("%m%d"):
        return None
    if match.group("cycle_hhmm") != cycle_time.strftime("%H") + "00":
        return None

    raw = match.group("valid_mmddhh")
    month, day, hour = int(raw[:2]), int(raw[2:4]), int(raw[4:])
    candidates: list[datetime] = []
    for year in (cycle_time.year - 1, cycle_time.year, cycle_time.year + 1):
        try:
            candidates.append(datetime(year, month, day, hour, tzinfo=timezone.utc))
        except ValueError:
            continue
    if not candidates:
        return None
    cycle_utc = _as_utc(cycle_time)
    return min(candidates, key=lambda value: abs(value - cycle_utc))


def _files_by_valid_time(cycle_dir: Path) -> dict[datetime, Path]:
    if not cycle_dir.is_dir() or not CYCLE_RE.fullmatch(cycle_dir.name):
        return {}
    cycle_time = datetime.strptime(cycle_dir.name, "%Y%m%d%H").replace(tzinfo=timezone.utc)
    result: dict[datetime, Path] = {}
    for path in cycle_dir.iterdir():
        if not path.is_file() or ".idx" in path.name:
            continue
        valid = _valid_time_from_name(path, cycle_time)
        if valid is None:
            continue
        previous = result.get(valid)
        if previous is None or (not previous.name.endswith("001") and path.name.endswith("001")):
            result[valid] = path
    return result


def _open_ecwam_dataset(path: Path, grid_points: int) -> xr.Dataset:
    return xr.open_dataset(
        path,
        engine="cfgrib",
        backend_kwargs={
            "indexpath": "",
            "filter_by_keys": {"numberOfPoints": grid_points},
        },
    )


def _find_wave_height(dataset: xr.Dataset) -> xr.DataArray:
    for name in WAVE_HEIGHT_ALIASES:
        if name in dataset.data_vars:
            return dataset[name]
    available = ", ".join(sorted(dataset.data_vars))
    raise ECWAMAdapterError(
        f"ECWAM significant wave height variable was not found. Available: {available}"
    )


def _wave_height_to_metres(variable: xr.DataArray) -> xr.DataArray:
    units = str(variable.attrs.get("units", "")).strip().lower()
    if units in {"m", "meter", "meters", "metre", "metres"}:
        converted = variable.astype(np.float32)
    elif units in {"cm", "centimeter", "centimeters", "centimetre", "centimetres"}:
        converted = (variable / 100.0).astype(np.float32)
    else:
        raise ECWAMAdapterError(f"Unsupported or missing ECWAM wave-height units: {units or '<missing>'}")
    converted.attrs = {
        "units": "m",
        "long_name": "significant wave height",
        "standard_name": "sea_surface_wave_significant_height",
    }
    return converted


def _source_valid_time(dataset: xr.Dataset) -> np.datetime64 | None:
    if "valid_time" in dataset.coords or "valid_time" in dataset.variables:
        values = np.asarray(dataset["valid_time"].values).reshape(-1)
        if len(values) != 1:
            raise ECWAMAdapterError("ECWAM GRIB frame must expose exactly one valid_time value.")
        return values.astype("datetime64[ns]")[0]

    if "time" in dataset.coords or "time" in dataset.variables:
        time_values = np.asarray(dataset["time"].values).reshape(-1)
        if len(time_values) != 1:
            raise ECWAMAdapterError("ECWAM GRIB frame must expose exactly one time value.")
        base = time_values.astype("datetime64[ns]")[0]
        if "step" in dataset.coords or "step" in dataset.variables:
            step_values = np.asarray(dataset["step"].values).reshape(-1)
            if len(step_values) != 1:
                raise ECWAMAdapterError("ECWAM GRIB frame must expose exactly one step value.")
            return base + step_values.astype("timedelta64[ns]")[0]
        return base
    return None


def _normalize_frame(path: Path, expected_valid_time: datetime, grid_points: int) -> xr.DataArray:
    try:
        with _open_ecwam_dataset(path, grid_points) as dataset:
            if "latitude" not in dataset.coords or "longitude" not in dataset.coords:
                raise ECWAMAdapterError("ECWAM dataset is missing latitude/longitude coordinates.")
            latitude = dataset["latitude"]
            longitude = dataset["longitude"]
            if latitude.ndim != 1 or longitude.ndim != 1:
                raise ECWAMAdapterError(
                    "ECWAM contract v1 requires one-dimensional latitude/longitude coordinates."
                )

            actual_valid = _source_valid_time(dataset)
            if actual_valid is not None:
                expected = np.datetime64(_as_utc(expected_valid_time).replace(tzinfo=None), "ns")
                if actual_valid != expected:
                    raise ECWAMAdapterError(
                        f"ECWAM source timestamp mismatch for {path.name}: expected {expected}, got {actual_valid}."
                    )

            variable = _find_wave_height(dataset).squeeze(drop=True)
            lat_dim = latitude.dims[0]
            lon_dim = longitude.dims[0]
            extra = [dimension for dimension in variable.dims if dimension not in {lat_dim, lon_dim}]
            if extra:
                raise ECWAMAdapterError(f"ECWAM wave-height variable has unsupported dimensions: {extra}")
            if lat_dim not in variable.dims or lon_dim not in variable.dims:
                raise ECWAMAdapterError(
                    "ECWAM wave-height dimensions do not match latitude/longitude coordinates."
                )

            variable = _wave_height_to_metres(variable.transpose(lat_dim, lon_dim)).load()
            longitude_values = np.asarray(longitude.values, dtype=np.float64)
            longitude_values = np.where(longitude_values > 180.0, longitude_values - 360.0, longitude_values)
            variable = variable.rename({lat_dim: "latitude", lon_dim: "longitude"})
            variable = variable.assign_coords(
                latitude=("latitude", np.asarray(latitude.values, dtype=np.float64)),
                longitude=("longitude", longitude_values),
            )
            variable = variable.sortby("latitude").sortby("longitude")
            if variable.sizes["latitude"] * variable.sizes["longitude"] != grid_points:
                raise ECWAMAdapterError(
                    f"ECWAM grid has {variable.sizes['latitude'] * variable.sizes['longitude']} points; "
                    f"expected {grid_points}."
                )
            return variable
    except ECWAMAdapterError:
        raise
    except Exception as error:
        raise ECWAMAdapterError(f"Unable to read ECWAM GRIB source {path}: {error}") from error


def _assert_same_grid(reference: xr.DataArray, candidate: xr.DataArray, path: Path) -> None:
    if not np.array_equal(reference["latitude"].values, candidate["latitude"].values):
        raise ECWAMAdapterError(f"ECWAM latitude grid changed within one retained cycle: {path}")
    if not np.array_equal(reference["longitude"].values, candidate["longitude"].values):
        raise ECWAMAdapterError(f"ECWAM longitude grid changed within one retained cycle: {path}")


class ECWAMGRIBAdapter(WaveModelAdapter):
    """Normalize the required previous-day 18Z ECWAM GRIB1 cycle into contract v1."""

    adapter_id = "ecwam-grib1"
    adapter_version = "1"
    model_code = "ECWAM"

    def __init__(self, *, grid_points: int = DEFAULT_GRID_POINTS) -> None:
        if int(grid_points) <= 0:
            raise ECWAMAdapterError("grid_points must be positive.")
        self.grid_points = int(grid_points)

    def discover_cycle(
        self,
        source_root: Path,
        *,
        reference_time: datetime | None = None,
    ) -> SourceCycle:
        if reference_time is None:
            raise ECWAMAdapterError("ECWAM normalization requires an explicit reference_time.")
        reference_time = _as_utc(reference_time)
        if reference_time.minute != 0 or reference_time.second != 0 or reference_time.hour != 18:
            raise ECWAMAdapterError("ECWAM normalization requires an 18Z reference_time/source cycle.")

        required_cycle = _reference_tag(reference_time)
        root = Path(source_root)
        cycle_dir = root if CYCLE_RE.fullmatch(root.name) else root / required_cycle
        if cycle_dir.name != required_cycle:
            raise ECWAMAdapterError(
                f"ECWAM source cycle must exactly match the 18Z reference time {required_cycle}; got {cycle_dir.name}."
            )

        available = _files_by_valid_time(cycle_dir)
        expected_times = tuple(reference_time + timedelta(hours=hour) for hour in DEFAULT_FORECAST_HOURS)
        files = tuple(available.get(valid) for valid in expected_times)
        if not cycle_dir.is_dir() or any(path is None for path in files):
            raise ECWAMAdapterError(
                f"No complete ECWAM 18Z source cycle {required_cycle} under {root} contains T+0 through T+60."
            )

        return SourceCycle(
            model=self.model_code,
            cycle=required_cycle,
            source_format="grib1",
            files=tuple(path for path in files if path is not None),
            reference_time=reference_time,
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
            raise ECWAMAdapterError(
                f"ECWAM adapter v1 currently requires the retained forecast hours {DEFAULT_FORECAST_HOURS}."
            )
        if source_cycle.model.upper() != self.model_code:
            raise ECWAMAdapterError(f"ECWAM adapter cannot normalize model {source_cycle.model!r}.")
        if source_cycle.source_format.lower() not in {"grib", "grib1"}:
            raise ECWAMAdapterError("ECWAM adapter v1 requires GRIB1 source files.")

        reference_time = _as_utc(source_cycle.reference_time)
        reference_tag = _reference_tag(reference_time)
        if reference_time.hour != 18 or source_cycle.cycle != reference_tag:
            raise ECWAMAdapterError("ECWAM sourceCycle must equal the 18Z reference_time.")
        if len(source_cycle.files) != len(hours):
            raise ECWAMAdapterError("ECWAM source file list must contain exactly 21 retained frames.")
        missing = [str(path) for path in source_cycle.files if not path.is_file()]
        if missing:
            raise ECWAMAdapterError(f"ECWAM source files are missing: {', '.join(missing)}")

        for path, hour in zip(source_cycle.files, hours):
            valid = _valid_time_from_name(path, reference_time)
            expected = reference_time + timedelta(hours=hour)
            if valid != expected:
                raise ECWAMAdapterError(
                    f"ECWAM source file {path.name} does not match T+{hour}: expected {expected}."
                )

        frames: list[xr.DataArray] = []
        for path, hour in zip(source_cycle.files, hours):
            frame = _normalize_frame(path, reference_time + timedelta(hours=hour), self.grid_points)
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
            "source_format": "grib1",
            "adapter_id": self.adapter_id,
            "adapter_version": self.adapter_version,
            "source_grid_points": self.grid_points,
        }
        validate_dataset(dataset, expected_forecast_hours=hours)

        manifest = build_manifest(
            model=self.model_code,
            source_cycle=source_cycle.cycle,
            reference_time=reference_time,
            source_format="grib1",
            adapter_id=self.adapter_id,
            adapter_version=self.adapter_version,
            forecast_hours=hours,
            variables=dataset.data_vars,
            source_files=(path.name for path in source_cycle.files),
        )
        validate_manifest(manifest)

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
            raise ECWAMAdapterError(
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
