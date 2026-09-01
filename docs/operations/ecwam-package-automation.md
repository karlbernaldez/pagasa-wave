# ECWAM Package Automation

WaveLab runs ECWAM package generation independently from WW3. The ECWAM timer checks once per hour whether the current package date in `Asia/Manila` can be completed from one ECWAM source cycle.

## Readiness rule

For the current Manila package date, one source cycle must contain all four exact valid times required by `wavetiles/scripts/ecwam_package_selection.py`:

- analysis: package date 00 UTC
- +24h
- +36h
- +48h

Source cycles are considered newest-first. The automation builds only when the newest cycle that satisfies all four inputs can be selected. It never mixes files from different source cycles.

If no cycle is complete yet, the service logs the newest available cycle and exits successfully. The timer retries on the next hourly run.

## Completed-package behavior

Before selecting a source cycle, the wrapper checks the ECWAM contour package directory for the current Manila package tag. If four non-empty `contours.geojson` outputs are already present, the service exits without rebuilding.

A real package-build failure exits non-zero so it remains visible through systemd and journald and can be retried by the next timer activation.

## Units

- `wavelab-ecwam-package-builder.service`
- `wavelab-ecwam-package-builder.timer`

The timer uses:

```ini
OnBootSec=10min
OnUnitActiveSec=1h
RandomizedDelaySec=5min
Persistent=true
```

This timer has no dependency on the WW3 service or timer.

## Installation

From the WaveLab application root:

```bash
sudo bash deploy/almalinux/install-ecwam-package-automation.sh
```

Review `/etc/wavelab/ecwam-package-builder.env` before supervised validation if production paths differ from the defaults.

## Supervised validation

```bash
sudo systemctl start wavelab-ecwam-package-builder.service
sudo systemctl status wavelab-ecwam-package-builder.service --no-pager -l
sudo journalctl -u wavelab-ecwam-package-builder.service -n 100 --no-pager
sudo systemctl list-timers wavelab-ecwam-package-builder.timer --no-pager
```

Expected not-ready behavior is a successful oneshot with a message similar to:

```text
ECWAM not ready for Manila package date YYYY-MM-DD; newest available cycle is YYYYMMDDHH but no cycle is complete yet
```

Expected ready behavior logs the selected Manila package date and source cycle, runs `build_ecwam_package.sh` with that exact cycle, and reports package completion.

## Rollback

Disable only the ECWAM timer; WW3 is unaffected:

```bash
sudo systemctl disable --now wavelab-ecwam-package-builder.timer
```

The installed files can then be removed after confirming no ECWAM build is active. Existing ECWAM package outputs are not deleted by this automation.
