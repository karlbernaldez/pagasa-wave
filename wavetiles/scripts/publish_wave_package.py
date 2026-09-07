#!/usr/bin/env python3
"""Validate a staged wave package and replace matching production package directories safely."""

from __future__ import annotations

import argparse
import os
import shutil
import uuid
from pathlib import Path

EXPECTED_CONTOURS = 21


def package_dirs(root: Path, tag: str) -> list[Path]:
    result: list[Path] = []
    for child in sorted(root.iterdir() if root.is_dir() else ()):
        if not child.is_dir():
            continue
        candidate = child / tag
        if candidate.is_dir():
            result.append(candidate)
    return result


def validate_stage(stage_root: Path, tag: str) -> tuple[list[Path], int, int]:
    dirs = package_dirs(stage_root, tag)
    if not dirs:
        raise SystemExit(f"No staged package directories found for {tag} under {stage_root}")

    contours = stage_root / "contours" / tag
    if contours not in dirs:
        raise SystemExit(f"Staged contour package is missing: {contours}")

    contour_count = len(
        [
            path
            for path in contours.glob("*/contours.geojson")
            if path.is_file() and path.stat().st_size > 0
        ]
    )
    if contour_count != EXPECTED_CONTOURS:
        raise SystemExit(
            f"Expected {EXPECTED_CONTOURS} staged contour frames for {tag}, got {contour_count}"
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

    return dirs, png_count, contour_count


def _copy_to_destination_filesystem(staged: Path, incoming: Path) -> None:
    """Copy a complete staged directory beside its destination before the atomic swap."""
    if incoming.exists():
        shutil.rmtree(incoming)
    try:
        shutil.copytree(staged, incoming, copy_function=shutil.copy2)
    except Exception:
        shutil.rmtree(incoming, ignore_errors=True)
        raise


def publish(stage_root: Path, production_root: Path, tag: str) -> None:
    staged_dirs, png_count, contour_count = validate_stage(stage_root, tag)
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

            # The shadow/stage tree may live on a different filesystem. Copy first
            # so the final rename is always local to the destination filesystem.
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
    args = parser.parse_args()

    stage_root = args.stage_root.resolve()
    production_root = args.production_root.resolve()
    if stage_root == production_root:
        raise SystemExit("Stage and production roots must differ")
    if production_root in stage_root.parents or stage_root in production_root.parents:
        raise SystemExit("Stage and production roots must be isolated from each other")

    publish(stage_root, production_root, args.package_tag)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
