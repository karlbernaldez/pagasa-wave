# WaveLab software development life cycle plan

**Status:** Draft  
**Version:** 0.1  
**Lifecycle model:** Controlled iterative development with stage gates

## Principles

- Requirements, code, tests, decisions, releases, and operational evidence must be traceable.
- Forecast-integrity changes receive the highest review and validation priority.
- Software verification and meteorological validation are separate activities.
- No contributor may approve their own operational release when separation of duties is required.
- Security, privacy, accessibility, recovery, and operability are designed and tested throughout the lifecycle.
- Documentation is versioned with the software.
- Urgent changes may use an emergency path, but must receive retrospective review and documentation.

## Lifecycle and gates

| Stage | Required activities | Minimum evidence | Exit authority |
|---|---|---|---|
| Initiation | Confirm purpose, scope, stakeholders, constraints, risk classification | Approved charter and initial risk register | Sponsor and system owner |
| Requirements | Define functional, data, interface, security, operational, and quality requirements | Approved SRS and traceability matrix | Product and operational owners |
| Design | Review architecture, data flows, failure modes, access model, and alternatives | Architecture documents, threat model, ADRs | Technical and security authorities |
| Implementation | Use issues, branches, reviewed PRs, standards, and dependency controls | Linked issue/PR, review, automated checks | Code owner |
| Verification | Test requirements, negative paths, security, performance, recovery, and compatibility | Test reports linked to requirement IDs | QA lead |
| Validation | Conduct forecaster UAT, forecast-product comparison, and operational exercises | Signed UAT and meteorological validation report | Operational forecasting authority |
| Release | Create a versioned release, review changes and risk, approve deployment and fallback | Release record, artifact manifest, approvals | Change/release authority |
| Operations | Monitor, support, audit, patch, back up, restore, and review service health | Dashboards, logs, incident/change records, drills | Service owner |
| Retirement | Export/retain data, revoke access, archive evidence, and decommission safely | Approved retirement and data-disposition record | System and data owners |

A gate may be conditional only when the approving authority records the condition, owner, due date, compensating control, and residual risk.

## Work-item flow

1. Create or approve a requirement with a stable identifier.
2. Create a GitHub issue linked to the requirement and risk, with measurable acceptance criteria.
3. Record an ADR before implementing a significant architecture, data, security, or operational decision.
4. Implement on a short-lived branch.
5. Open a pull request using the repository template.
6. Obtain required code-owner and domain review.
7. Pass required automated and manual verification.
8. Update documentation and the traceability matrix.
9. Merge using the approved branch-protection policy.
10. Include the change in a versioned release with deployment and rollback notes.
11. Collect post-deployment evidence and close the change record.

## Change classification

| Class | Examples | Minimum control |
|---|---|---|
| Standard | Low-risk documentation correction or pre-approved routine maintenance | Issue, review, automated checks where applicable |
| Normal | Feature, defect, dependency, configuration, or operational change | Impact/risk analysis, independent review, tests, release approval |
| Forecast integrity | Valid-time calculation, model input, chart generation, annotation semantics, publish workflow | Domain reviewer, independent reference comparison, regression evidence, explicit release approval |
| Security/privacy | Authentication, authorization, PII, secrets, logging, external integrations | Security/privacy review, negative tests, threat-model update |
| Emergency | Active incident mitigation | Named incident/change authority, minimal safe checks, rollback plan, retrospective within five working days |

## Definition of ready

A work item is ready when it has:

- an owner and requirement or defect identifier;
- clear scope and exclusions;
- measurable acceptance criteria;
- dependencies and data/interface impacts;
- security, privacy, forecast-integrity, and operational impact classification;
- a verification approach; and
- a documentation and rollback impact assessment.

## Definition of done

A change is done only when:

- acceptance criteria pass;
- required code and domain reviews are complete;
- automated checks pass;
- negative and regression tests are recorded;
- affected requirements, architecture, user, API, and operations documents are updated;
- data migration and rollback are demonstrated when applicable;
- monitoring and alerting changes are in place;
- the traceability matrix links the evidence; and
- release notes describe user and operator impact.

## AI-assisted development

AI coding agents and assistants participate under the same lifecycle controls as human contributors and do not replace accountable roles or independent review.

- Repository-root `AGENTS.md` and `CONTRIBUTING.md` are the practical instructions for every task.
- AI output is untrusted draft material and must be understood, reviewed, and tested by a named human.
- Only approved tools and approved data/context may be used.
- Secrets, personal data, restricted operational information, unpublished forecast products, and unsanitized production evidence must not be provided to unapproved AI services.
- Material AI assistance is disclosed in the pull request.
- AI cannot approve/merge its own work, accept risk, sign UAT/domain evidence, deploy, or publish products.
- Generated code, tests, dependencies, calculations, citations, and legal claims require independent verification.
- Critical forecast/time rules require authoritative expected values or approved reference products rather than tests generated from the same implementation assumption.

See the AI-assisted development and engineering quality standards under `docs/operationalization/development/`.

## Repository controls to configure

- Protect `main`; disallow direct and force pushes.
- Require pull requests, resolved conversations, and at least one independent approval.
- Require backend tests, frontend tests, production build, and other approved checks.
- Require CODEOWNERS review for forecast logic, authentication, workflows, deployment, and documentation control files.
- Protect the production environment with required reviewers and prevent self-review where available.
- Use signed or otherwise attributable releases and immutable release artifacts.
- Enable secret, dependency, and code scanning appropriate to the repository and organization.
- Review administrator and deploy permissions at least quarterly.

Repository settings must be verified in GitHub; files in this pull request cannot enforce settings on their own.

## Baselines and records

Baselines include approved requirements, architecture, data schema, deployment configuration, dependencies, test suites, user procedures, and operational runbooks. Every operational release must identify the exact commit, artifact checksum, configuration version, database migration state, known limitations, and approving records.

## Metrics

Track at minimum:

- requirements verified and validated;
- escaped defects and forecast-integrity defects;
- change failure and rollback rate;
- lead time for normal and emergency changes;
- test pass rate and flaky-test rate;
- security findings by severity and remediation age;
- availability and incident duration against approved targets;
- backup success and restore-test results; and
- unresolved operational risks and overdue actions.

## Review cadence

Review this plan at least annually, after a major incident, before a major architecture change, and whenever ownership or operational policy changes.
