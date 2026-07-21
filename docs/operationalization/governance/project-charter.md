# WaveLab operationalization project charter

**Status:** Draft  
**Version:** 0.1  
**Project sponsor:** TBD  
**System owner:** TBD  
**Operational forecasting authority:** TBD  
**Technical lead:** Karl Santiago Bernaldez, pending organizational confirmation

## Purpose

The project will evaluate, harden, validate, document, and govern the existing WaveLab R&D prototype so an authorized PAGASA body can decide whether it is suitable for supervised pilot operation and, later, operational use.

## Problem statement

WaveLab already supports forecast chart creation, annotation, review, approval, and publication. However, its requirements, decisions, validation evidence, security controls, service commitments, and release governance have not yet been assembled into an approved and traceable lifecycle baseline.

## Objectives

- Establish an approved scope and requirements baseline.
- Preserve the productive prototype while reducing operational, scientific, security, and support risk.
- Demonstrate correct software behavior and meteorologically acceptable outputs.
- Establish controlled changes, releases, deployment, rollback, monitoring, backup, and incident handling.
- Produce evidence for an explicit pilot and production go/no-go decision.
- Transfer sufficient knowledge so the service is not dependent on one developer.

## In scope

- WaveLab web frontend, API, authentication, authorization, workflow, persistence, real-time functions, chart rendering, publication, and user administration.
- WW3-related input, tile, valid-time, and visualization integration used by WaveLab.
- Hosting, configuration, secrets, MongoDB, Redis, Nginx, systemd, CI/CD, backups, monitoring, and recovery.
- Forecaster, reviewer, administrator, support, and public forecast-consumer workflows.
- Documentation, testing, validation, security, privacy, training, release, and service management.

## Out of scope unless separately approved

- Scientific modification of WW3 or other upstream numerical models.
- Replacement of PAGASA forecasting policy or forecaster professional judgment.
- Automatic issuance of official warnings without authorized human review.
- Integration with additional authoritative systems not captured by an approved interface requirement.
- Legal or regulatory certification by the development team.

## Deliverables

1. Approved charter, stakeholder roles, SDLC plan, and risk register.
2. Baselined SRS and requirements traceability matrix.
3. Current and target architecture with ADRs.
4. Security, privacy, access-control, and dependency-risk assessments.
5. Verification, UAT, meteorological validation, performance, and recovery evidence.
6. Controlled release, deployment, rollback, incident, backup, and service procedures.
7. Training material and handover evidence.
8. Pilot report and signed production-readiness decision.

## Success criteria

- All mandatory requirements have approved verification evidence.
- No unresolved critical security, data-loss, forecast-integrity, or access-control finding remains.
- Restore and rollback procedures are demonstrated successfully.
- Authorized forecasters complete UAT and meteorological validation.
- Operational ownership, support coverage, escalation, and recovery targets are accepted.
- A designated authority records the go/no-go decision and residual-risk acceptance.

## Constraints and assumptions

- The repository is currently private and the system remains an R&D prototype.
- Named organizational approvers and target service levels are not yet confirmed.
- Existing deployment automation and documentation are inputs, not proof of operational authorization.
- Third-party services, libraries, map data, and model data may introduce licensing, availability, privacy, or continuity dependencies.
- Official use must retain an authorized human review and publication decision unless policy explicitly states otherwise.

## Initial risks

| Risk | Initial rating | Required treatment |
|---|---|---|
| Incorrect chart, valid time, model layer, or published product | Critical | Independent reference comparison, validation rules, audit trail, and authorized human approval. |
| Unauthorized or self-approved publication | Critical | Enforced role matrix, separation of duties, audit tests, and privileged-access review. |
| Data loss or corrupt project history | High | Tested backup/restore, retention, integrity checks, and recovery objectives. |
| Service outage during forecast operations | High | Monitoring, capacity tests, dependency checks, support escalation, and fallback procedure. |
| Prototype configuration used as production configuration | High | Environment inventory, configuration baseline, secret management, and release approval. |
| Single-person operational dependency | High | Documentation, peer review, training, ownership, and handover exercises. |
| Unreviewed dependency or vulnerability | High | Inventory, automated scanning, patch policy, and exception process. |

## Authorization

Approval of this charter authorizes the operationalization work. It does not authorize WaveLab to issue official operational products.

| Role | Name | Decision | Date |
|---|---|---|---|
| Project sponsor | TBD | Pending | TBD |
| System owner | TBD | Pending | TBD |
| Operational forecasting authority | TBD | Pending | TBD |
| Technical authority | TBD | Pending | TBD |
