from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from wavetiles.pipeline.status import (
    append_run_history,
    history_path,
    status_path,
    write_status,
)


class WavePipelineStatusTests(unittest.TestCase):
    def test_writes_structured_status_snapshot(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            document = write_status(
                "ww3",
                "READY",
                root=root,
                package_date="2026-09-08",
                required_source_cycle="2026090718",
                source_cycle="2026090718",
                input_mode="normalized",
                frame_count=21,
                expected_frame_count=21,
                published=True,
            )

            target = root / "WW3.json"
            self.assertEqual(status_path("WW3", root), target)
            self.assertTrue(target.is_file())
            stored = json.loads(target.read_text(encoding="utf-8"))
            self.assertEqual(stored["schemaVersion"], 1)
            self.assertEqual(stored["model"], "WW3")
            self.assertEqual(stored["state"], "READY")
            self.assertEqual(stored["sourceCycle"], "2026090718")
            self.assertEqual(stored["frameCount"], 21)
            self.assertTrue(stored["published"])
            self.assertEqual(document, stored)

    def test_appends_terminal_run_history_without_overwriting_previous_attempts(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            first = append_run_history(
                "WW3",
                "FAILED",
                root=root,
                run_id="run-1",
                package_date="2026-09-08",
                required_source_cycle="2026090718",
                source_cycle="2026090718",
                started_at="2026-09-08T01:00:00Z",
                completed_at="2026-09-08T01:10:00Z",
                error="builder failed",
            )
            second = append_run_history(
                "WW3",
                "READY",
                root=root,
                run_id="run-2",
                package_date="2026-09-08",
                required_source_cycle="2026090718",
                source_cycle="2026090718",
                started_at="2026-09-08T01:15:00Z",
                completed_at="2026-09-08T01:35:00Z",
                published=True,
                frame_count=21,
                expected_frame_count=21,
            )

            target = history_path("WW3", root)
            rows = [
                json.loads(line)
                for line in target.read_text(encoding="utf-8").splitlines()
                if line.strip()
            ]

            self.assertEqual([row["runId"] for row in rows], ["run-1", "run-2"])
            self.assertEqual(first["outcome"], "FAILED")
            self.assertEqual(second["outcome"], "READY")
            self.assertEqual(first["durationSeconds"], 600.0)
            self.assertEqual(second["durationSeconds"], 1200.0)

    def test_history_requires_terminal_state_and_run_id(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            with self.assertRaisesRegex(ValueError, "terminal"):
                append_run_history("WW3", "BUILDING", root=root, run_id="run-1")
            with self.assertRaisesRegex(ValueError, "run_id"):
                append_run_history("WW3", "READY", root=root, run_id="")

    def test_accepts_source_ready_state(self):
        with tempfile.TemporaryDirectory() as temporary:
            stored = write_status(
                "ECWAM",
                "READY_TO_BUILD",
                root=Path(temporary),
                package_date="2026-09-08",
                required_source_cycle="2026090718",
                source_cycle="2026090718",
                frame_count=21,
                expected_frame_count=21,
                published=False,
            )
            self.assertEqual(stored["state"], "READY_TO_BUILD")
            self.assertFalse(stored["published"])

    def test_rejects_unknown_state(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(ValueError, "invalid pipeline state"):
                write_status("WW3", "BROKEN", root=Path(temporary))

    def test_rejects_invalid_model_name(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(ValueError, "invalid model name"):
                write_status("../WW3", "READY", root=Path(temporary))


if __name__ == "__main__":
    unittest.main()
