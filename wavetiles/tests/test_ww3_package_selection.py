from __future__ import annotations

import importlib.util
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "ww3_package_selection.py"
SPEC = importlib.util.spec_from_file_location("ww3_package_selection", MODULE_PATH)
assert SPEC and SPEC.loader
selection = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(selection)


class WW3PackageSelectionTests(unittest.TestCase):
    package_date = selection.parse_package_date("2026-07-16")

    def make_cycle(self, root: Path, cycle: str, stamps: tuple[str, ...]) -> Path:
        cycle_dir = root / cycle
        cycle_dir.mkdir()
        for stamp in stamps:
            (cycle_dir / f"ww3_grdo.{stamp[:8]}T{stamp[8:]}.nc").touch()
        return cycle_dir

    def test_newest_complete_cycle_selected(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required)
            self.make_cycle(root, "2026071518", required)
            selected = selection.select_source_cycle(root, self.package_date)
            self.assertIsNotNone(selected)
            self.assertEqual(selected.name, "2026071518")

    def test_incomplete_newest_cycle_falls_back_to_older_complete_cycle(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required)
            self.make_cycle(root, "2026071518", required[:-1])
            selected = selection.select_source_cycle(root, self.package_date)
            self.assertIsNotNone(selected)
            self.assertEqual(selected.name, "2026071512")

    def test_no_complete_cycle_skips_build(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required[:2])
            self.make_cycle(root, "2026071518", required[2:])
            self.assertIsNone(selection.select_source_cycle(root, self.package_date))

    def test_exact_valid_times_are_required(self) -> None:
        required = list(selection.required_valid_times(self.package_date))
        required[-1] = "2026071800"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cycle = self.make_cycle(root, "2026071518", tuple(required))
            self.assertFalse(selection.cycle_is_complete(cycle, self.package_date))
            self.assertIsNone(selection.select_source_cycle(root, self.package_date))

    def test_manila_date_does_not_advance_to_future_package(self) -> None:
        now_utc = datetime(2026, 7, 16, 1, 0, tzinfo=timezone.utc)
        self.assertEqual(selection.manila_today(now_utc).isoformat(), "2026-07-16")
        self.assertNotEqual(selection.manila_today(now_utc).isoformat(), "2026-07-17")


if __name__ == "__main__":
    unittest.main()
