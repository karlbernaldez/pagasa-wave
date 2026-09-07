# Wave Model Schedule Controls

WaveLab Admin can manage WW3 and ECWAM builder schedules without giving the Node process general shell or systemd privileges.

## Security boundary

The backend may invoke only `/usr/local/sbin/wavelab-wave-model-ops` through passwordless sudo. The helper is installed root-owned and contains its own allow-list for model codes, timer units, operations, schedule modes, intervals, daily times, and timezones.

The Admin API never accepts service names, timer names, filesystem paths, shell commands, `OnCalendar` expressions, or arbitrary systemd directives.

Supported schedules:

- `interval`: 15 to 1440 minutes
- `daily`: 1 to 8 `HH:MM` times with an IANA timezone such as `Asia/Manila`

Supported operations:

- view schedule/status
- set schedule
- enable scheduled runs
- disable scheduled runs
- restore the repository default hourly schedule
- supervised Start Now through the existing trigger-file mechanism

Disabling a timer uses `systemctl disable --now` on the timer only. It does not stop a builder service that is already running.

Admin-managed schedules clear randomized delay and use `Persistent=false` so saving/re-arming a schedule cannot immediately replay a missed timer event. Start Now remains an explicit separate action.

## Install after deployment

After the application revision containing these controls has been deployed, run once as root:

```bash
cd /home/wavelab/app
sudo APP_ROOT=/home/wavelab/app APP_USER=wavelab \
  bash deploy/almalinux/install-wave-model-schedule-controls.sh
```

Verify the helper boundary:

```bash
sudo -u wavelab sudo -n /usr/local/sbin/wavelab-wave-model-ops status WW3
sudo -u wavelab sudo -n /usr/local/sbin/wavelab-wave-model-ops status ECWAM
```

Both commands should return JSON. An unsupported model must be rejected:

```bash
sudo -u wavelab sudo -n /usr/local/sbin/wavelab-wave-model-ops status TESTMODEL
```

## Verify timers

```bash
systemctl status wavelab-ww3-package-builder.timer --no-pager
systemctl status wavelab-ecwam-package-builder.timer --no-pager
systemctl list-timers --all | grep -E 'wavelab-(ww3|ecwam)-package-builder'
```

Then open Admin -> Builder Schedules and confirm WW3 and ECWAM show the same timer state as systemd.

## Restore behavior

Restore Default removes the Admin schedule drop-in and its root-owned state file, then reloads systemd. It does not request an immediate builder run. The repository timer remains the source of truth for the default schedule.
