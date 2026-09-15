#!/usr/bin/env python3
"""Validate a staged wave package and replace matching production package directories safely."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import uuid
from pathlib import Path

EXPECTED_CONTOURS = 21
EXPECTED_FORECAST_HOURS = list(range(0, 61, 3))
REQUIRED_METADATA_FIELDS = {
    "packageDate",
    "packageTag",
    "sourceCycle",
    "variable",
    "sigma",
    "requiredForecastHours",
}


def package_dirs(root: Path, tag: str) -> list[Path]:
    result: list[Path] = []
    for child in sorted(root.iterdir() if root.is_dir() else ()):
        if not child.is_dir():
            continue
        candidate = child / tag
        if candidate.is_dir():
            result.append(candidate)
    return result


def validate_metadata(metadata_path: Path, tag: str, expected_source_cycle: str | None) -> dict:
    try:
        with metadata_path.open("r", encoding="utf-8") as handle:
            metadata = json.load(handle)
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Staged package metadata is invalid: {metadata_path}: {exc}") from exc

    if not isinstance(metadata, dict):
        raise SystemExit(f"Staged package metadata must be a JSON object: {metadata_path}")

    missing = sorted(REQUIRED_METADATA_FIELDS - set(metadata))
    if missing:
        raise SystemExit(f"Staged package metadata is missing required fields: {', '.join(missing)}")
    if metadata["packageTag"] != tag:
        raise SystemExit(
            f"Staged package metadata packageTag mismatch: expected {tag}, got {metadata['packageTag']!r}"
        )
    source_cycle = metadata["sourceCycle"]
    if not isinstance(source_cycle, str) or len(source_cycle) != 10 or not source_cycle.isdigit():
        raise SystemExit(f"Staged package metadata has invalid sourceCycle: {source_cycle!r}")
    if expected_source_cycle is not None and source_cycle != expected_source_cycle:
        raise SystemExit(
            "Staged package metadata sourceCycle mismatch: "
            f"expected {expected_source_cycle}, got {source_cycle}"
        )
    if metadata["requiredForecastHours"] != EXPECTED_FORECAST_HOURS:
        raise SystemExit(
            "Staged package metadata requiredForecastHours mismatch: "
            f"expected {EXPECTED_FORECAST_HOURS}, got {metadata['requiredForecastHours']!r}"
        )
    if "frameCount" in metadata and metadata["frameCount"] != EXPECTED_CONTOURS:
        raise SystemExit(
            f"Staged package metadata frameCount mismatch: expected {EXPECTED_CONTOURS}, "
            f"got {metadata['frameCount']!r}"
        )
    return metadata


def validate_stage(
    stage_root: Path,
    tag: str,
    *,
    expected_source_cycle: str | None = None,
) -> tuple[list[Path], int, int]:
    dirs = package_dirs(stage_root, tag)
    if not dirs:
        raise SystemExit(f"No staged package directories found for {tag} under {stage_root}")

    contours = stage_root / "contours" / tag
    if contours not in dirs:
        raise SystemExit(f"Staged contour package is missing: {contours}")

    contour_paths = sorted(
        path
        for path in contours.glob("*/contours.geojson")
        if path.is_file() and path.stat().st_size > 0
    )
    if len(contour_paths) != EXPECTED_CONTOURS:
        raise SystemExit(
            f"Expected {EXPECTED_CONTOURS} staged contour frames for {tag}, got {len(contour_paths)}"
        )

    png_count = 0
    for directory in dirs:
        if directory.parent.name == "contours":
            continue
        png_count += sum(1 for path in directory.rglob("*.png") if path.is_file())
    if png_count <= 0:
        raise SystemExit(f"Staged package {tag} contains no PNG tiles")

    metadata = contours / "package.json"
    if not metadata.is_file() or metadata.stat().st_size <= 0:
        raise SystemExit(f"Staged package metadata is missing or empty: {metadata}")
    validate_metadata(metadata, tag, expected_source_cycle)

    return dirs, png_count, len(contour_paths)


def _copy_to_destination_filesystem(staged: Path, incoming: Path) -> None:
    """Copy a complete staged directory beside its destination before the atomic swap."""
    if incoming.exists():
        shutil.rmtree(incoming)
    try:
        shutil.copytree(staged, incoming, copy_function=shutil.copy2)
    except Exception:
        shutil.rmtree(incoming, ignore_errors=True)
        raise


def publish(
    stage_root: Path,
    production_root: Path,
    tag: str,
    *,
    expected_source_cycle: str | None = None,
) -> None:
    staged_dirs, png_count, contour_count = validate_stage(
        stage_root,
        tag,
        expected_source_cycle=expected_source_cycle,
    )
    production_root.mkdir(parents=True, exist_ok=True)

    token = uuid.uuid4().hex[:8]
    replaced: list[tuple[Path, Path | None]] = []
    incoming_paths: list[Path] = []
    try:
        for staged in staged_dirs:
            category = staged.parent.name
            destination_parent = production_root / category
            destination_parent.mkdir(parents=True, exist_ok=True)
            destination = destination_parent / tag
            incoming = destination_parent / f".{tag}.incoming-{token}"
            backup = destination_parent / f".{tag}.backup-{token}" if destination.exists() else None
            incoming_paths.append(incoming)

            _copy_to_destination_filesystem(staged, incoming)

            if backup is not None:
                if backup.exists():
                    shutil.rmtree(backup)
                os.replace(destination, backup)
            try:
                os.replace(incoming, destination)
            except Exception:
                if backup is not None and backup.exists() and not destination.exists():
                    os.replace(backup, destination)
                raise
            replaced.append((destination, backup))

        for _, backup in replaced:
            if backup is not None and backup.exists():
                shutil.rmtree(backup)
    except Exception:
        for incoming in incoming_paths:
            shutil.rmtree(incoming, ignore_errors=True)
        for destination, backup in reversed(replaced):
            if destination.exists():
                shutil.rmtree(destination)
            if backup is not None and backup.exists():
                os.replace(backup, destination)
        raise
    finally:
        for incoming in incoming_paths:
            shutil.rmtree(incoming, ignore_errors=True)

    print(f"Published package {tag}")
    print(f"  PNG files: {png_count}")
    print(f"  Contour files: {contour_count}")
    print(f"  Production root: {production_root}")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("stage_root", type=Path)
    parser.add_argument("production_root", type=Path)
    parser.add_argument("package_tag")
    parser.add_argument("--source-cycle")
    args = parser.parse_args()

    stage_root = args.stage_root.resolve()
    production_root = args.production_root.resolve()
    if stage_root == production_root:
        raise SystemExit("Stage and production roots must differ")
    if production_root in stage_root.parents or stage_root in production_root.parents:
        raise SystemExit("Stage and production roots must be isolated from each other")

    publish(
        stage_root,
        production_root,
        args.package_tag,
        expected_source_cycle=args.source_cycle,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
