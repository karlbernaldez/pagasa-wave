# WaveLab test and validation strategy

**Status:** In review — candidate validation baseline
**Version:** 0.2
**Review date:** 2026-07-21
**QA lead:** Appointment required before pilot
**Operational forecasting validation lead:** Appointment required before pilot

## Purpose

Provide reproducible evidence that WaveLab:

1. implements approved software requirements correctly;
2. preserves forecast-product integrity;
3. remains secure, usable, recoverable, and supportable; and
4. is suitable for its specifically authorized operational scope.

Software verification does not substitute for meteorological validation.

## Current evidence and gaps

Current CI runs backend tests, workflow-focused backend tests, frontend tests, a production frontend build, and incremental changed-file quality checks. Recent operationalization and containment PRs passed these mechanical gates. This is useful development evidence but does not demonstrate complete API/E2E/security/performance/recovery/accessibility coverage.

No signed forecaster UAT, approved meteorological comparison report, representative performance report, isolated restore drill, or supervised-pilot report is evidenced in the repository baseline. These remain explicit release blockers rather than blank test placeholders.

## Test levels

| Level | Scope | Typical evidence |
|---|---|---|
| Static quality | Formatting, linting, type/schema checks, dependency and secret scanning | CI reports |
| Unit | Pure rules, valid-time mapping, transformations, validation, authorization helpers | Automated results |
| Component | Frontend behavior, map/view models, review controls, forms | Automated results and snapshots where useful |
| API/integration | Routes, database state, Redis/Socket.IO, authorization, workflow concurrency | Automated results with isolated test data |
| End-to-end | User-critical browser workflows | Automated and manual reports |
| Security | Access control, session, input, abuse, dependency, configuration, infrastructure | Assessment and remediation evidence |
| Performance | Load, latency, memory, export/rendering, package size, concurrent use | Test report against approved targets |
| Recovery | Backup/restore, rollback, dependency outage, restart, data integrity | Drill record |
| UAT | Forecaster, reviewer, publisher, administrator, and operator tasks | Signed scenario results |
| Meteorological validation | Source/cycle/time/units, rendering, comparison with approved reference products | Signed domain-validation report |
| Pilot | Supervised parallel operation and service behavior | Pilot report and metrics |

## Critical automated scenarios

- All allowed and denied workflow state transitions.
- Server-side authorization for every protected operation.
- Self-review and unauthorized publication prevention.
- Cross-user, cross-package, and invalid-ID access attempts.
- Concurrent edit, submit, review, approval, and publication conflicts.
- Changes after submission or approval.
- Complete and incomplete forecast-package submission.
- Valid-time, time-zone, forecast-lead, model-cycle, and chart-type mappings.
- Missing, delayed, stale, duplicate, malformed, and partial model data.
- Annotation save, ordering, locking, deletion, rendering, review, export, and public presentation.
- Public view exposes only the correct authorized current product.
- Session expiry/revocation and role/account changes.
- Database and Redis interruption and recovery behavior.
- Deployment health and rollback of a known-good release.

## Meteorological validation protocol

The operational forecasting authority must approve:

- reference data and independently prepared/reference products;
- representative seasons, weather systems, wave regimes, forecast cycles, and edge cases;
- chart types, symbols, layers, units, thresholds, legends, and geographic extent;
- initialization, lead, issue, and valid-time expectations, including time zone;
- numerical and visual comparison methods and tolerances;
- rules for missing/stale inputs and unacceptable output;
- required reviewers and independence;
- defect severity and retest rules; and
- the minimum successful parallel-operation period.

Each validation case shall record input source/version, cycle, expected product, WaveLab release/configuration, observed product, comparison result, reviewer, date, attachments, defects, and final disposition.

## UAT scenarios

At minimum:

1. Create a complete forecast package and required charts.
2. Prepare annotations through typical and complex workflows.
3. Recover from an interrupted/failed save.
4. Submit, review, comment, request revision, revise, resubmit, approve, and publish.
5. Demonstrate prohibited self-review and prohibited direct publication.
6. Compare versions and confirm audit history.
7. Correct or withdraw an erroneous product using approved procedure.
8. Identify missing, stale, or delayed input.
9. Operate during degraded external map/data/email/alert service.
10. Use the documented manual fallback while WaveLab is unavailable.
11. Administer account activation, role change, suspension, and termination.
12. Operator deploys, monitors, diagnoses, rolls back, restores, and confirms recovery.

## Test data and environments

- Use synthetic or approved masked data except where representative operational inputs are specifically authorized.
- Keep development, test, pilot/staging, and production identities, data, secrets, and services separated.
- Record exact commit, release, dependencies, configuration version, database state, browser/device, data version, and test time.
- Preserve evidence without exposing credentials or unnecessary personal data.

## Entry criteria for pilot validation

- Approved requirements and critical workflows.
- No unresolved critical security or data-integrity defect.
- Test/pilot environment mirrors relevant production characteristics.
- Monitoring, backup, restore, deployment, and rollback are ready.
- Forecasters and operators are trained.
- Manual fallback is documented and available.

## Exit criteria for production recommendation

- All Must requirements verified.
- All forecast-integrity requirements validated by authorized personnel.
- No open critical defect; high defects resolved or formally accepted with controls.
- Performance, recovery, security, UAT, and accessibility targets satisfied.
- Pilot period completed without unresolved release-blocking finding.
- Evidence is linked in the traceability matrix.
- System, forecast, security/privacy, technical, QA, and service authorities record their recommendations.

## Defect severity

| Severity | Example |
|---|---|
| Critical | Wrong or unauthorized published product, incorrect valid time, data loss, security compromise, or no operational fallback. |
| High | Critical workflow unavailable or materially incorrect with a limited workaround. |
| Medium | Noncritical function impaired with a safe workaround. |
| Low | Cosmetic, documentation, or minor usability problem without material operational impact. |
