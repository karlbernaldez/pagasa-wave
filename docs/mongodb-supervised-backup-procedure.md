# First supervised MongoDB backup procedure

## Scope

This procedure creates one compressed logical archive from the inspected production database.

It does not:

- schedule recurring backups
- delete or rotate prior backups
- stop WaveLab or MongoDB
- create MongoDB users
- run `mongorestore`
- claim point-in-time consistency

The inspected source is a standalone MongoDB server. Therefore this first logical dump is labeled `logical_dump_not_point_in_time_consistent`. Do not use `--oplog`; it is not available for this topology.

## Preconditions

Before running:

1. PR containing `run-supervised-mongodb-backup.sh` is reviewed and merged.
2. Production monitoring is healthy.
3. No deployment or incident response is active.
4. At least 1 GiB is available under `/var/backups/wavelab/mongodb`.
5. `/etc/wavelab/backend.env` still contains the working `MONGO_URI`.
6. The operator understands the output remains `UNVERIFIED_PENDING_RESTORE_TEST` until an isolated restore succeeds.

## Command

Run from the checked-out repository:

```bash
cd /opt/wavelab/app
sudo CONFIRM_TOKEN=CREATE_ONE_SUPERVISED_BACKUP \
  bash deploy/almalinux/run-supervised-mongodb-backup.sh
```

The confirmation token prevents accidental execution. The script also uses a non-blocking file lock to prevent overlapping runs.

## Expected files

A successful run creates three root-readable files with mode `0600`:

```text
/var/backups/wavelab/mongodb/wavelab-<database>-<UTC timestamp>.archive.gz
/var/backups/wavelab/mongodb/wavelab-<database>-<UTC timestamp>.archive.gz.sha256
/var/backups/wavelab/mongodb/wavelab-<database>-<UTC timestamp>.archive.gz.manifest
```

The manifest intentionally records:

```text
backup_status=UNVERIFIED_PENDING_RESTORE_TEST
source_topology=standalone
consistency=logical_dump_not_point_in_time_consistent
retention_deletion_enabled=false
off_host_copy_verified=false
restore_test_verified=false
```

## Immediate validation

After the script exits successfully:

```bash
sudo ls -lh /var/backups/wavelab/mongodb
sudo stat -c '%a %U:%G %n' /var/backups/wavelab/mongodb/*
cd /var/backups/wavelab/mongodb
sudo sha256sum --check ./*.sha256
sudo sed -n '1,20p' ./*.manifest
sudo systemctl is-active wavelab-backend nginx redis
```

Do not display the archive contents and do not copy the archive to an unencrypted workstation or chat attachment.

## Stop conditions

Stop and investigate if:

- the topology check no longer reports standalone
- the source is not writable primary
- monitoring reports application errors or latency during the dump
- the archive is empty
- checksum verification fails
- file ownership or mode is not `root:root` and `0600`
- the backend, Nginx, or Redis becomes unhealthy

A failed run removes only its `.partial` archive. It does not delete previously completed archives.

## Rollback

There is no application rollback because no service configuration changes are made.

If the newly created backup is invalid, preserve its manifest and error evidence until reviewed. Remove the failed archive only through an explicit operator command after confirming the exact timestamped path. Do not add wildcard deletion or automated retention yet.

## Next gate

Before enabling a timer or retention:

1. Copy one archive to encrypted off-host storage.
2. Verify the copied checksum.
3. Provision a fresh isolated MongoDB instance on a separate non-production host where possible.
4. Restore without `--drop` into the empty instance.
5. Compare collection counts, indexes, and representative schemas.
6. Record restore duration and update the manifest/evidence as verified.

Never run `mongorestore` with the production `MONGO_URI`.
