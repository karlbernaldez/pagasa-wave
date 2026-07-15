# MongoDB backup and restore validation runbook

## Status

This runbook is intentionally staged. The current implementation stops after **read-only inspection**.

Not yet enabled:

- scheduled backups
- backup retention deletion
- MongoDB user or role changes
- production restore commands
- restore-test containers or temporary database processes
- systemd backup services or timers

## Safety invariants

1. Never run `mongorestore` against the production `MONGO_URI`.
2. Never use `--drop` unless the destination has been independently proven to be disposable and isolated.
3. Restore tests must use a fresh MongoDB instance with a fresh data directory, a non-production port, loopback-only networking, and no application traffic.
4. Do not print, log, commit, or place `MONGO_URI` in command history.
5. A backup is not considered usable until a restore test and post-restore validation succeed.
6. Deletion or retention automation must remain disabled until at least one complete backup/restore cycle has passed.
7. Prefer a separate restore-test host. A same-host disposable instance is an interim option only after disk, memory, port, and process isolation have been reviewed.

## Recovery objectives to approve before automation

Record these explicitly before selecting frequency and retention:

- Recovery point objective (RPO): maximum acceptable data loss
- Recovery time objective (RTO): maximum acceptable restoration time
- Backup storage location and encryption method
- Off-host or off-site copy requirement
- Retention periods for daily, weekly, and monthly backups
- Owner responsible for reviewing backup and restore-test results

The production deployment runbook currently suggests retaining daily backups for at least 14 days, but retention should be finalized only after recovery objectives, restore tests, and storage capacity are confirmed.

## Phase 0 — read-only inspection

### Goal

Identify the MongoDB topology, logical database size, tool availability, host capacity, and service context without modifying production.

### Command

From the checked-out repository:

```bash
sudo bash deploy/almalinux/inspect-mongodb-backup-readiness.sh
```

Optional candidate backup path override:

```bash
sudo BACKUP_ROOT=/var/backups/wavelab/mongodb \
  bash deploy/almalinux/inspect-mongodb-backup-readiness.sh
```

### Expected behavior

The script:

- reads `MONGO_URI` from `/etc/wavelab/backend.env` without sourcing or printing it
- reports whether `mongosh`, `mongodump`, and `mongorestore` are installed
- reports filesystem capacity and whether the proposed backup directory already exists
- reports WaveLab service state
- runs MongoDB `hello` and `db.stats()` probes only
- does not create directories, users, archives, timers, or restore targets

Save the sanitized output in the operations record. Do not paste environment files or connection strings into tickets or chat.

### Stop conditions

Do not proceed if any of these are unresolved:

- the database topology is unknown
- the database is sharded and the backup method has not been reviewed for cluster consistency
- available storage is insufficient for at least two uncompressed database-size equivalents plus operational headroom
- database tools are incompatible with the MongoDB server version
- the application credential lacks the required backup permissions and no dedicated least-privilege backup credential exists
- the only proposed restore destination is production

## Phase 1 — backup design review

No production command is run in this phase.

Approve a design containing:

- a dedicated backup identity with only the permissions required by the selected backup method
- an archive format such as `mongodump --archive --gzip`
- a root-owned destination with mode `0700`
- a timestamped immutable filename
- SHA-256 checksum and a metadata manifest
- tool version, source topology, database name, start/end time, archive size, and result in the manifest
- encrypted off-host storage
- alerting on failure, stale backup age, checksum failure, or insufficient disk space
- load controls and a low-traffic execution window

For a replica set, evaluate reading from a secondary only after confirming replication health and acceptable consistency semantics. Do not blindly force secondary reads.

## Phase 2 — first supervised backup

This phase requires a separately reviewed change. It must not be combined with retention deletion.

Before execution:

1. Confirm current replication or cluster health.
2. Confirm free disk and inode capacity.
3. Confirm the exact database tools version.
4. Confirm the archive destination permissions.
5. Confirm monitoring is healthy.
6. Confirm the command does not expose credentials in process listings, shell history, logs, or notifications.

During execution, monitor database latency, CPU, memory, disk throughput, and application error rate. Abort if production performance degrades materially.

After execution:

- verify a non-zero archive exists
- generate and verify its SHA-256 checksum
- record duration and size
- copy it to encrypted off-host storage
- do not call the backup successful yet; it remains **unverified** until restore testing passes

## Phase 3 — isolated restore test

Preferred destination: a separate non-production host or ephemeral environment.

Minimum isolation requirements:

- no production MongoDB URI or credentials present
- fresh empty data directory created specifically for the test
- MongoDB bound to `127.0.0.1` only
- non-production port, for example `27028`
- firewall exposure absent
- unique temporary database name
- application services not pointed at the test instance
- resource limits that prevent the test from exhausting production host memory or disk
- cleanup path reviewed before starting

The restore command must use an explicitly constructed localhost test URI. It must not reuse a variable named `MONGO_URI` from the production environment.

Do not use `--drop` for the first restore test. The destination must already be empty.

## Phase 4 — post-restore validation

Validation should be read-only and should include:

- restored database and collection list
- collection document counts compared with the backup manifest or source snapshot
- index names and index counts
- representative document shape checks without exporting sensitive records
- application migration/version compatibility
- a temporary WaveLab backend instance pointed only at the isolated database, followed by read-only smoke tests
- measured restore duration for RTO tracking

A successful `mongorestore` exit code alone is insufficient.

## Phase 5 — cleanup

Only after validation evidence is saved:

1. Stop the temporary backend and MongoDB process.
2. Confirm no process is using the temporary port or data directory.
3. Remove the disposable restore data directory.
4. Retain only sanitized logs and validation results.
5. Confirm production services and monitoring remain healthy.

## Phase 6 — automation

Automation should be introduced through separate reviewed changes:

1. backup script with locking, checksums, manifest, and failure handling
2. systemd service with restrictive sandboxing and a dedicated state directory
3. systemd timer with randomized delay
4. stale-backup and failure alerts through the existing Discord monitor path
5. off-host encrypted copy
6. retention reporting in dry-run mode
7. deletion only after multiple successful restore tests and explicit approval
8. periodic restore-test automation in a non-production environment

## Rollback and blast-radius controls

The inspection phase changes no server state, so rollback is simply to stop and record findings.

For future backup automation, rollback means disabling the timer and service; existing archives must not be deleted automatically.

For restore testing, the primary blast-radius control is destination isolation. If there is any uncertainty about the destination URI, port, data directory, or host identity, stop before running `mongorestore`.
