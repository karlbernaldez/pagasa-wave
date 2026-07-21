# WaveLab Software Requirements Specification

**Status:** Draft initial baseline  
**Version:** 0.1  
**Source:** Existing repository behavior, README, user manual, workflows, and operationalization assessment  
**Approval:** Pending stakeholder review

## 1. Purpose and system context

WaveLab is a web-based marine forecast operations platform for preparing, annotating, reviewing, approving, publishing, and displaying forecast chart products. This SRS records an initial baseline; it does not claim that current code satisfies every requirement.

## 2. User classes

- **Forecaster:** prepares and revises forecast packages and charts.
- **Reviewer/Approver:** independently reviews work and requests revision or approval.
- **Publisher:** authorizes an approved package for public release.
- **Administrator:** manages users, roles, settings, and operational administration.
- **Public user:** views authorized published products.
- **Service operator:** monitors, deploys, recovers, and supports the service.
- **Auditor:** reviews activity, access, release, and publication evidence.

Combining roles is permitted only when approved policy preserves required separation of duties.

## 3. Assumptions and dependencies

The service depends on approved model and observational data, Mapbox or configured map services, MongoDB, Redis, email/notification services, the hosting platform, network connectivity, and supported browsers. Each external dependency requires an owner, approved use, failure behavior, and continuity assessment.

## 4. Functional requirements

### Identity and access

- **FR-AUTH-001:** The system shall authenticate users using unique identities before granting non-public access.
- **FR-AUTH-002:** The system shall authorize every protected server operation by assigned role and resource state; client-side controls alone are insufficient.
- **FR-AUTH-003:** The system shall support account creation, verification, activation, suspension, role change, credential recovery, and termination under approved policy.
- **FR-AUTH-004:** The system shall prevent a reviewer from approving their own work when separation of duties applies.
- **FR-AUTH-005:** The system shall expire, revoke, and audit sessions according to approved security requirements.

### Forecast package and chart management

- **FR-PKG-001:** The system shall create a forecast package for an approved forecast cycle with a unique identifier.
- **FR-PKG-002:** The system shall create and enforce the required chart types for an operational package.
- **FR-PKG-003:** The system shall validate package completeness before submission.
- **FR-PKG-004:** The system shall preserve project, package, chart, annotation, version, owner, and timestamp relationships.
- **FR-PKG-005:** The system shall reject invalid identifiers, unauthorized cross-project changes, and inconsistent package/chart relationships.
- **FR-PKG-006:** The system shall provide an approved migration and rollback path for legacy project records.

### Studio and annotations

- **FR-STD-001:** The system shall allow authorized forecasters to create, edit, order, lock, hide, and remove supported annotations while the chart is editable.
- **FR-STD-002:** The system shall preserve annotation geometry, style, type, layer/source identity, order, and relevant metadata.
- **FR-STD-003:** The system shall prevent modification of submitted, under-review, approved, published, or archived content except through an authorized revision or correction workflow.
- **FR-STD-004:** The system shall warn users of unsaved work and shall report save failures clearly.
- **FR-STD-005:** The system shall render the same approved semantic content in Studio, review, export, and public views within approved tolerances.

### Data and time integrity

- **FR-DAT-001:** The system shall record source, model cycle, initialization time, forecast lead, valid time, time zone, units, processing version, and ingestion time for operational data.
- **FR-DAT-002:** The system shall validate and visibly report missing, partial, delayed, stale, duplicate, or corrupt inputs.
- **FR-DAT-003:** The system shall not silently substitute or publish stale or incomplete data.
- **FR-DAT-004:** The system shall apply approved mappings between model output, chart type, forecast lead, and displayed valid time.
- **FR-DAT-005:** The system shall preserve enough provenance to reproduce or explain a published product.

### Review and publication

- **FR-WFL-001:** The system shall enforce approved state transitions for Draft, Submitted, Under Review, Revision Requested, Approved, Rejected, Published, and Archived states.
- **FR-WFL-002:** The system shall record immutable, attributable history for submissions, comments, revisions, approvals, rejections, publications, corrections, and withdrawals.
- **FR-WFL-003:** The system shall require remarks for revision and rejection actions.
- **FR-WFL-004:** The system shall allow authorized reviewers to compare the submitted version with the relevant prior version.
- **FR-WFL-005:** The system shall permit publication only for a complete, approved, unmodified package.
- **FR-WFL-006:** Any change after approval shall invalidate approval or use a separately approved correction workflow.
- **FR-WFL-007:** The system shall support withdrawal or correction of an erroneous published product while preserving audit history.

### Public presentation

- **FR-PUB-001:** The public interface shall display only authorized published products.
- **FR-PUB-002:** The public interface shall identify product type, issue time, valid time, time zone, source, and freshness.
- **FR-PUB-003:** The public interface shall not present an incomplete or superseded product as current.
- **FR-PUB-004:** Exported products shall contain approved identification, timestamp, legend, and provenance information.

### Administration and audit

- **FR-ADM-001:** Privileged actions shall require an authorized role and shall be auditable.
- **FR-ADM-002:** Audit records shall identify actor, action, target, result, timestamp, and relevant prior/new state.
- **FR-ADM-003:** Authorized auditors shall be able to retrieve records without modifying them.
- **FR-ADM-004:** Security, audit, and publication evidence shall follow approved retention and integrity requirements.

### Service operations

- **FR-OPS-001:** The system shall expose authenticated or safely limited health signals for application and critical dependencies.
- **FR-OPS-002:** Operators shall be able to deploy and roll back an approved application release through a controlled procedure.
- **FR-OPS-003:** Operators shall be able to back up and restore required data and verify restoration.
- **FR-OPS-004:** The service shall alert assigned personnel about approved critical failure, freshness, security, backup, capacity, and publication conditions.
- **FR-OPS-005:** The service shall provide a documented manual fallback when WaveLab is unavailable or unsuitable.

## 5. Nonfunctional requirements

Numeric targets remain TBD until approved by the accountable owners.

- **NFR-AVL-001:** Approved availability target, maintenance windows, and measurement method shall be defined.
- **NFR-REC-001:** Recovery time objective and recovery point objective shall be approved and demonstrated.
- **NFR-PER-001:** Representative save, load, review, publish, and public-view response targets shall be defined and load-tested.
- **NFR-CAP-001:** Capacity shall cover approved concurrent users, package sizes, annotations, model cycles, exports, and retention.
- **NFR-SEC-001:** The service shall use least privilege, secure transport, protected secrets, input validation, rate limiting, secure logging, and supported dependencies.
- **NFR-PRV-001:** Personal data shall be minimized, classified, retained, accessed, and disclosed only under approved purposes and policy.
- **NFR-AUD-001:** Operationally significant actions shall be attributable and protected against unauthorized alteration.
- **NFR-USA-001:** Target users shall complete critical workflows in UAT without unresolved critical usability defects.
- **NFR-ACC-001:** Applicable public and internal interfaces shall meet an approved accessibility target.
- **NFR-CMP-001:** Supported browser, device, operating system, Node.js, MongoDB, Redis, Nginx, and AlmaLinux versions shall be published.
- **NFR-MNT-001:** Source, tests, configuration, architecture, interfaces, dependencies, and runbooks shall be maintainable by more than one trained person.
- **NFR-OBS-001:** Logs, metrics, traces or equivalent diagnostics shall support detection and investigation without exposing secrets or unnecessary personal data.
- **NFR-INT-001:** Published product, audit, configuration, and backup integrity shall be verifiable.
- **NFR-LIC-001:** Software, data, fonts, symbols, maps, and third-party service licenses shall be reviewed for operational use.

## 6. Interface requirements

Each API route and event shall be documented with authentication, authorization, input/output schema, validation, errors, idempotency, rate limits, audit behavior, and versioning. Socket.IO events, model/tile inputs, email/alert integrations, public endpoints, and deployment health endpoints are included.

An OpenAPI or equivalent machine-readable API contract is a required operationalization deliverable.

## 7. Data requirements

The data catalogue shall identify ownership, classification, schema, relationships, source, retention, backup, integrity, migration, archival, and deletion rules for users, sessions/tokens, packages, charts/projects, annotations, reviews, notifications, settings, audit events, published products, model metadata, files, and operational logs.

## 8. Acceptance

A requirement is accepted only when the traceability matrix links it to approved implementation and reproducible verification evidence. Forecast-related requirements also require authorized domain validation.
