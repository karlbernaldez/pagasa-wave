# WaveLab service operations plan

**Status:** In review — proposed service-control baseline
**Version:** 0.2
**Review date:** 2026-07-21
**Service owner:** Organizational appointment required before pilot
**Proposed support model:** Named support roster for supervised pilot, with the existing authoritative/manual workflow retained as fallback

## Service definition

WaveLab provides approved users with forecast chart preparation, review, publication, and public presentation capabilities. The final service hours, critical periods, consumers, dependencies, and support commitments require organizational approval.

## Service targets to approve

| Target | Proposed value |
|---|---|
| Service hours and critical forecast windows | Decision required under DEC-016 before pilot. |
| Availability and measurement method | Decision required under DEC-016 before pilot. |
| Save/review/publish/public-view performance | Define representative percentile targets and workload under DEC-016. |
| Incident acknowledgement and restoration targets | Align severity, staffing, fallback, and escalation under DEC-016. |
| Recovery time objective (RTO) | Approve under DEC-015/016, then demonstrate by restore and fallback exercise. |
| Recovery point objective (RPO) | Approve under DEC-015/016, then design backup frequency/retention to meet it. |
| Audit, application, forecast, and backup retention | Decide from operational, records, privacy, incident, and recovery needs. |
| Planned maintenance window and notice | Decide from forecast schedule, fallback, dependency, and staffing constraints. |
| Capacity and growth forecast | Define representative users, cycles, charts, annotations, exports, data volume, and retention before testing. |

Targets must reflect real operational needs, staffing, infrastructure, cost, and fallback capability.

## Operational responsibilities

- Monitor service, dependencies, data freshness, publication, capacity, certificates, jobs, backups, and security signals.
- Triage and communicate incidents using defined severity and escalation.
- Maintain application, OS, runtime, database, Redis, Nginx, certificates, dependencies, and provider integrations.
- Review privileged access, configuration, logs, alerts, storage, and restore readiness.
- Deploy approved releases and verify user-visible health.
- Maintain a manual forecast-production and dissemination fallback.
- Conduct recovery, continuity, security, and knowledge-transfer exercises.

## Monitoring baseline

| Area | Required signals |
|---|---|
| User experience | Public and authenticated route success, critical workflow synthetic checks where safe, latency and error rate |
| Application | API errors, process health/restarts, queue/job failures, Socket.IO/Redis state, export/render failures |
| Forecast integrity | Input arrival, model cycle, valid-time mapping, freshness/age, missing/partial processing, latest authorized publication |
| Data | MongoDB health, connection saturation, storage, replication if used, backup age, restore-test status |
| Infrastructure | CPU, memory, disk/inodes, network, Nginx, systemd, Redis, certificate and domain expiry |
| Security | Authentication abuse, privileged changes, role changes, denied operations, secret/dependency findings |
| Delivery | CI status, deployed commit/artifact, deployment/rollback outcome, configuration version |

Every alert requires a severity, threshold, owner, acknowledgement target, escalation path, runbook, and test schedule. Discord or email alone must not be the sole durable incident record.

## Incident severity baseline

| Severity | Definition | Examples |
|---|---|---|
| SEV-1 | Official-product integrity, security, data loss, or complete critical service failure | Incorrect/unauthorized product, compromise, unrecoverable data, service unavailable during critical window without fallback |
| SEV-2 | Major degradation with significant operational impact | Submit/review/publish unavailable; delayed/stale data with safe fallback |
| SEV-3 | Limited impact with workaround | Noncritical feature unavailable or isolated user issue |
| SEV-4 | Minor request or defect | Cosmetic, documentation, low-impact improvement |

Notification and restoration times remain TBD.

## Incident workflow

1. Detect and open a durable incident record.
2. Assign incident commander and technical/domain leads.
3. Assess user, forecast, data, privacy, and security impact.
4. Protect product integrity: stop publication, mark stale content, withdraw/correct, or invoke fallback when required.
5. Contain and preserve relevant evidence.
6. Communicate status to approved internal and external audiences.
7. Recover using a tested mitigation, rollback, restore, or fallback.
8. Validate application health and forecast-product correctness before returning to service.
9. Record timeline, cause, impact, decisions, evidence, and follow-up actions.
10. Complete a blameless review for SEV-1/2 and track corrective actions.

## Backup and recovery

Existing MongoDB backup and restore runbooks are supporting procedures. Operational authorization additionally requires:

- approved scope, encryption, access, destination, retention, and monitoring;
- successful automated backups and alerting;
- regular restoration into an isolated environment;
- integrity and application-level verification after restore;
- demonstrated RPO/RTO;
- coverage for configuration, audit evidence, keys/certificates, and required file/model metadata; and
- documented behavior for schema changes and incompatible releases.

## Continuity and fallback

The operational forecasting authority must own a fallback procedure that identifies:

- when WaveLab is declared unavailable or unsuitable;
- how authorized staff prepare, review, approve, and disseminate products without it;
- where source data, templates, contacts, and credentials are kept;
- how duplicate or conflicting publications are prevented;
- how work performed during the outage is reconciled/audited later; and
- who authorizes return to WaveLab.

Exercise the fallback before pilot and at an approved recurring interval.

## Routine schedule

| Frequency | Activity |
|---|---|
| Per forecast cycle | Confirm input freshness, critical service health, and current authorized publication |
| Daily | Review critical alerts, backup status, disk/capacity, failed jobs, and unresolved incidents |
| Weekly | Review error trends, dependency/provider health, support backlog, and pending changes |
| Monthly | Test selected alerts/runbooks, review storage/log retention, patch status, and access changes |
| Quarterly | Privileged access review, restore exercise, capacity review, dependency/license review |
| At least annually | Full continuity/DR exercise, security assessment, architecture and operational-readiness review |
| After major change/incident | Targeted recovery, fallback, validation, and documentation review |

## Handover requirements

At least two trained people must be able to perform each critical activity: deploy, rollback, restore, diagnose, manage access, validate inputs/times, publish/correct products, and invoke fallback. Record training, supervised performance, remaining gaps, and access granted.
