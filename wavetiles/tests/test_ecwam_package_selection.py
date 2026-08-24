from __future__ import annotations

import importlib.util
import tempfile
import unittest
from datetime import datetime
from pathlib import Path

MODULE_PATH = Path(__file__).resolve().parents[1] / "scripts" / "ecwam_package_selection.py"
SPEC = importlib.util.spec_from_file_location("ecwam_package_selection", MODULE_PATH)
assert SPEC and SPEC.loader
selection = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(selection)


class ECWAMPackageSelectionTests(unittest.TestCase):
    package_date = selection.parse_package_date("2026-08-24")

    def make_cycle(self, root: Path, cycle: str, valid_times: tuple[datetime, ...]) -> Path:
        cycle_dir = root / cycle
        cycle_dir.mkdir()
        cycle_time = datetime.strptime(cycle, "%Y%m%d%H")
        prefix = f"W1P{cycle_time:%m%d}{cycle_time:%H}00"
        for index, valid in enumerate(valid_times):
            suffix = "011" if index == 0 and valid == cycle_time else "001"
            (cycle_dir / f"{prefix}{valid:%m%d%H}{suffix}").touch()
        return cycle_dir

    def test_required_valid_times_match_operational_package(self) -> None:
        self.assertEqual(
            tuple(value.strftime("%Y%m%d%H") for value in selection.required_valid_times(self.package_date)),
            ("2026082400", "2026082500", "2026082512", "2026082600"),
        )

    def test_newest_complete_cycle_selected(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026082300", required)
            self.make_cycle(root, "2026082400", required)
            selected = selection.select_source_cycle(root, self.package_date)
            self.assertIsNotNone(selected)
            self.assertEqual(selected.name, "2026082400")

    def test_incomplete_newest_cycle_falls_back(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026082300", required)
            self.make_cycle(root, "2026082400", required[:-1])
            selected = selection.select_source_cycle(root, self.package_date)
            self.assertIsNotNone(selected)
            self.assertEqual(selected.name, "2026082300")

    def test_idx_files_are_ignored(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cycle = self.make_cycle(root, "2026082400", required)
            first = next(path for path in cycle.iterdir() if path.is_file())
            (cycle / f"{first.name}.47d85.idx").touch()
            available = selection.files_by_valid_time(cycle)
            self.assertEqual(len(available), 4)

    def test_year_rollover_uses_year_nearest_cycle(self) -> None:
        package_date = selection.parse_package_date("2026-12-31")
        required = selection.required_valid_times(package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cycle = self.make_cycle(root, "2026123100", required)
            available = selection.files_by_valid_time(cycle)
            self.assertIn(datetime(2027, 1, 2, 0), available)
            self.assertTrue(selection.cycle_is_complete(cycle, package_date))


if __name__ == "__main__":
    unittest.main()
