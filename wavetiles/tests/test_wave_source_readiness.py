from __future__ import annotations

import json
import os
import sys
import tempfile
import unittest
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import check_wave_source_readiness as readiness


class WaveSourceReadinessTests(unittest.TestCase):
    package_date = date(2026, 9, 8)
    source_cycle = "2026090718"

    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        root = Path(self.temporary.name)
        self.signal_root = root / "signals"
        self.status_root = root / "status"
        self.status_root.mkdir()
        self.signal_patch = mock.patch.object(readiness, "DEFAULT_SIGNAL_ROOT", self.signal_root)
        self.status_patch = mock.patch.object(readiness, "DEFAULT_STATUS_ROOT", self.status_root)
        self.signal_patch.start()
        self.status_patch.start()

    def tearDown(self) -> None:
        self.status_patch.stop()
        self.signal_patch.stop()
        self.temporary.cleanup()

    def write_status(self, state: str, *, checked_at: str | None = None) -> None:
        payload = {
            "schemaVersion": 1,
            "model": "WW3",
            "state": state,
            "packageDate": self.package_date.isoformat(),
            "requiredSourceCycle": self.source_cycle,
            "lastCheckAt": checked_at or datetime.now(timezone.utc).isoformat(),
        }
        (self.status_root / "WW3.json").write_text(json.dumps(payload), encoding="utf-8")

    def test_ready_to_build_is_suppressed_while_signal_exists(self) -> None:
        self.write_status("READY_TO_BUILD")
        self.signal_root.mkdir()
        readiness.signal_path("WW3").write_text("ready\n", encoding="utf-8")

        self.assertTrue(
            readiness.already_signaled_or_running(
                "WW3", self.package_date, self.source_cycle
            )
        )

    def test_missing_ready_signal_is_reemitted_on_next_scan(self) -> None:
        self.write_status("READY_TO_BUILD")

        self.assertFalse(
            readiness.already_signaled_or_running(
                "WW3", self.package_date, self.source_cycle
            )
        )

    def test_recent_failed_builder_obeys_retry_cooldown(self) -> None:
        self.write_status("FAILED", checked_at=datetime.now(timezone.utc).isoformat())
        with mock.patch.dict(os.environ, {"WAVE_SOURCE_FAILED_RETRY_MINUTES": "15"}):
            self.assertTrue(
                readiness.already_signaled_or_running(
                    "WW3", self.package_date, self.source_cycle
                )
            )

    def test_expired_failed_builder_can_be_signaled_again(self) -> None:
        checked_at = (datetime.now(timezone.utc) - timedelta(minutes=20)).isoformat()
        self.write_status("FAILED", checked_at=checked_at)
        with mock.patch.dict(os.environ, {"WAVE_SOURCE_FAILED_RETRY_MINUTES": "15"}):
            self.assertFalse(
                readiness.already_signaled_or_running(
                    "WW3", self.package_date, self.source_cycle
                )
            )

    def test_manila_date_rolls_over_at_local_midnight(self) -> None:
        self.assertEqual(
            readiness.manila_today(datetime(2026, 9, 7, 16, 0, tzinfo=timezone.utc)),
            date(2026, 9, 8),
        )


if __name__ == "__main__":
    unittest.main()
