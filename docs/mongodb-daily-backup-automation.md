# Daily encrypted MongoDB backup automation

## Scope and safety properties

This automation runs one daily logical `mongodump` of the production `wavelab` database, encrypts the backup with the configured age public recipient, uploads only the encrypted bundle and encrypted checksum to Discord, sends success or failure alerts, and keeps the newest 14 successfully uploaded backup sets locally.

It does not automate restore, use or store an age private identity, stop MongoDB, restart application services, or claim point-in-time consistency. The inspected production topology is standalone, so `--oplog` is deliberately not used.

Retention is upload-gated. A backup set becomes eligible for retention only after the Discord attachment request succeeds and a timestamped `.discord-uploaded` marker is written. If upload fails, the current plaintext archive, manifest, checksums, and encrypted files remain locally. Retention does not run, and no local backup is deleted.

## Files

- `deploy/almalinux/wavelab-mongodb-backup`
- `deploy/almalinux/wavelab-mongodb-backup.service`
- `deploy/almalinux/wavelab-mongodb-backup.timer`
- `deploy/almalinux/mongodb-backup.env.example`
- `deploy/almalinux/install-mongodb-backup-automation.sh`

## Production configuration

```bash
sudo install -d -m 0700 -o root -g root /etc/wavelab
sudo install -m 0600 -o root -g root \
  /opt/wavelab/app/deploy/almalinux/mongodb-backup.env.example \
  /etc/wavelab/mongodb-backup.env
sudo nano /etc/wavelab/mongodb-backup.env
```

Set only the age public recipient and the private Discord webhook. Never copy the age identity file to `vote3`.

## Pre-enable validation

```bash
sudo dnf install -y age curl mongodb-database-tools util-linux
command -v age curl flock mongodump mongosh python3 sha256sum tar timeout
sudo stat -c '%a %U:%G %n' /etc/wavelab/mongodb-backup.env /etc/wavelab/backend.env
sudo systemd-analyze verify \
  /opt/wavelab/app/deploy/almalinux/wavelab-mongodb-backup.service \
  /opt/wavelab/app/deploy/almalinux/wavelab-mongodb-backup.timer
sudo systemctl is-active mongod wavelab-backend nginx redis
curl -fsS http://127.0.0.1:5000/status
```

Stop if the topology is no longer standalone, the database is not writable primary, any required service is unhealthy, or disk space is below the configured minimum.

## Install without immediately running a backup

```bash
cd /opt/wavelab/app
sudo bash deploy/almalinux/install-mongodb-backup-automation.sh
sudo systemctl status wavelab-mongodb-backup.timer --no-pager
sudo systemctl list-timers wavelab-mongodb-backup.timer --no-pager
```

The timer runs daily at 02:30 server local time with up to 15 minutes randomized delay and `Persistent=true`.

## First supervised automated run

Run during a quiet production window:

```bash
sudo systemctl start wavelab-mongodb-backup.service
sudo systemctl status wavelab-mongodb-backup.service --no-pager
sudo journalctl -u wavelab-mongodb-backup.service -n 200 --no-pager
sudo find /var/backups/wavelab/mongodb -maxdepth 1 -type f -printf '%m %u:%g %s %f\n' | sort
sudo sha256sum --check /var/backups/wavelab/mongodb/*.backup.tar.age.sha256
sudo systemctl is-active mongod wavelab-backend nginx redis
curl -fsS http://127.0.0.1:5000/status
```

Confirm Discord contains only `.backup.tar.age` and `.backup.tar.age.sha256` attachments, plus success text. Do not upload plaintext archives, manifests, environment files, or the age identity.

## Failure behavior

- The non-blocking `flock` prevents overlapping runs.
- A failed dump removes only its `.partial` output.
- A failed encryption removes the temporary plaintext tar and encrypted partial file.
- A failed Discord upload preserves the completed local plaintext and encrypted artifacts.
- Retention runs only after upload confirmation.
- Failure alert delivery is best effort and cannot erase the original failure exit status.

## Retention behavior

The newest 14 sets with `.discord-uploaded` markers are retained. Older marked sets are removed by exact timestamped filenames only. Unmarked sets are never selected for automated deletion.

## Disable and rollback

```bash
sudo systemctl disable --now wavelab-mongodb-backup.timer
sudo rm -f /etc/systemd/system/wavelab-mongodb-backup.timer
sudo rm -f /etc/systemd/system/wavelab-mongodb-backup.service
sudo rm -f /usr/local/sbin/wavelab-mongodb-backup
sudo systemctl daemon-reload
```

Do not delete `/var/backups/wavelab/mongodb` during rollback. Existing backup artifacts remain available for recovery and investigation.
