from __future__ import annotations

import sys
import tempfile
import unittest
from datetime import date
from pathlib import Path
from types import SimpleNamespace
from unittest import mock

SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "scripts"
if str(SCRIPTS_DIR) not in sys.path:
    sys.path.insert(0, str(SCRIPTS_DIR))

import run_normalized_wave_package as runner


class NormalizedWaveRunnerTests(unittest.TestCase):
    def config(self, root: Path, *, model: str = "WW3") -> runner.RunnerConfig:
        cycle = root / "normalized" / model / "2026090618"
        cycle.mkdir(parents=True)
        return runner.RunnerConfig(
            model=model,
            cycle_dir=cycle,
            package_date=date(2026, 9, 7),
            output_root=root / "production" / model,
            source_cycle="2026090618",
            sigma=1.5,
            workers=4,
            grid_points=271051 if model == "ECWAM" else None,
            stage_parent=root / "stage",
            builder_args=("--skip-existing",),
        )

    def reader(self, model: str = "WW3", source_cycle: str = "2026090618"):
        return SimpleNamespace(
            model=model,
            source_cycle=source_cycle,
            forecast_hours=tuple(range(0, 61, 3)),
        )

    def test_builds_model_specific_commands(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            python_bin = Path("/usr/bin/python3")

            ww3 = runner.builder_command(self.config(root, model="WW3"), root / "stage-ww3", python_bin)
            self.assertIn("build_normalized_ww3_shadow.py", " ".join(ww3))
            self.assertNotIn("--grid-points", ww3)
            self.assertEqual(ww3[-1], "--skip-existing")

            ecwam = runner.builder_command(self.config(root, model="ECWAM"), root / "stage-ecwam", python_bin)
            self.assertIn("build_normalized_ecwam_shadow.py", " ".join(ecwam))
            self.assertIn("--grid-points", ecwam)
            self.assertIn("271051", ecwam)

    def test_rejects_normalized_source_cycle_mismatch(self):
        with tempfile.TemporaryDirectory() as temporary:
            config = self.config(Path(temporary))
            with mock.patch.object(
                runner,
                "NormalizedCycleReader",
                return_value=self.reader(source_cycle="2026090518"),
            ):
                with self.assertRaisesRegex(ValueError, "source mismatch"):
                    runner.validate_config(config)

    def test_cleans_stage_when_builder_fails(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            config = self.config(root)

            with mock.patch.object(runner, "NormalizedCycleReader", return_value=self.reader()), mock.patch.object(
                runner.subprocess,
                "run",
                return_value=SimpleNamespace(returncode=7),
            ), mock.patch.object(runner, "publish") as publish:
                with self.assertRaisesRegex(RuntimeError, "status 7"):
                    runner.run_pipeline(config, Path("/usr/bin/python3"))

            publish.assert_not_called()
            self.assertTrue(config.stage_parent.is_dir())
            self.assertEqual(list(config.stage_parent.iterdir()), [])

    def test_publishes_valid_stage_and_cleans_it(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            config = self.config(root)

            with mock.patch.object(runner, "NormalizedCycleReader", return_value=self.reader()), mock.patch.object(
                runner.subprocess,
                "run",
                return_value=SimpleNamespace(returncode=0),
            ), mock.patch.object(runner, "publish") as publish:
                runner.run_pipeline(config, Path("/usr/bin/python3"))

            publish.assert_called_once()
            args, kwargs = publish.call_args
            stage_root = args[0]
            self.assertEqual(args[1], config.output_root)
            self.assertEqual(args[2], "2026SEP07")
            self.assertEqual(kwargs["expected_source_cycle"], "2026090618")
            self.assertFalse(stage_root.exists())


if __name__ == "__main__":
    unittest.main()
