from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

import xarray as xr

CONTRACT_VERSION = "wavelab-wave-v1"
DEFAULT_FORECAST_HOURS = tuple(range(0, 61, 3))
CANONICAL_COORDINATES = ("valid_time", "latitude", "longitude")


class ContractValidationError(ValueError):
    """Raised when a normalized WaveLab dataset violates the v1 contract."""


@dataclass(frozen=True)
class CanonicalVariable:
    name: str
    units: str
    dimensions: tuple[str, ...] = CANONICAL_COORDINATES
    direction_convention: str | None = None


CANONICAL_VARIABLES = {
    "significant_wave_height": CanonicalVariable(
        name="significant_wave_height",
        units="m",
    ),
    "mean_wave_direction": CanonicalVariable(
        name="mean_wave_direction",
        units="degree",
        direction_convention="from_north_clockwise",
    ),
}


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def normalize_model_code(value: str) -> str:
    code = str(value or "").strip().upper()
    if not code or not code.replace("_", "").replace("-", "").isalnum():
        raise ContractValidationError("model must be a non-empty alphanumeric code.")
    return code


def normalize_cycle(value: str) -> str:
    cycle = str(value or "").strip()
    try:
        datetime.strptime(cycle, "%Y%m%d%H")
    except ValueError as error:
        raise ContractValidationError("sourceCycle must use YYYYMMDDHH format.") from error
    return cycle


def normalize_forecast_hours(values: Iterable[Any]) -> list[int]:
    try:
        hours = [int(value) for value in values]
    except (TypeError, ValueError) as error:
        raise ContractValidationError("forecastHours must contain integers.") from error
    if not hours or hours != sorted(set(hours)):
        raise ContractValidationError("forecastHours must be non-empty, unique, and ascending.")
    if any(hour < 0 for hour in hours):
        raise ContractValidationError("forecastHours cannot contain negative values.")
    return hours


def build_manifest(
    *,
    model: str,
    source_cycle: str,
    source_format: str,
    adapter_id: str,
    adapter_version: str,
    forecast_hours: Iterable[int],
    variables: Iterable[str],
    source_files: Iterable[str] = (),
) -> dict[str, Any]:
    hours = normalize_forecast_hours(forecast_hours)
    variable_names = sorted(set(str(value).strip() for value in variables if str(value).strip()))
    if not variable_names:
        raise ContractValidationError("variables must contain at least one canonical variable.")
    unknown = [name for name in variable_names if name not in CANONICAL_VARIABLES]
    if unknown:
        raise ContractValidationError(f"Unsupported canonical variables: {', '.join(unknown)}")

    return {
        "contractVersion": CONTRACT_VERSION,
        "model": normalize_model_code(model),
        "sourceCycle": normalize_cycle(source_cycle),
        "sourceFormat": str(source_format or "").strip().lower(),
        "adapter": {
            "id": str(adapter_id or "").strip(),
            "version": str(adapter_version or "").strip(),
        },
        "forecastHours": hours,
        "frameCount": len(hours),
        "variables": variable_names,
        "sourceFiles": sorted(set(str(value) for value in source_files if str(value))),
        "normalizedAt": utc_now_iso(),
    }


def validate_manifest(manifest: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(manifest, dict):
        raise ContractValidationError("manifest must be an object.")
    if manifest.get("contractVersion") != CONTRACT_VERSION:
        raise ContractValidationError(f"contractVersion must be {CONTRACT_VERSION}.")

    normalized = build_manifest(
        model=manifest.get("model", ""),
        source_cycle=manifest.get("sourceCycle", ""),
        source_format=manifest.get("sourceFormat", ""),
        adapter_id=(manifest.get("adapter") or {}).get("id", ""),
        adapter_version=(manifest.get("adapter") or {}).get("version", ""),
        forecast_hours=manifest.get("forecastHours") or [],
        variables=manifest.get("variables") or [],
        source_files=manifest.get("sourceFiles") or [],
    )
    if not normalized["sourceFormat"]:
        raise ContractValidationError("sourceFormat is required.")
    if not normalized["adapter"]["id"] or not normalized["adapter"]["version"]:
        raise ContractValidationError("adapter.id and adapter.version are required.")
    if manifest.get("frameCount") != normalized["frameCount"]:
        raise ContractValidationError("frameCount must match forecastHours length.")
    return normalized


def validate_dataset(
    dataset: xr.Dataset,
    *,
    expected_forecast_hours: Iterable[int] | None = None,
    required_variables: Iterable[str] = ("significant_wave_height",),
) -> None:
    if not isinstance(dataset, xr.Dataset):
        raise ContractValidationError("normalized data must be an xarray Dataset.")

    for coordinate in CANONICAL_COORDINATES:
        if coordinate not in dataset.coords:
            raise ContractValidationError(f"Missing canonical coordinate: {coordinate}")

    if dataset.sizes.get("valid_time", 0) <= 0:
        raise ContractValidationError("valid_time must contain at least one frame.")

    if expected_forecast_hours is not None:
        expected = normalize_forecast_hours(expected_forecast_hours)
        actual = [int(value) for value in dataset["forecast_hour"].values.tolist()] if "forecast_hour" in dataset.coords else []
        if actual != expected:
            raise ContractValidationError(
                f"forecast_hour axis does not match expected hours: expected {expected}, got {actual}."
            )

    for variable_name in required_variables:
        definition = CANONICAL_VARIABLES.get(variable_name)
        if definition is None:
            raise ContractValidationError(f"Unknown required canonical variable: {variable_name}")
        if variable_name not in dataset.data_vars:
            raise ContractValidationError(f"Missing canonical variable: {variable_name}")
        variable = dataset[variable_name]
        if tuple(variable.dims) != definition.dimensions:
            raise ContractValidationError(
                f"{variable_name} dimensions must be {definition.dimensions}, got {tuple(variable.dims)}."
            )
        if str(variable.attrs.get("units", "")).strip() != definition.units:
            raise ContractValidationError(
                f"{variable_name} units must be {definition.units}."
            )
        if variable.size == 0 or bool(variable.isnull().all().item()):
            raise ContractValidationError(f"{variable_name} cannot be empty or entirely missing.")


def validate_normalized_cycle(
    cycle_dir: str | Path,
    *,
    expected_forecast_hours: Iterable[int] = DEFAULT_FORECAST_HOURS,
) -> tuple[Path, Path]:
    root = Path(cycle_dir)
    dataset_path = root / "wave.nc"
    manifest_path = root / "manifest.json"
    if not dataset_path.is_file():
        raise ContractValidationError(f"Missing normalized dataset: {dataset_path}")
    if not manifest_path.is_file():
        raise ContractValidationError(f"Missing normalized manifest: {manifest_path}")
    with xr.open_dataset(dataset_path) as dataset:
        validate_dataset(dataset, expected_forecast_hours=expected_forecast_hours)
    return dataset_path, manifest_path
