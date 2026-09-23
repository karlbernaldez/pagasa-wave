# WaveLab engineering quality standard

**Status:** In review — active R&D engineering baseline
**Version:** 0.2
**Applies to:** Application, tests, scripts, deployment, data processing, and documentation
**Technical authority:** Organizational appointment required before pilot; Karl Santiago Bernaldez applies the standard during R&D

## Quality objectives

WaveLab code shall be understandable, testable, secure, observable, maintainable by more than one person, and safe for approved forecasting workflows. “Clean code” means code that makes domain behavior and failure modes explicit—not merely code that looks tidy.

## Design rules

- Keep modules cohesive and dependencies explicit.
- Separate transport/UI concerns, domain rules, persistence, and external integrations.
- Keep controllers thin: validate/authorize, call a domain/service operation, and translate the result.
- Keep forecast/time/unit/freshness calculations in pure or isolated functions with authoritative tests.
- Prefer composition and clear interfaces over deep inheritance or global mutable state.
- Remove duplication when the duplicated concept is stable; do not force unrelated behavior into a premature abstraction.
- Use names that reflect forecast and workflow meaning.
- Keep functions and components small enough to understand and test, without arbitrary line-count targets.
- Document why a non-obvious decision exists; code should show what it does.
- Record significant architecture, data, security, publication, and operational decisions as ADRs.

## Domain and data integrity

- Persist and validate source, model cycle, initialization time, lead, valid time, issue time, time zone, units, freshness, and processing version.
- Use explicit enums/configuration for operational chart types and workflow states.
- Validate identifiers and package/chart relationships at trust boundaries.
- Make write operations safe under retries and concurrency where applicable.
- Preserve immutable submitted/approved/published snapshots and audit events.
- Version schemas and data migrations; provide tested rollback or forward-recovery.
- Do not silently coerce invalid forecast/time/unit values.
- Treat missing, partial, stale, duplicate, and corrupt inputs as modeled states with safe behavior.

## Backend standard

- Validate request shape, type, length, format, and identifiers before business processing.
- Enforce authentication, authorization, ownership, role, and workflow state in server-side middleware/services.
- Use consistent structured errors and HTTP status semantics.
- Do not leak stack traces, internal paths, secrets, or personal data to clients.
- Use bounded queries, pagination, indexes for operational paths, and explicit projections where appropriate.
- Define transaction/compensation behavior for multi-record operations.
- Place external service access behind adapters with timeouts, error mapping, and test doubles.
- Use structured logs with correlation context and data-minimization rules.

## Frontend standard

- Organize by feature/domain and reuse shared components intentionally.
- Keep server state, local UI state, and persisted domain state distinct.
- Provide loading, empty, success, validation, partial-data, stale-data, and failure states.
- Prevent accidental duplicate submissions while relying on server enforcement for correctness.
- Ensure keyboard access, focus behavior, labels, contrast, responsive layout, and error announcements for critical workflows.
- Avoid storing sensitive tokens or authoritative workflow state in unsafe browser storage.
- Clean up Mapbox/Konva/Socket.IO listeners, sources, layers, timers, and resources.
- Test critical behavior by accessible role/label and user outcome rather than implementation detail.

## Dependencies and supply chain

- Backend uses npm and `backend/package-lock.json`.
- Frontend uses npm and `frontend/package-lock.json`; competing frontend lockfiles are prohibited.
- New dependencies require a documented need, alternatives considered, maintenance status, license, security history, package integrity, size/runtime impact, and removal/rollback plan.
- Pin/goven CI actions and runtime versions under an approved update policy.
- Generate an inventory/SBOM for release artifacts when the release process supports it.
- Review unsupported, unmaintained, deprecated, Git-based, or high-risk dependencies.

## Error handling and observability

- Fail safely and visibly; never convert critical errors into apparent success.
- Give users actionable messages without disclosing sensitive internals.
- Log operational context needed to investigate while minimizing personal data.
- Propagate correlation identifiers across API and relevant job/event boundaries.
- Monitor error rate, latency, critical jobs, data freshness, publication, dependencies, capacity, backups, and deployed version.
- Every critical alert requires an owner and runbook.

## Testing rules

- Every defect fix includes a regression test unless a documented exception is approved.
- Test public behavior and critical invariants, not private implementation structure.
- Cover success, validation, authorization, ownership, invalid state, concurrency, dependency failure, stale/missing data, and recovery.
- Use independent reference values for forecast/time calculations.
- Keep tests deterministic, isolated, readable, and free of production credentials/data.
- Do not over-mock the behavior being proven.
- Coverage is a diagnostic, not the acceptance criterion. Establish a baseline and ratchet critical-path coverage; do not adopt an arbitrary percentage as proof of quality.
- A test may be skipped only with a tracked reason, owner, and removal date.

## Current incremental quality baseline

Implementation is tracked in [issue #179](https://github.com/karlbernaldez/pagasa-wave/issues/179) and introduced by [PR #181](https://github.com/karlbernaldez/pagasa-wave/pull/181).

The incremental quality baseline checks new and changed files so the legacy repository can improve without a repository-wide formatting/refactoring change. It provides pinned root ESLint/Prettier tooling, repository hygiene checks, selected high-confidence secret patterns, changed JSON and Markdown-link checks, Git whitespace validation, frontend/backend npm lockfile policy, pull-request dependency review, and CodeQL JavaScript/TypeScript analysis.

The root commands are:

```bash
npm ci --ignore-scripts
npm run quality
```

Warnings and known historical debt should be ratcheted deliberately. A passing incremental check does not prove the untouched legacy codebase is fully compliant with this standard.

## Automated quality gates to introduce

The current repository tests, build, and incremental quality workflow remain required. Add the remaining controls through separately reviewed work:

1. Full YAML and GitHub issue-form/configuration validation beyond GitHub's workflow parser.
2. Repository-wide secret scanning. Dependency review is enforced for pull requests.
3. Expand static application security analysis as needed beyond the CodeQL JavaScript/TypeScript baseline.
4. Test coverage reporting focused on critical modules.
5. API and Socket.IO contract validation.
6. License and dependency inventory/SBOM.
7. End-to-end tests for critical workflows.
8. Incremental lint/format rule ratcheting and an approved legacy-debt baseline.

The quality gate must be introduced incrementally: record the baseline, fix high-risk findings, prevent new violations, then ratchet expectations.

## Review checklist

Reviewers check:

- requirement and behavior correctness;
- forecast/time/unit/freshness integrity;
- server-side access and state enforcement;
- failure, concurrency, data, migration, and rollback behavior;
- privacy, logging, secret, and external-service impact;
- focused design and removal of unnecessary complexity;
- meaningful tests and independent expected results;
- user accessibility and operational observability;
- dependency/license changes;
- updated documentation, ADRs, and traceability; and
- absence of unrelated generated or formatting churn.

## Technical debt

Track debt as an issue with affected requirement/risk, impact, evidence, proposed treatment, owner, and target. “Temporary” code without a tracked removal condition is permanent risk.
