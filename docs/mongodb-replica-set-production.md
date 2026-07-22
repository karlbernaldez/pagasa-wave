# MongoDB Replica Set Production Notes

WaveLab production uses a single-node MongoDB replica set so application transactions are supported.

## Required state

- MongoDB is active and reports `setName: rs0`.
- `/etc/wavelab/backend.env` contains a MongoDB URI with `replicaSet=rs0`.
- `wavelab-backend.service` is active.
- `wavelab-mongodb-backup.timer` is enabled and active.

## Validate production

```bash
sudo systemctl is-active mongod
sudo systemctl is-active wavelab-backend
sudo systemctl is-active wavelab-mongodb-backup.timer
```

Validate MongoDB through the configured application URI without printing credentials:

```bash
sudo bash -c '
MONGO_URI=$(sed -n "s/^MONGO_URI=//p" /etc/wavelab/backend.env | tail -n 1)
mongosh "$MONGO_URI" --quiet --eval "
const h = db.hello();
printjson({setName: h.setName, isWritablePrimary: h.isWritablePrimary});
"
'
```

Expected values are `setName: rs0` and `isWritablePrimary: true`.

## Validate backup automation

Install the repository version of the backup automation:

```bash
sudo env APP_ROOT=/home/wavelab/app \
  bash deploy/almalinux/install-mongodb-backup-automation.sh
```

Run one supervised backup:

```bash
sudo systemctl reset-failed wavelab-mongodb-backup.service
sudo systemctl start wavelab-mongodb-backup.service
sudo journalctl -u wavelab-mongodb-backup.service --since "5 minutes ago" --no-pager
```

A successful run logs the detected topology, creates the logical dump, encrypts it, uploads it, applies retention, and exits with status 0. The service is a oneshot unit, so `inactive (dead)` after a successful run is expected.

The generated manifest records `source_topology` and `source_replica_set`.

## Rollback

If the updated backup script fails after deployment, restore the previous executable from the prior application revision and reinstall the automation:

```bash
git checkout <previous-revision> -- deploy/almalinux/wavelab-mongodb-backup
sudo env APP_ROOT=/home/wavelab/app \
  bash deploy/almalinux/install-mongodb-backup-automation.sh
```

Do not remove `replicaSet=rs0` from the backend URI merely to make an old standalone-only backup script pass. That would break application transactions.

## Security notes

- Never print or paste the MongoDB URI because it contains credentials.
- Keep `/etc/wavelab/backend.env` and `/etc/wavelab/mongodb-backup.env` owned by `root:root` with mode `0600`.
- Replica-set bootstrap or emergency user recovery must be performed only during a supervised maintenance window with a verified backup and explicit rollback plan.
