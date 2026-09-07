from __future__ import annotations

import json
import tempfile
import unittest
from pathlib import Path

from wavetiles.pipeline.status import status_path, write_status


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
