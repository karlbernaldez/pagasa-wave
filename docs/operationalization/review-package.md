# WaveLab operationalization reviewer package

**Status:** In review
**Version:** 0.2
**Prepared:** 2026-07-21
**Prepared by:** Karl Santiago Bernaldez, sole developer and repository maintainer
**System classification:** R&D prototype — not authorized for official operational forecast issuance
**Repository baseline:** `karlbernaldez/pagasa-wave`, `main` commit `ab6d8d5`

## 1. Review purpose

This package asks reviewers to evaluate whether the documented WaveLab scope, lifecycle, requirements, architecture, risk controls, and validation plan are an acceptable baseline for continued development toward a supervised pilot.

This is not a request to authorize operational use. The current recommendation is:

> Continue controlled R&D development. Do not authorize official operational use until the release blockers in this package have objective evidence and authorized acceptance.

## 2. System under review

WaveLab is a web-based marine forecast chart platform. Its demonstrated repository scope includes:

- a React/Vite web client for public, Forecaster, and Admin experiences;
- an Express API with MongoDB persistence;
- authentication, role-aware protected functions, project/package workflows, and review history;
- a Mapbox/Konva Studio for chart preparation and annotation;
- review, revision, approval, publishing, export, and public-product views;
- Socket.IO with Redis support for real-time functions;
- AlmaLinux deployment automation using Nginx and systemd;
- backend tests, frontend tests/build validation, and incremental repository quality gates; and
- deployment, rollback, troubleshooting, user, and staged database-recovery documentation.

The chatbot/RAG capability is experimental and outside the core operationalization scope. Draft PR [#185](https://github.com/karlbernaldez/pagasa-wave/pull/185) proposes explicit opt-in backend/frontend flags so normal core deployments do not expose or initialize it.

## 3. Evidence reviewed

This candidate baseline is derived from:

- repository README, user manual, contributor and AI-agent instructions;
- application source and package manifests;
- backend workflow tests and frontend tests/build;
- GitHub CI and incremental quality-gate configuration;
- AlmaLinux deployment and rollback automation;
- production deployment and MongoDB backup/restore runbooks;
- issues [#178](https://github.com/karlbernaldez/pagasa-wave/issues/178), [#179](https://github.com/karlbernaldez/pagasa-wave/issues/179), [#180](https://github.com/karlbernaldez/pagasa-wave/issues/180), [#182](https://github.com/karlbernaldez/pagasa-wave/issues/182), and [#184](https://github.com/karlbernaldez/pagasa-wave/issues/184); and
- merged PRs [#177](https://github.com/karlbernaldez/pagasa-wave/pull/177) and [#181](https://github.com/karlbernaldez/pagasa-wave/pull/181).

Automated tests establish software evidence only. They do not establish meteorological correctness, policy approval, legal compliance, or production readiness.

## 4. Current control assessment

| Area | Current assessment | Evidence or finding | Disposition |
|---|---|---|---|
| Lifecycle governance | Partially evidenced | SDLC, charter, RACI, PR template, agent instructions, and change controls exist. Organizational authorities are not appointed. | Accept for R&D; appointment required before pilot. |
| Development quality | Partially evidenced | Backend/frontend CI and changed-file quality gates pass on recent PRs. Legacy code is not yet fully covered by lint, format, security, contract, or E2E gates. | Continue incremental ratcheting under issue #179. |
| Requirements | Partially evidenced | Candidate SRS and traceability IDs exist; many requirements lack implementation or validation evidence. | Review and baseline for development, then close evidence gaps. |
| Forecast integrity | Gap for operational use | Workflow tests exist, but authoritative valid-time, source, unit, rendering, and reference-product validation is not signed. | Release blocker; require authorized forecaster validation. |
| Security | Gap for operational use | Baseline controls exist, but dependency and frontend findings remain and a complete threat/access review is not approved. | Remediate and assess before pilot. |
| Privacy/legal | Gap for operational use | DPA/GDPR applicability framework exists; data inventory, processing basis, retention, provider, and license decisions are incomplete. | Complete issue #180 before pilot use of personal data. |
| Deployment | Partially evidenced | Automated validation, AlmaLinux deployment, smoke checks, and rollback procedures exist. Immutable artifact and staging/pilot evidence are incomplete. | Demonstrate in controlled staging before pilot. |
| Recovery | Gap for operational use | Runbook and read-only inspection script exist; scheduled backup and isolated restore evidence do not. | Release blocker; complete supervised backup/restore exercise. |
| Operations | Gap for operational use | Proposed monitoring and incident controls exist; owners, service targets, on-call coverage, and exercised fallback are not approved. | Decide and test before pilot. |
| Human resources | High continuity risk | Karl is the sole developer/maintainer. Documentation and CI reduce risk but do not provide independent technical/domain coverage. | Appoint/train additional maintainers and reviewers before operations. |

## 5. Principal risks

1. **Forecast-product integrity:** incorrect source, model cycle, lead, valid time, unit, layer, annotation, export, or publication may appear authoritative.
2. **Unauthorized publication:** role or state-control defects may permit invalid review or publication.
3. **Unresolved supply-chain exposure:** installed backend/frontend dependencies include known remediation work.
4. **Data loss and recovery uncertainty:** restoration has not been demonstrated against approved RPO/RTO.
5. **Single-person dependency:** development, deployment knowledge, and repository administration are concentrated in one person.
6. **Unapproved privacy and legal position:** data categories, retention, processing basis, service-provider use, and licensing require formal assessment.
7. **Prototype-to-production drift:** a deployed prototype may be mistaken for an authorized operational system.

## 6. Requested reviewer decisions

Reviewers should decide the items in the [decision register](governance/decision-register.md). The immediate decisions are:

- accept or revise the charter and R&D-to-pilot scope;
- accept incremental operationalization rather than a rewrite;
- approve the interim solo-maintainer development controls;
- confirm that chatbot/RAG remains experimental and disabled by default;
- nominate organizational authorities and reviewers;
- select the target pilot mode and entry criteria;
- approve the validation protocol owner and evidence method;
- approve privacy, data-classification, external-service, and license assessment ownership; and
- select service, recovery, retention, and release targets before pilot.

## 7. Release blockers for any operational authorization

WaveLab remains no-go for official operational use until all of the following are evidenced or formally accepted by an authorized role:

- approved owners, RACI, scope, requirements, and release authority;
- no unresolved critical security, forecast-integrity, access-control, or data-loss issue;
- dependency, secret, static security, access-control, and privacy assessments completed;
- authoritative meteorological comparison and forecaster UAT signed;
- complete auditability for privileged workflow and publication actions;
- controlled staging/pilot environment separated from development and production;
- performance/capacity evidence against approved targets;
- backup, isolated restore, rollback, and manual fallback exercises completed;
- monitoring, alert ownership, incident escalation, and service support in place;
- supervised parallel pilot completed with defects and residual risks reviewed; and
- written go/no-go decision by the authorized system and forecasting authorities.

## 8. Review outcomes

A reviewer may record one of four outcomes for each controlled document or decision:

- **Approve:** acceptable as written for the stated R&D/development baseline.
- **Approve with conditions:** acceptable when named conditions, owners, and due dates are recorded.
- **Revise:** specific changes are required before approval.
- **Reject/defer:** the proposal is not accepted or is premature; rationale and next review trigger are recorded.

Approval of this package authorizes continued controlled development only. Operational authorization requires a later readiness review tied to a specific release, environment, scope, evidence set, and effective date.
