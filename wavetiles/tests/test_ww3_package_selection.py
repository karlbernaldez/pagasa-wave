from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
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

    def test_required_source_cycle_is_previous_day_18z(self) -> None:
        self.assertEqual(selection.required_source_cycle(self.package_date), "2026071518")

    def test_configured_source_cycle_changes_required_cycle_and_valid_times(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            policy_path = Path(tmp) / "source-cycle-policy.json"
            policy_path.write_text(
                json.dumps(
                    {
                        "schemaVersion": 1,
                        "models": {"WW3": {"preferredHourUtc": 12}},
                    }
                ),
                encoding="utf-8",
            )
            previous = os.environ.get("WAVE_SOURCE_CYCLE_POLICY_PATH")
            os.environ["WAVE_SOURCE_CYCLE_POLICY_PATH"] = str(policy_path)
            try:
                self.assertEqual(selection.required_source_cycle(self.package_date), "2026071512")
                required = selection.required_valid_times(self.package_date)
                self.assertEqual(required[0], "2026071512")
                self.assertEqual(required[-1], "2026071800")
            finally:
                if previous is None:
                    os.environ.pop("WAVE_SOURCE_CYCLE_POLICY_PATH", None)
                else:
                    os.environ["WAVE_SOURCE_CYCLE_POLICY_PATH"] = previous

    def test_required_valid_times_cover_three_hour_frames_through_t60(self) -> None:
        required = selection.required_valid_times(self.package_date)

        self.assertEqual(len(required), 21)
        self.assertEqual(required[0], "2026071518")
        self.assertEqual(required[8], "2026071618")
        self.assertEqual(required[12], "2026071706")
        self.assertEqual(required[16], "2026071718")
        self.assertEqual(required[-1], "2026071806")
        self.assertTrue(
            all(
                datetime.strptime(later, "%Y%m%d%H")
                - datetime.strptime(earlier, "%Y%m%d%H")
                == timedelta(hours=3)
                for earlier, later in zip(required, required[1:])
            )
        )

    def test_selects_only_complete_required_18z_cycle(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required)
            self.make_cycle(root, "2026071518", required)
            selected = selection.select_source_cycle(root, self.package_date)
            self.assertIsNotNone(selected)
            self.assertEqual(selected.name, "2026071518")

    def test_does_not_fall_back_to_complete_12z_when_18z_is_incomplete(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required)
            self.make_cycle(root, "2026071518", required[:-1])
            self.assertIsNone(selection.select_source_cycle(root, self.package_date))

    def test_no_complete_required_18z_cycle_skips_build(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071518", required[:2])
            self.assertIsNone(selection.select_source_cycle(root, self.package_date))

    def test_exact_valid_times_are_required(self) -> None:
        required = list(selection.required_valid_times(self.package_date))
        required[-1] = "2026071800"
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            cycle = self.make_cycle(root, "2026071518", tuple(required))
            self.assertFalse(selection.cycle_is_complete(cycle, self.package_date))
            self.assertIsNone(selection.select_source_cycle(root, self.package_date))

    def test_manifest_rejects_non_18z_source_cycle(self) -> None:
        required = selection.required_valid_times(self.package_date)
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            self.make_cycle(root, "2026071512", required)
            self.make_cycle(root, "2026071518", required)
            self.assertEqual(
                selection.print_manifest(root, self.package_date, "2026071512"),
                1,
            )

    def test_manila_date_does_not_advance_to_future_package(self) -> None:
        now_utc = datetime(2026, 7, 16, 1, 0, tzinfo=timezone.utc)
        self.assertEqual(selection.manila_today(now_utc).isoformat(), "2026-07-16")
        self.assertNotEqual(selection.manila_today(now_utc).isoformat(), "2026-07-17")


if __name__ == "__main__":
    unittest.main()
