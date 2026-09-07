from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Sequence


@dataclass(frozen=True)
class SourceCycle:
    model: str
    cycle: str
    source_format: str
    files: tuple[Path, ...]


@dataclass(frozen=True)
class NormalizationResult:
    model: str
    source_cycle: str
    normalized_dir: Path
    dataset_path: Path
    manifest_path: Path
    frame_count: int
    forecast_hours: tuple[int, ...]


class WaveModelAdapter(ABC):
    """Model-specific boundary for producing the WaveLab normalized contract."""

    adapter_id: str
    adapter_version: str
    model_code: str

    @abstractmethod
    def discover_cycle(self, source_root: Path) -> SourceCycle:
        """Return the source cycle selected for normalization."""

    @abstractmethod
    def normalize(
        self,
        source_cycle: SourceCycle,
        normalized_root: Path,
        *,
        forecast_hours: Sequence[int],
    ) -> NormalizationResult:
        """Produce one normalized WaveLab dataset and manifest for a source cycle."""
