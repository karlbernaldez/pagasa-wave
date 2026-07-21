# WaveLab stakeholder and RACI baseline

**Status:** Draft  
**Named appointments:** TBD unless explicitly stated

## Role definitions

| Role | Accountability |
|---|---|
| Sponsor | Funds and authorizes the operationalization program and resolves organizational blockers. |
| System owner | Accepts service risk, approves scope, and remains accountable for the system. |
| Product owner | Prioritizes requirements and accepts functional delivery. |
| Operational forecasting authority | Approves forecast workflow, validation method, pilot use, and official operational use. |
| Technical authority | Approves architecture, implementation standards, and technical risk treatment. |
| Development lead | Coordinates design, implementation, review, and technical documentation. |
| QA/validation lead | Maintains verification independence, evidence, traceability, and defect reporting. |
| Security/privacy authority | Reviews security, privacy, access, logging, external services, and residual risk. |
| Service owner | Owns availability, monitoring, incidents, continuity, capacity, and support. |
| Forecaster representative | Provides workflow requirements and performs UAT and domain validation. |
| Change/release authority | Approves release content and deployment timing. |

## RACI matrix

R = Responsible, A = Accountable, C = Consulted, I = Informed.

| Activity | Sponsor | System owner | Product owner | Forecast authority | Technical authority | Development | QA | Security/privacy | Service owner |
|---|---|---|---|---|---|---|---|---|---|
| Approve charter and funding | A | R | C | C | C | I | I | I | I |
| Approve requirements baseline | I | A | R | R | C | C | C | C | C |
| Approve architecture | I | C | C | C | A | R | C | C | C |
| Approve security/privacy risk | I | A | I | C | C | C | C | R | C |
| Implement and review changes | I | I | C | C | A | R | C | C | C |
| Verify software requirements | I | I | C | C | C | C | A/R | C | C |
| Validate forecast products | I | I | C | A/R | C | C | R | I | C |
| Approve release | I | A | C | R | R | C | C | C | R |
| Approve production use | C | A | C | R | C | I | C | C | C |
| Operate and support service | I | A | I | C | C | C | C | C | R |
| Accept residual risk | I | A | C | R | C | I | C | R | C |

## Separation-of-duties rules

- A developer must not be the sole approver of their own operational change.
- A forecaster must not approve their own forecast product where policy requires independent review.
- Production access and publication authority must use named accounts, not shared credentials.
- Security/privacy residual risk requires the system owner and appropriate authority; it cannot be accepted by the developer alone.
- Emergency access and emergency releases must be logged and retrospectively reviewed.

## Appointment record

Replace TBD values only after organizational confirmation.

| Role | Primary | Alternate | Authority reference | Effective date |
|---|---|---|---|---|
| Sponsor | TBD | TBD | TBD | TBD |
| System owner | TBD | TBD | TBD | TBD |
| Product owner | TBD | TBD | TBD | TBD |
| Operational forecasting authority | TBD | TBD | TBD | TBD |
| Technical authority | TBD | TBD | TBD | TBD |
| Development lead | Karl Santiago Bernaldez (proposed) | TBD | TBD | TBD |
| QA/validation lead | TBD | TBD | TBD | TBD |
| Security/privacy authority | TBD | TBD | TBD | TBD |
| Service owner | TBD | TBD | TBD | TBD |
| Change/release authority | TBD | TBD | TBD | TBD |
