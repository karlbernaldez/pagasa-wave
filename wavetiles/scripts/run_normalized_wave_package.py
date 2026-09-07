#!/usr/bin/env python3
"""Run normalized WaveLab product generation through one shared lifecycle."""

from __future__ import annotations

import argparse
import os
import shutil
import subprocess
import sys
import uuid
from dataclasses import dataclass
from datetime import date, datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPTS_DIR = ROOT / "wavetiles" / "scripts"
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

from wavetiles.pipeline.reader import NormalizedCycleReader
from publish_wave_package import publish

MONTHS = ("JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC")
SUPPORTED_MODELS = ("WW3", "ECWAM")


@dataclass(frozen=True)
class RunnerConfig:
    model: str
    cycle_dir: Path
    package_date: date
    output_root: Path
    source_cycle: str
    sigma: float
    workers: int
    grid_points: int | None = None
    stage_parent: Path = ROOT / "wavetiles" / ".normalized-product-stage"
    builder_args: tuple[str, ...] = ()


def parse_package_date(value: str) -> date:
    for pattern in ("%Y-%m-%d", "%Y%m%d"):
        try:
            return datetime.strptime(value.strip(), pattern).date()
        except ValueError:
            continue
    raise argparse.ArgumentTypeError("package date must be YYYY-MM-DD or YYYYMMDD")


def package_tag(value: date) -> str:
    return f"{value.year}{MONTHS[value.month - 1]}{value.day:02d}"


def normalized_builder(model: str) -> Path:
    if model == "WW3":
        return SCRIPTS_DIR / "build_normalized_ww3_shadow.py"
    if model == "ECWAM":
        return SCRIPTS_DIR / "build_normalized_ecwam_shadow.py"
    raise ValueError(f"unsupported normalized model: {model}")


def builder_command(config: RunnerConfig, stage_root: Path, python_bin: Path) -> list[str]:
    command = [
        str(python_bin),
        str(normalized_builder(config.model)),
        str(config.cycle_dir),
        config.package_date.isoformat(),
        "--output-root",
        str(stage_root),
        "--sigma",
        str(config.sigma),
        "--workers",
        str(config.workers),
    ]
    if config.model == "ECWAM":
        if config.grid_points is None or config.grid_points <= 0:
            raise ValueError("ECWAM normalized runner requires positive grid_points")
        command.extend(("--grid-points", str(config.grid_points)))
    command.extend(config.builder_args)
    return command


def validate_config(config: RunnerConfig) -> NormalizedCycleReader:
    if config.model not in SUPPORTED_MODELS:
        raise ValueError(f"model must be one of {', '.join(SUPPORTED_MODELS)}")
    if config.sigma < 0:
        raise ValueError("sigma must be non-negative")
    if config.workers <= 0:
        raise ValueError("workers must be positive")
    if not config.cycle_dir.is_dir():
        raise ValueError(f"normalized cycle directory is missing: {config.cycle_dir}")
    if config.output_root.resolve() == config.stage_parent.resolve():
        raise ValueError("production output root and normalized stage parent must differ")

    reader = NormalizedCycleReader(config.cycle_dir)
    if reader.model != config.model:
        raise ValueError(
            f"normalized cycle model mismatch: expected {config.model}, got {reader.model}"
        )
    if reader.source_cycle != config.source_cycle:
        raise ValueError(
            "normalized cycle source mismatch: "
            f"expected {config.source_cycle}, got {reader.source_cycle}"
        )
    return reader


def run_pipeline(config: RunnerConfig, python_bin: Path) -> None:
    validate_config(config)
    tag = package_tag(config.package_date)
    config.stage_parent.mkdir(parents=True, exist_ok=True)
    stage_root = config.stage_parent / (
        f"{config.model}-{tag}-{os.getpid()}-{uuid.uuid4().hex[:8]}"
    )
    stage_root.mkdir(mode=0o755)

    print(
        f"WaveLab normalized runner: model={config.model} package={config.package_date.isoformat()} "
        f"source={config.source_cycle}",
        flush=True,
    )
    print(f"  Stage root: {stage_root}", flush=True)

    try:
        command = builder_command(config, stage_root, python_bin)
        completed = subprocess.run(command, check=False)
        if completed.returncode != 0:
            raise RuntimeError(
                f"{config.model} normalized product builder exited with status {completed.returncode}"
            )

        publish(
            stage_root,
            config.output_root,
            tag,
            expected_source_cycle=config.source_cycle,
        )
        print(
            f"WaveLab normalized runner completed: model={config.model} package={tag}",
            flush=True,
        )
    finally:
        shutil.rmtree(stage_root, ignore_errors=True)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Build, validate, publish, and clean up one normalized WaveLab package."
    )
    parser.add_argument("model", choices=SUPPORTED_MODELS)
    parser.add_argument("cycle_dir", type=Path)
    parser.add_argument("package_date", type=parse_package_date)
    parser.add_argument("--output-root", type=Path, required=True)
    parser.add_argument("--source-cycle", required=True)
    parser.add_argument("--sigma", type=float, default=1.5)
    parser.add_argument("--workers", type=int, default=4)
    parser.add_argument("--grid-points", type=int)
    parser.add_argument(
        "--stage-parent",
        type=Path,
        default=ROOT / "wavetiles" / ".normalized-product-stage",
    )
    parser.add_argument("builder_args", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    builder_args = tuple(args.builder_args)
    if builder_args and builder_args[0] == "--":
        builder_args = builder_args[1:]

    config = RunnerConfig(
        model=args.model,
        cycle_dir=args.cycle_dir.resolve(),
        package_date=args.package_date,
        output_root=args.output_root.resolve(),
        source_cycle=args.source_cycle,
        sigma=args.sigma,
        workers=args.workers,
        grid_points=args.grid_points,
        stage_parent=args.stage_parent.resolve(),
        builder_args=builder_args,
    )

    try:
        run_pipeline(config, Path(sys.executable))
    except (OSError, RuntimeError, ValueError) as exc:
        print(f"Normalized WaveLab runner failed: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
