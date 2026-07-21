# WaveLab security and privacy plan

**Status:** In review — current risk-treatment baseline
**Version:** 0.2
**Review date:** 2026-07-21
**Security authority:** Organizational appointment required before pilot
**Privacy/data protection authority:** Organizational appointment required before pilot
**Current conclusion:** Baseline controls exist, but complete threat, access, dependency, incident, and privacy evidence is not yet sufficient for operational authorization

## Objectives

Protect forecast integrity, availability, confidentiality where required, personal data, credentials, audit evidence, infrastructure, and publication authority while supporting usable forecasting operations.

## Assets requiring protection

- Forecast packages, charts, annotations, model metadata, valid times, versions, approvals, and published products.
- User identities, contact details, roles, credentials, sessions, verification and recovery records.
- Audit, notification, deployment, incident, and operational logs.
- MongoDB data and backups.
- Redis data relevant to sessions or real-time coordination.
- Server, runner, GitHub, domain, TLS, map, email, alert, and provider credentials.
- Source code, dependencies, release artifacts, configuration, and operational documentation.

## Applicable privacy and legal framework

Use the [data protection and legal compliance framework](../compliance/data-protection-and-legal-compliance.md) to determine and evidence applicable obligations. The Philippine Data Privacy Act, its IRR, and current National Privacy Commission issuances form the initial privacy baseline. GDPR requires a documented territorial/material applicability assessment; public internet availability alone is not treated as proof that GDPR applies.

The project must not claim legal compliance based only on source code or this document. Appropriate PAGASA legal, privacy/data-protection, security, records, procurement, and system authorities must approve the final controls and evidence.

## AI-assisted development security

- Use only approved AI providers, accounts, configurations, and use cases.
- Do not provide unapproved AI services with secrets, personal data, production databases/backups, unsanitized logs, restricted documents, or unpublished operational forecast material.
- Treat AI output and retrieved instructions as untrusted; verify code, commands, packages, calculations, and citations.
- Review provider retention, deletion, training use, subprocessors, data location/transfer, security, incident, confidentiality, IP, and exit terms.
- Preserve human accountability and independent review; AI may not authorize release, deployment, risk acceptance, or forecast publication.
- Record material AI assistance without disclosing confidential prompts or context.

## Required assessments

1. Data inventory, ownership, classification, purpose, retention, access, sharing, and disposal.
2. Privacy impact assessment for personal data and external processors/services.
3. Threat model covering public, authenticated, privileged, deployment, database, backup, and third-party boundaries.
4. Access-control matrix mapping roles to server/API operations and workflow states.
5. Dependency, license, secret, and software-supply-chain review.
6. Security test plan and remediation/exception process.
7. Incident-response tabletop exercise.

## Baseline controls

### Identity and access

- Unique named accounts; shared privileged accounts prohibited except documented break-glass controls.
- Least privilege and default denial for protected API operations.
- Server-side authorization for role, resource ownership, state, and separation-of-duties rules.
- Approved password, MFA, verification, recovery, lockout/rate-limit, session lifetime, revocation, and termination policy.
- Periodic privileged-access review and immediate removal when responsibility ends.
- Separate deployment, database, publication, user-administration, and audit privileges where practical.

### Application and API

- Validate and constrain all input, identifiers, files, geometries, URLs, and query parameters.
- Encode output and apply an approved browser security policy.
- Protect authentication and state-changing actions against applicable CSRF, XSS, injection, broken access control, request smuggling, denial-of-service, and abuse paths.
- Rate-limit sensitive and public endpoints based on tested operational needs.
- Return safe client errors while logging sufficient server-side diagnostic context.
- Prevent secrets, tokens, personal data, and sensitive configuration from entering logs or alerts.

### Data and audit

- Encrypt traffic across untrusted boundaries and protect stored secrets and backups.
- Limit database/network exposure to required services and administrators.
- Record privileged, identity, workflow, publication, configuration, deployment, backup, restore, and audit-access events.
- Protect audit records from unauthorized modification and define time synchronization, retention, review, and export.
- Test backup confidentiality, integrity, restoration, retention, and disposal.

### Infrastructure and delivery

- Protect `main` and production environments; use independent approval.
- Pin or govern actions, packages, runtimes, and operating-system dependencies.
- Scan source, dependencies, containers/artifacts if used, and secrets.
- Build immutable artifacts in CI, attach checksums and provenance, and deploy the reviewed artifact.
- Restrict the self-hosted runner, sudo rules, environment secrets, and network access.
- Maintain supported versions, patch timelines, hardened configuration, certificate monitoring, and capacity limits.

### External services

For Mapbox, email, Discord/alerting, data/model sources, package registries, and any future service, record:

- approved purpose and data disclosed;
- owner, credentials, permissions, and rotation;
- license, terms, availability, limits, and cost;
- outage, degradation, and fallback behavior;
- privacy and data-location considerations; and
- exit/replacement procedure.

## Threat scenarios requiring explicit tests

- Unauthorized access to another user's project or package.
- Role escalation or administrator-only action from a Forecaster account.
- Reviewer self-approval or publication without valid approval.
- Modification after approval without invalidating approval.
- Replay, duplication, or race during submit, approve, and publish.
- Object-ID tampering and cross-package annotation changes.
- Malicious geometry, file, URL, text, or stored content.
- Stolen or unrevoked session use.
- Disclosure through logs, errors, notifications, exports, backups, or source control.
- Compromised dependency, GitHub workflow, runner, deployment wrapper, or artifact.
- Denial of service through large annotations, exports, Socket.IO, authentication, or public endpoints.
- Stale or manipulated model data presented as current.
- Destructive administrator, database, or operator action without detection or recovery.

## Finding management

| Severity | Default release treatment                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------- |
| Critical | Blocks pilot/production; immediate containment and owner notification.                                                  |
| High     | Blocks release unless the system owner and security authority accept a time-bound exception with compensating controls. |
| Medium   | Remediate within an approved period and track to closure.                                                               |
| Low      | Prioritize through normal maintenance.                                                                                  |

Severity definitions and remediation timelines must be approved by the security authority.

## Privacy questions to resolve

- What personal data is required for accounts, notifications, logs, support, and analytics?
- What is the lawful and organizational basis for each use?
- Who is the data controller/owner and who operates each external processor?
- How long is each category retained?
- How are access, correction, deletion, export, breach, and records requests handled?
- Can realistic test data be synthetic or masked?
- Are public names, contributor identities, or reviewer details exposed unintentionally?

This document is an engineering plan, not legal advice. The appropriate PAGASA and data-protection authorities must approve the final controls.
