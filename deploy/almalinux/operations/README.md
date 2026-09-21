# WaveLab AlmaLinux deployment operations

This directory contains the release-time orchestration and validation layer for the WaveLab AlmaLinux host.

## Structure

```text
operations/
├── README.md
├── deploy.sh
├── preflight.sh
├── validate-deployment.sh
└── lib/
    └── common.sh
```

The historical `deploy/almalinux/deploy.sh` path remains as a compatibility entrypoint and delegates to `operations/deploy.sh`.

## Deployment flow

Run from the repository checkout on the WaveLab server:

```bash
sudo bash deploy/almalinux/deploy.sh <public-host>
```

The orchestrator performs these stages in order:

1. Validate the checkout, deployment branch, clean worktree, and backend environment.
2. Run the root repository quality gate.
3. Run backend tests and workflow tests.
4. Run frontend tests and the production build.
5. Run normalized wave-pipeline Python tests.
6. Install the production backend dependency set.
7. Apply frontend permissions and SELinux labels.
8. Synchronize application and wave-builder systemd files.
9. Validate and reload Nginx.
10. Restart the backend and wait for `/status`.
11. Verify the served frontend revision.
12. Run post-deployment service/timer validation.
13. Write persistent deployment logs and sanitized health reports.

A failed required preflight or post-deployment check returns a non-zero exit code and the deployment is not reported as successful.

## Standalone preflight

```bash
sudo bash deploy/almalinux/operations/preflight.sh
```

Useful environment overrides:

```text
APP_USER=wavelab
APP_ROOT=/home/wavelab/app
BACKEND_ENV=/etc/wavelab/backend.env
EXPECTED_BRANCH=main
RUN_WAVETILES_TESTS=1
WAVETILES_PYTHON=/home/wavelab/app/wavetiles/.venv/bin/python
```

The application-local WaveTiles virtual environment is the supported default runtime for pipeline tests. `RUN_WAVETILES_TESTS=0` exists for emergency diagnosis only; the production deployment path forces these tests on.

## Standalone health validation

```bash
sudo bash deploy/almalinux/operations/validate-deployment.sh
```

The validator checks the repository revision, frontend revision marker, backend environment presence, application services, scheduled automation, backend `/status`, public frontend assets, and backend errors since the current service start.

It writes:

```text
/var/log/wavelab/deployments/<timestamp>_<revision>.report.txt
/var/log/wavelab/deployments/<timestamp>_<revision>.json
/var/lib/wavelab/deployment-status/latest.json
```

The `latest.json` document is intentionally sanitized and world-readable so the unprivileged WaveLab backend can expose it through the permission-protected operational monitoring API. It must never contain secrets, tokens, connection strings, passwords, or raw environment-file content.

## Web monitoring

The existing Pipeline Status admin page reads the sanitized deployment report through the `wave_pipeline.view` capability. The UI is read-only and does not execute shell commands or deployment actions from an HTTP request.

This separation is intentional:

- privileged commands run only through server-side deployment/validation scripts;
- the application API only reads a pre-generated sanitized status file;
- RBAC controls which authenticated users can see the monitoring page.

## Logs and reports

The full deployment command output is written to a timestamped `.deploy.log` under `/var/log/wavelab/deployments`. Validation also produces a concise text report and structured JSON report for operational review.

When diagnosing a deployment, keep the timestamped report with the corresponding Git revision so the exact release state remains auditable.
