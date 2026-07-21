# Production deployment and rollback runbook

## Safety rules

- Production changes require review and approval through the GitHub `production` environment.
- Never run the rollback workflow without confirming the target SHA is a previously successful production revision.
- Do not use rollback for database schema or destructive data changes unless backward compatibility has been verified separately.
- The workflows never merge a pull request and never bypass the protected deployment wrapper.

## One-time setup before enabling these workflows

1. In **Settings > Environments > production**, configure required reviewers and prevent self-review where supported.
2. Keep `PUBLIC_HOST` configured as an environment variable. Optionally configure `PUBLIC_URL` for the deployment link shown by GitHub.
3. Install the reviewed wrapper version on the server only after this pull request is approved:

   ```bash
   sudo install -o root -g root -m 0755 \
     /home/wavelab/app/deploy/almalinux/ci-deploy.sh \
     /usr/local/sbin/wavelab-deploy
   ```

4. Confirm the runner account still has passwordless sudo only for `/usr/local/sbin/wavelab-deploy`.
5. Dry-check without deploying by reviewing the wrapper, workflow inputs, environment reviewers, and the selected rollback SHA. Do not invoke the production workflow as a test.

## Normal deployment

A pull request or push to `main` always runs backend and frontend validation. On a push to `main`, the deploy job runs only when the compared change set includes an application, deployment, data-processing, dependency, or other runtime path.

Changes limited to the following are validated but do not start the AlmaLinux deployment job:

- `docs/**`
- Markdown files in any directory
- `.github/**`, including issue/PR templates, CODEOWNERS, and workflow-control files

The classifier disables Git rename detection so deleting or moving a runtime file into a documentation path still requires deployment. If the comparison base is missing or invalid, the workflow fails safe and requires deployment.

When deployment is required, the deploy job waits for approval from the GitHub `production` environment before using the self-hosted production runner.

The wrapper records the previous and current revisions under `/var/lib/wavelab/deployments`, writes a timestamped log under `/var/log/wavelab`, rebuilds using the existing deployment script, restarts services, and runs dependency and route smoke tests.

After approval, monitor:

```bash
sudo systemctl status wavelab-backend nginx redis
sudo journalctl -u wavelab-backend -n 100 --no-pager
sudo cat /var/lib/wavelab/deployments/last-successful-sha
```

## Rollback procedure

1. Identify a known-good SHA from a successful deployment run or `/var/lib/wavelab/deployments/previous-sha`.
2. Verify it is in `main` history and review changes between the current revision and target.
3. Open **Actions > WaveLab Production Rollback > Run workflow**.
4. Enter the full 40-character SHA and type `ROLLBACK` exactly.
5. A different authorized reviewer should approve the `production` environment gate.
6. Observe the workflow summary, service checks, smoke tests, and uploaded diagnostics if the run fails.

The rollback checks out the historical `main` commit in detached HEAD, runs its deployment script, and uses a preserved copy of the current smoke tester. A later normal deployment returns the checkout to `main`.

### Rollback limitations

- Application rollback does not restore MongoDB data.
- Dependency lockfiles from the historical commit are reinstalled, so rollback duration and external registry availability remain operational dependencies.
- A revision that predates a required environment variable, service migration, or data migration may not be safe to restore.
- If smoke tests fail after rollback, stop and diagnose rather than repeatedly switching revisions.

## Smoke-test coverage

The production smoke test is read-only and verifies:

- `wavelab-backend`, Nginx, and Redis systemd services are active.
- The backend `/status` endpoint responds directly.
- MongoDB accepts an administrative ping using the configured application connection.
- Redis accepts `PING` using configured credentials.
- Frontend root, login, charts, and static logo routes are served through Nginx.
- `/api/auth/check` rejects an unauthenticated request with 401 or 403.
- An unknown API route returns 404 through the frontend-to-API proxy path.

It deliberately does not register users, send OTPs, log in with a real production account, or mutate production data. Add a dedicated synthetic account only after its lifecycle, secrets storage, rate limits, and cleanup are explicitly designed.

## Artifact-once assessment

Building once and deploying an immutable artifact is the preferred long-term direction, but it is not enabled in this change because the current deployment has environment-coupled frontend values and installs backend dependencies on AlmaLinux.

Recommended staged migration:

1. Produce a frontend `dist` artifact in CI using reviewed production public variables.
2. Produce a backend release bundle containing source, lockfile, and production dependencies built for the AlmaLinux runtime and architecture.
3. Add checksums and a manifest containing commit SHA, Node/pnpm versions, and build timestamp.
4. Download into a versioned release directory such as `/opt/wavelab/releases/<sha>`.
5. Smoke-test the release before atomically switching a `current` symlink.
6. Retain at least the two most recent successful releases for fast rollback.

Do not switch to artifacts until native dependency compatibility, secret-free packaging, release-directory ownership, disk capacity, and rollback behavior are tested outside production.

## Observability and failure reporting

- GitHub step summaries record actor, runner, commit or rollback target, and result.
- Failed deploys and rollbacks upload sanitized diagnostics for 14 days.
- Server-side deployment logs are written to `/var/log/wavelab/deploy-*.log`.
- State files under `/var/lib/wavelab/deployments` show the previous, current, and last successful SHAs.
- Diagnostics intentionally avoid printing `/etc/wavelab/backend.env` or environment values.

## Cleanup and retention

Use conservative retention and verify backups before deletion:

- Deployment logs: retain 30 days; use `logrotate`, compress after one day, and cap total disk usage.
- GitHub failure artifacts: retain 14 days, as configured in the workflows.
- Release/build artifacts after artifact migration: retain the latest two successful production releases plus any active incident hold.
- Backups: follow the database recovery objective; keep daily backups for at least 14 days and monthly backups only when restore tests and storage policy support them.
- Git stashes: production deployment must not create them. Investigate and remove existing stashes only after confirming they contain no required operational changes.
- Package caches: clean only by age and disk threshold; never during an active deployment.
- Journald: configure size-based and time-based limits appropriate to available disk, while retaining enough history for incident review.

Suggested monthly checks:

```bash
sudo du -sh /var/log/wavelab /var/log/journal /home/wavelab/.npm /home/wavelab/.cache 2>/dev/null
sudo -u wavelab git -C /home/wavelab/app stash list
sudo find /var/log/wavelab -type f -name 'deploy-*.log' -mtime +30 -print
```

Treat the final `find` command as a report first. Add deletion only after confirming retention and backup requirements.
