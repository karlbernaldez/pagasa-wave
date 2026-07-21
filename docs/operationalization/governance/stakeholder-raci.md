# WaveLab stakeholder and RACI baseline

**Status:** In review — interim R&D model documented
**Version:** 0.2
**Review date:** 2026-07-21
**Current repository maintainer/developer:** Karl Santiago Bernaldez
**Organizational appointments:** Required before supervised pilot as recorded below

## Purpose

This document separates work Karl currently performs as the sole developer from authority that only PAGASA-appointed owners and forecasting, security/privacy, quality, service, and release reviewers can exercise. It avoids representing unavailable independent approval as if it already occurs.

## Role accountabilities

| Role | Accountability | Current state |
|---|---|---|
| Project sponsor | Sponsors the operationalization program and resolves organizational blockers. | Appointment required. |
| System owner | Approves scope, accepts service risk, and records pilot/operational decisions. | Appointment required. |
| Product owner | Prioritizes and accepts functional requirements. | Appointment required. |
| Operational forecasting authority | Approves forecast workflow, validation method, supervised pilot, and official use. | Appointment required. |
| Technical authority | Approves architecture, technical standards, and technical risk treatment. | Appointment required. |
| Development lead | Coordinates design, implementation, repository maintenance, review evidence, and technical documentation. | Karl performs this function during R&D; organizational confirmation pending. |
| QA/validation lead | Maintains verification evidence, traceability, defect management, and validation independence. | Appointment required. |
| Security/privacy authority | Reviews access, security, privacy, external services, incidents, and residual risk. | Appointment required. |
| Service owner | Owns service targets, monitoring, incidents, recovery, continuity, capacity, and support. | Appointment required. |
| Forecaster representative | Defines workflow needs and performs UAT/domain validation. | Appointment required. |
| Change/release authority | Approves release scope, deployment timing, and conditions. | Appointment required. |

## Target RACI

R = Responsible, A = Accountable, C = Consulted, I = Informed. The matrix becomes active for pilot/operations after named appointments are approved.

| Activity | Sponsor | System owner | Product owner | Forecast authority | Technical authority | Development | QA | Security/privacy | Service owner |
|---|---|---|---|---|---|---|---|---|---|
| Approve charter/program | A | R | C | C | C | I | I | I | I |
| Approve requirements | I | A | R | R | C | C | C | C | C |
| Approve architecture | I | C | C | C | A | R | C | C | C |
| Approve security/privacy treatment | I | A | I | C | C | C | C | R | C |
| Implement/review changes | I | I | C | C | A | R | C | C | C |
| Verify software requirements | I | I | C | C | C | C | A/R | C | C |
| Validate forecast products | I | I | C | A/R | C | C | R | I | C |
| Approve release content | I | A | C | R | R | C | C | C | R |
| Authorize operational use | C | A | C | R | C | I | C | C | C |
| Operate/support service | I | A | I | C | C | C | C | C | R |
| Accept residual risk | I | A | C | R | C | I | C | R | C |

## Interim solo-maintainer R&D arrangement

Until additional appointments are made:

- Karl is responsible and accountable for implementation and repository maintenance only.
- Normal R&D changes use an issue, focused branch, pull request, required CI, completed checklist, AI disclosure where applicable, and documented human diff self-review.
- CI is independent mechanical evidence, not an independent code, meteorological, security/privacy, legal, or organizational approval.
- High-risk forecast, production, security/privacy, destructive-data, migration, or residual-risk changes remain draft, disabled, isolated, or R&D-only unless the appropriate external/organizational reviewer is available.
- Karl cannot accept PAGASA organizational risk, sign meteorological validation, appoint himself as system authority, or authorize official use by merging or deploying code.
- ADR-0002 governs this interim arrangement.

## Separation of duties

- The developer shall not be the sole organizational approver of an operational release.
- A person shall not approve their own forecast product where approved policy requires independent review.
- Production, publication, repository, server, database, and emergency access shall use named accounts.
- Residual forecast, privacy, security, continuity, and service risk requires the accountable organizational role.
- Emergency actions shall be attributable and retrospectively reviewed.
- AI agents shall not approve, merge, deploy, publish, accept risk, or sign validation evidence.

## Appointment actions before pilot

| Appointment | Minimum required record | Pilot impact if absent |
|---|---|---|
| System owner | Written designation and authority scope | Pilot cannot be authorized. |
| Operational forecasting authority and forecaster representatives | Written designation and validation/publication authority | UAT/domain validation cannot be accepted. |
| Technical authority and additional maintainer | Designation, repository/access handover, demonstrated procedures | Independent technical review and continuity remain inadequate. |
| QA/validation lead | Designation and evidence/defect procedure | Verification/validation acceptance lacks ownership. |
| Security/privacy authority | Designation and assessment/risk process | Security/privacy risks cannot be accepted. |
| Service and change/release owners | Designation, targets, support/escalation, and release authority | Pilot service/deployment cannot be controlled. |

Names, alternates, effective dates, and authority references shall be added after written organizational confirmation. Their absence is tracked as a governance gap, not hidden behind a generic template.
