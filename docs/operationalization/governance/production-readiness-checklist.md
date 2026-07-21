# WaveLab production-readiness review

**Status:** Draft checklist  
**Decision:** Not reviewed  
**Rule:** An unchecked item requires a documented exception, compensating control, owner, due date, and residual-risk acceptance.

## 1. Governance and ownership

- [ ] Charter and scope approved.
- [ ] System, product, forecast, technical, QA, security/privacy, service, and release owners appointed.
- [ ] Operational use and publication authority documented.
- [ ] RACI and separation of duties approved.
- [ ] Risk register reviewed with no unaccepted critical risk.
- [ ] Prototype/pilot/production status communicated accurately.

## 2. Requirements and architecture

- [ ] Functional and nonfunctional requirements approved and baselined.
- [ ] Traceability matrix links mandatory requirements to evidence.
- [ ] Current and target architecture reviewed.
- [ ] Data flows, trust boundaries, external dependencies, and failure modes documented.
- [ ] Significant decisions recorded as ADRs.
- [ ] API and data contracts documented and versioned.
- [ ] Data migration and backward compatibility verified.

## 3. Forecast and product integrity

- [ ] Authoritative sources, model cycles, units, time zones, valid times, and staleness rules approved.
- [ ] Missing, partial, delayed, duplicate, and corrupt-input behavior tested.
- [ ] Chart symbols, annotations, layers, legends, exports, and public views validated.
- [ ] Workflow locking, revision, approval, publishing, and self-review prevention tested.
- [ ] Independent comparison against approved reference products completed.
- [ ] Authorized forecasters sign the meteorological validation report.
- [ ] Manual fallback and correction/withdrawal procedure tested.

## 4. Security and privacy

- [ ] Data classification and privacy assessment completed.
- [ ] Threat model and access-control matrix approved.
- [ ] Unique accounts, least privilege, session controls, and account lifecycle tested.
- [ ] Secrets are outside source control and rotated according to policy.
- [ ] Dependency, code, and secret scans reviewed.
- [ ] Critical/high vulnerabilities resolved or formally accepted.
- [ ] Audit logs capture privileged, review, publication, and configuration actions.
- [ ] External service, map, email, alerting, and model-data risks approved.
- [ ] Security incident contacts and response procedure exercised.

## 5. Quality and acceptance

- [ ] Unit, integration, API, frontend, E2E, negative, regression, accessibility, and compatibility suites meet approved criteria.
- [ ] Performance and capacity tests cover representative forecast cycles.
- [ ] Forecaster and administrator UAT completed with signed results.
- [ ] Defects are triaged and release blockers are closed.
- [ ] Test environments, data, versions, and evidence are reproducible.
- [ ] Training and user/admin documentation are accepted.

## 6. Deployment and recovery

- [ ] Protected branch and production-environment approvals verified.
- [ ] Versioned immutable artifact and manifest used.
- [ ] Environment configuration baseline reviewed.
- [ ] Deployment and smoke tests demonstrated in pilot/staging.
- [ ] Rollback drill completed.
- [ ] Backup monitoring and retention approved.
- [ ] Restore drill meets approved RPO and RTO.
- [ ] Database migration rollback or forward-recovery tested.
- [ ] Server, certificate, dependency, registry, disk, and capacity risks reviewed.

## 7. Operations and support

- [ ] Availability, latency, support hours, RTO, RPO, and retention targets approved.
- [ ] Monitoring covers service health, dependencies, jobs, data freshness, publication, errors, capacity, certificates, and backups.
- [ ] Alerts have owners, severity, acknowledgement, and escalation rules.
- [ ] Incident, communications, status, and escalation procedures tested.
- [ ] On-call/support roster and fallback contacts are current.
- [ ] Maintenance, patch, access review, log review, and restore-test schedules approved.
- [ ] Continuity and manual fallback exercise completed.
- [ ] Knowledge transfer removes single-person dependency.

## 8. Pilot and authorization

- [ ] Supervised parallel operation completed for an approved period.
- [ ] Pilot metrics, defects, user feedback, and corrective actions reviewed.
- [ ] Known limitations and residual risks documented.
- [ ] Operational forecasting authority recommends go/no-go.
- [ ] Security/privacy authority recommends go/no-go.
- [ ] Service and technical owners recommend go/no-go.
- [ ] System owner records final decision, scope, conditions, and effective date.

## Decision record

| Field | Value |
|---|---|
| Candidate release | TBD |
| Review date | TBD |
| Decision | Not reviewed |
| Authorized scope | TBD |
| Conditions/exceptions | TBD |
| Next review | TBD |

| Authority | Name | Decision | Date |
|---|---|---|---|
| System owner | TBD | Pending | TBD |
| Operational forecasting authority | TBD | Pending | TBD |
| Technical authority | TBD | Pending | TBD |
| Security/privacy authority | TBD | Pending | TBD |
| Service owner | TBD | Pending | TBD |
