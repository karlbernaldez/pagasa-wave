from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import publish_wave_package as publisher


class WavePackagePublisherTests(unittest.TestCase):
    TAG = "2026SEP07"
    SOURCE_CYCLE = "2026090618"

    def metadata(self) -> dict:
        return {
            "packageDate": "2026-09-07",
            "packageTag": self.TAG,
            "sourceCycle": self.SOURCE_CYCLE,
            "variable": "swh",
            "sigma": "1.5",
            "requiredForecastHours": list(range(0, 61, 3)),
        }

    def make_stage(self, root: Path, metadata: dict | None = None) -> Path:
        stage = root / "stage"
        contour_root = stage / "contours" / self.TAG
        for hour in range(0, 61, 3):
            valid = f"frame-{hour:02d}"
            target = contour_root / valid / "contours.geojson"
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text('{"type":"FeatureCollection","features":[]}', encoding="utf-8")

        contour_root.mkdir(parents=True, exist_ok=True)
        (contour_root / "package.json").write_text(
            json.dumps(self.metadata() if metadata is None else metadata),
            encoding="utf-8",
        )

        tile = stage / "light" / self.TAG / "frame-00" / "0" / "0" / "0.png"
        tile.parent.mkdir(parents=True, exist_ok=True)
        tile.write_bytes(b"png")
        return stage

    def make_existing_production(self, root: Path) -> Path:
        production = root / "production"
        old_contours = production / "contours" / self.TAG
        old_contours.mkdir(parents=True, exist_ok=True)
        (old_contours / "old.txt").write_text("old contours", encoding="utf-8")
        old_light = production / "light" / self.TAG
        old_light.mkdir(parents=True, exist_ok=True)
        (old_light / "old.txt").write_text("old light", encoding="utf-8")
        return production

    def test_validates_and_publishes_complete_stage(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage = self.make_stage(root)
            production = self.make_existing_production(root)

            publisher.publish(
                stage,
                production,
                self.TAG,
                expected_source_cycle=self.SOURCE_CYCLE,
            )

            self.assertFalse((production / "contours" / self.TAG / "old.txt").exists())
            self.assertFalse((production / "light" / self.TAG / "old.txt").exists())
            self.assertTrue((production / "contours" / self.TAG / "package.json").is_file())
            self.assertTrue((production / "light" / self.TAG / "frame-00" / "0" / "0" / "0.png").is_file())

    def test_rejects_invalid_json_metadata_before_publish(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage = self.make_stage(root)
            metadata_path = stage / "contours" / self.TAG / "package.json"
            metadata_path.write_text("{not-json", encoding="utf-8")

            with self.assertRaisesRegex(SystemExit, "metadata is invalid"):
                publisher.validate_stage(stage, self.TAG)

    def test_rejects_wrong_source_cycle_before_publish(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage = self.make_stage(root)

            with self.assertRaisesRegex(SystemExit, "sourceCycle mismatch"):
                publisher.validate_stage(
                    stage,
                    self.TAG,
                    expected_source_cycle="2026090518",
                )

    def test_rejects_incomplete_forecast_hour_metadata(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            metadata = self.metadata()
            metadata["requiredForecastHours"] = list(range(0, 58, 3))
            stage = self.make_stage(root, metadata)

            with self.assertRaisesRegex(SystemExit, "requiredForecastHours mismatch"):
                publisher.validate_stage(stage, self.TAG)

    def test_rolls_back_previous_categories_if_later_promotion_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            stage = self.make_stage(root)
            production = self.make_existing_production(root)
            real_replace = os.replace

            def fail_light_promotion(source, destination):
                source_path = Path(source)
                destination_path = Path(destination)
                if ".incoming-" in source_path.name and destination_path.parent.name == "light":
                    raise OSError("simulated light promotion failure")
                return real_replace(source, destination)

            with mock.patch.object(publisher.os, "replace", side_effect=fail_light_promotion):
                with self.assertRaisesRegex(OSError, "simulated light promotion failure"):
                    publisher.publish(
                        stage,
                        production,
                        self.TAG,
                        expected_source_cycle=self.SOURCE_CYCLE,
                    )

            self.assertEqual(
                (production / "contours" / self.TAG / "old.txt").read_text(encoding="utf-8"),
                "old contours",
            )
            self.assertEqual(
                (production / "light" / self.TAG / "old.txt").read_text(encoding="utf-8"),
                "old light",
            )
            self.assertEqual(list(production.rglob(f".{self.TAG}.incoming-*")), [])
            self.assertEqual(list(production.rglob(f".{self.TAG}.backup-*")), [])


if __name__ == "__main__":
    unittest.main()
