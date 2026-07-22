# Encrypted MongoDB backup copy to Discord

## Purpose

This is a temporary off-host copy mechanism while dedicated object storage is unavailable. Discord is not the authoritative backup system.

## Security model

- Encryption uses `age` public-key encryption.
- The production server receives only the public recipient string.
- The private age identity must be generated and stored on a separate trusted administrator machine.
- The private identity must never be committed, uploaded to Discord, or copied to the production server.
- The plaintext MongoDB archive remains root-only on the server.

## One-time setup on a trusted administrator machine

Install `age`, then generate a recovery identity:

```bash
age-keygen -o wavelab-backup-identity.txt
chmod 600 wavelab-backup-identity.txt
```

Record the printed public recipient beginning with `age1`. Store the identity file in at least two secure locations under administrator control.

## Production prerequisites

1. Merge the reviewed implementation.
2. Install `age` on the production server.
3. Confirm `/etc/wavelab/monitor.env` contains the already-tested `DISCORD_WEBHOOK_URL`.
4. Confirm the latest MongoDB archive checksum still verifies.
5. Confirm the Discord channel is private and restricted to trusted operators.

## Run once

From the production repository:

```bash
cd /opt/wavelab/app
sudo -u wavelab git pull --ff-only origin main

sudo AGE_RECIPIENT='age1REPLACE_WITH_PUBLIC_RECIPIENT' \
  CONFIRM_TOKEN=ENCRYPT_AND_UPLOAD_ONE_BACKUP \
  bash deploy/almalinux/encrypt-and-upload-mongodb-backup.sh
```

The script automatically selects the newest `.archive.gz.manifest`, verifies the existing plaintext archive checksum, creates a temporary tar bundle, encrypts it, removes the temporary plaintext bundle, generates a checksum for the encrypted artifact, and uploads only the encrypted artifact plus its checksum.

## Expected local outputs

```text
/var/backups/wavelab/mongodb/<backup>.backup.tar.age
/var/backups/wavelab/mongodb/<backup>.backup.tar.age.sha256
```

Both files must remain `0600 root:root`. The temporary `.backup.tar` must not remain.

## Validation

```bash
sudo bash -c '
set -euo pipefail
cd /var/backups/wavelab/mongodb
sha256sum --check -- ./*.backup.tar.age.sha256
find . -maxdepth 1 -type f -name "*.backup.tar" -print
stat -c "%a %U:%G %s bytes %n" ./*.backup.tar.age ./*.backup.tar.age.sha256
'
```

Expected:

- encrypted checksum reports `OK`
- no unencrypted `.backup.tar` is listed
- encrypted artifact and checksum are `0600 root:root`
- Discord contains the encrypted attachment and checksum only

## Recovery validation on a separate trusted machine

1. Download the `.age` file and its `.sha256` file from Discord.
2. Verify the encrypted checksum.
3. Decrypt using the separately stored age identity.
4. Extract the tar bundle.
5. Verify the inner MongoDB archive checksum.
6. Restore only into an isolated non-production MongoDB instance.

Example decryption:

```bash
sha256sum --check ./wavelab-*.backup.tar.age.sha256
age -d -i ./wavelab-backup-identity.txt \
  -o ./wavelab-backup.tar \
  ./wavelab-*.backup.tar.age
mkdir ./wavelab-backup
 tar -C ./wavelab-backup -xf ./wavelab-backup.tar
```

Do not run `mongorestore` until the isolated restore environment has been separately reviewed.

## Failure and rollback

- If encryption fails, the script removes the current temporary plaintext tar and partial encrypted output.
- If Discord upload fails, the verified encrypted artifact remains locally for retry; the production MongoDB archive is unchanged.
- No services are restarted.
- No backup retention deletion is performed.
- No database restore is performed.
