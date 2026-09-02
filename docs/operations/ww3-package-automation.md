# WW3 package automation

## Data flow

1. The modeling team writes `/home/darwin/ww3_nc/ww3_YYYYMMDDHH.tar.gz`.
2. The timer checks hourly and waits until the archive has not changed for 10 minutes.
3. The archive is validated before extraction. Absolute paths, parent traversal, links, devices, unexpected top-level folders, and archives without `ww3_grdo.*.nc` files are rejected.
4. The cycle is atomically installed under `wavetiles/input/ww3/YYYYMMDDHH`.
5. The newest source cycle containing every required valid time is selected without mixing cycles.
6. The package builds 21 frames at a three-hour cadence from analysis (T+0) through T+60. The existing chart anchors remain T+0, T+24, T+36, and T+48.
7. A successful build must contain PNG tiles and 21 non-empty contour files before a success marker is written. A legacy marker with fewer frames is treated as incomplete and rebuilt.

## Retention

Defaults:

- source archives: 10 days
- extracted input cycles: 10 days
- generated tile packages: 10 days
- newest successful tile packages always retained: 3
- failed-build markers: 2 days

Cleanup starts in `CLEANUP_DRY_RUN=1`. Review journald output before enabling deletion.

Cleanup only accepts strict names:

- `ww3_YYYYMMDDHH.tar.gz`
- `input/ww3/YYYYMMDDHH`
- tile folders derived from successful `YYYY-MM-DD` build markers

Symlinked directories are not deleted.

## Installation

```bash
cd /home/wavelab/app
sudo env APP_ROOT=/home/wavelab/app \
  bash deploy/almalinux/install-ww3-package-automation.sh
```

Review the root-only environment file:

```bash
sudoedit /etc/wavelab/ww3-package-builder.env
sudo stat -c '%a %U:%G %n' /etc/wavelab/ww3-package-builder.env
```

Expected mode: `600 root:root`.

The `wavelab` account must have execute/read access to `/home/darwin` and read/write access to `/home/darwin/ww3_nc`, because retention deletes expired source archives.

## Supervised validation

Keep `CLEANUP_DRY_RUN=1`, then run:

```bash
sudo systemctl start wavelab-ww3-package-builder.service
sudo systemctl status wavelab-ww3-package-builder.service
sudo journalctl -u wavelab-ww3-package-builder.service -n 200 --no-pager
```

Confirm:

- a stable archive imports into the matching cycle folder;
- unsafe or incomplete archives are rejected;
- the newest complete package builds only once;
- PNG files exist below `wavetiles/tiles/WW3`;
- a marker exists in `/var/lib/wavelab-ww3/built`;
- cleanup entries are dry-run messages only;
- the timer remains active.

## Enable cleanup

After reviewing at least one successful run and every proposed deletion path:

```bash
sudo sed -i 's/^CLEANUP_DRY_RUN=1$/CLEANUP_DRY_RUN=0/' \
  /etc/wavelab/ww3-package-builder.env
sudo systemctl start wavelab-ww3-package-builder.service
```

Recheck the journal and disk usage.

## Rollback

```bash
sudo systemctl disable --now wavelab-ww3-package-builder.timer
sudo rm -f /etc/systemd/system/wavelab-ww3-package-builder.{service,timer}
sudo rm -f /usr/local/sbin/wavelab-ww3-package-builder
sudo systemctl daemon-reload
```

Rollback does not remove source archives, NetCDF inputs, generated tiles, or state markers.
