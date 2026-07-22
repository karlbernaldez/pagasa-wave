# WaveLab operationalization project charter

**Status:** In review — candidate development baseline
**Version:** 0.2
**Review date:** 2026-07-21
**Project sponsor:** Organizational appointment required before pilot
**System owner:** Organizational appointment required before pilot
**Operational forecasting authority:** Organizational appointment required before pilot
**Development lead:** Karl Santiago Bernaldez for the current R&D phase
**Authorization boundary:** Approval of this charter permits controlled operationalization work only; it does not authorize official forecast issuance.

## Purpose

Evaluate, harden, validate, document, and govern the existing WaveLab R&D prototype so an authorized PAGASA body can decide whether it is suitable for a supervised pilot and, after evidence-based review, operational use.

## Current situation

WaveLab already supports forecast chart preparation, annotation, review, revision, approval, publication, and public presentation. The repository also contains automated tests, CI quality controls, AlmaLinux deployment/rollback automation, and staged recovery guidance.

The system remains a prototype because organizational authority, complete requirements evidence, meteorological validation, security/privacy assessment, recovery demonstration, service targets, and supervised-pilot evidence are not yet established. The project will close these gaps incrementally while preserving useful existing behavior.

## Objectives

- Establish an approved and traceable requirements, architecture, risk, validation, and operations baseline.
- Assess existing components as keep, refactor, replace, or validate; avoid a rewrite unless evidence justifies it.
- Protect forecast source, cycle, lead, valid time, time zone, units, freshness, rendering, review, and publication integrity.
- Establish secure, maintainable development practices for human and AI-assisted work.
- Demonstrate deployment, rollback, backup, restore, monitoring, incident response, and manual fallback.
- Complete forecaster UAT, independent meteorological comparison, and supervised parallel operation.
- Reduce dependence on one developer through documentation, additional appointments, training, and handover.
- Produce a release-specific go/no-go record with residual risks and conditions.

## Scope

### Core in scope

- React/Vite frontend, Express API, MongoDB persistence, Redis/Socket.IO integration, authentication, authorization, administration, and public interfaces.
- Forecast packages/projects, Studio annotations, review/revision/approval/publish states, exports, and public products.
- WW3/model data preparation, tiles, metadata, valid-time mapping, visualization, and failure handling used by WaveLab.
- Nginx, systemd, AlmaLinux, GitHub Actions, environment configuration, secrets, logging, deployment, rollback, backup, restore, monitoring, and recovery.
- Forecaster, reviewer/approver, publisher, administrator, operator, auditor, and public-user workflows.
- Requirements, architecture, testing, validation, security, privacy, licensing, training, release, service management, and operational evidence.

### Explicitly non-core or excluded

- Chatbot/RAG is experimental, disabled by default in the proposed containment change, and excluded from the core operationalization path.
- Scientific modification of WW3 or another upstream numerical model.
- Replacement of PAGASA forecasting policy or professional forecaster judgment.
- Autonomous AI approval, publication, correction, or withdrawal of official products.
- Automatic official warning issuance without an authorized human decision.
- Additional authoritative-system integration without an approved interface requirement and owner.
- A claim of legal certification or compliance made by the development team.

## Delivery strategy

The project will use controlled iterative development with stage gates:

1. Baseline scope, requirements, architecture, risks, and decisions.
2. Stabilize critical security, dependency, data, audit, and forecast-integrity behavior.
3. Establish staging/pilot, contracts, E2E tests, performance evidence, and recovery.
4. Conduct authorized forecaster UAT and meteorological validation.
5. Run supervised parallel operation with the existing authoritative workflow retained.
6. Conduct a release-specific readiness review.
7. Authorize, conditionally authorize, or decline operational use.

ADR-0001 records the decision to modernize incrementally rather than rebuild from scratch.

## Deliverables and acceptance evidence

| Deliverable                       | Acceptance evidence                                                                                                                       |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Governance baseline               | Approved charter, SDLC, RACI appointments, risk/decision records, and change process.                                                     |
| Requirements baseline             | Reviewed SRS with priorities, stable IDs, and traceability to implementation/test/validation evidence.                                    |
| Architecture baseline             | Current/target views, data/trust flows, interface contracts, and approved ADRs.                                                           |
| Security/privacy/legal assessment | Threat/access model, data inventory, dependency/SBOM/license review, provider decisions, and remediation/exception records.               |
| Software verification             | Reproducible unit, integration, frontend, API, E2E, security, performance, accessibility, and recovery evidence.                          |
| Forecast validation               | Approved cases, independent references, tolerances, representative cycles, defect disposition, and authorized signatures.                 |
| Service readiness                 | Staging evidence, immutable release, deployment/rollback, monitoring, incident, backup/restore, fallback, targets, and support ownership. |
| Handover                          | Additional trained personnel, controlled access, training record, and demonstrated critical procedures.                                   |
| Pilot and decision                | Pilot report, metrics, known limitations, residual risks, and release-specific go/no-go record.                                           |

## Success criteria

- All Must requirements have reproducible verification evidence; forecast-integrity requirements also have authorized validation evidence.
- No unresolved critical security, privacy, access-control, data-loss, licensing, or forecast-integrity risk remains.
- The approved release can be deployed, smoke-tested, rolled back, backed up, restored, and operated within approved targets.
- Authorized users complete UAT and the forecasting authority accepts the meteorological validation report.
- Monitoring, incident escalation, manual fallback, service ownership, and support coverage are demonstrated.
- At least one additional trained person can perform each critical development/operational responsibility.
- A designated system owner records the final pilot or operational decision, scope, conditions, risks, release, environment, and effective date.

## Constraints and assumptions

- The repository is private and maintained by one developer during the current R&D phase.
- CI and documented self-review provide mechanical and development evidence, not independent organizational/domain approval.
- Named organizational authorities and numeric service targets are open decisions listed in the decision register.
- Existing code and tests describe current behavior but do not automatically define the approved requirement.
- Official use retains authorized human review and publication unless an approved PAGASA policy explicitly changes that rule.
- Third-party packages, maps, fonts, services, and data introduce security, licensing, privacy, continuity, and availability dependencies.
- Production deployment of a prototype does not change its authorization status.

## Initial risk position

| Risk                                       | Rating                    | Current position            | Required treatment                                                                                                       |
| ------------------------------------------ | ------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Incorrect or misleading chart/product      | Critical                  | Operationally unacceptable  | Independent reference validation, explicit provenance/time/unit rules, audit, and authorized human approval.             |
| Unauthorized review/publication            | Critical                  | Operationally unacceptable  | Server enforcement, separation of duties, negative tests, immutable history, and access review.                          |
| Data loss or unrecoverable history         | High                      | Not yet demonstrated        | Approved RPO/RTO, encrypted backup, isolated restore, integrity checks, and fallback.                                    |
| Known vulnerable dependency                | High/Critical by finding  | Open remediation work       | Remove/upgrade/isolate or authorize a time-bound exception; no critical baseline acceptance.                             |
| Service outage during forecast work        | High                      | Service targets unapproved  | Monitoring, capacity, incident escalation, fallback, and recovery exercises.                                             |
| Prototype configuration used operationally | High                      | Possible without governance | Environment separation, configuration baseline, release control, and visible prototype designation.                      |
| Single-person dependency                   | High                      | Confirmed                   | Additional appointments, training, access handover, runbooks, and supervised procedure performance.                      |
| Unapproved personal-data or provider use   | High                      | Assessment incomplete       | Data inventory, purpose/basis/retention, provider review, security controls, and authorized privacy/legal determination. |
| Licensing conflict                         | High for transfer/release | MIT/ISC conflict identified | Resolve component/project license and third-party rights before pilot artifact approval.                                 |

## Review decision requested

Reviewers are asked to approve, approve with conditions, revise, or reject this charter as the development and operationalization baseline. Appointments and numeric targets are decided in the [decision register](decision-register.md); they are not left as undocumented placeholders.

Approval does not authorize pilot or operational use. Those decisions occur at later release-specific gates.
