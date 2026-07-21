# WaveLab change and release management

**Status:** In review — active R&D change-control baseline
**Version:** 0.2
**Review date:** 2026-07-21
**Current application:** The solo maintainer uses issues, branches, PRs, required CI, self-review, and documented impact; pilot/operational releases require appointed authorities

## Purpose

This procedure ensures that every operational change is authorized, traceable, tested, reversible, and communicated.

## Required change record

Each GitHub issue representing a change must contain:

- requirement, defect, incident, or risk identifier;
- user and operator impact;
- forecast-integrity, security/privacy, data, and availability impact;
- acceptance criteria;
- verification and validation plan;
- migration and compatibility impact;
- monitoring impact;
- rollback or forward-fix plan;
- documentation impact; and
- change owner and intended release.

## Pull-request requirements

A pull request must:

- link the controlling issue and requirement IDs;
- describe behavior and operational impact;
- identify high-risk paths and affected data;
- include test evidence;
- include screenshots or examples when user behavior changes;
- identify migrations, configuration, secrets, and dependency changes;
- provide deployment and rollback notes; and
- receive required code-owner and domain approvals.

## Release contents

An operational release record must include:

- semantic or organization-approved version;
- exact Git commit and immutable artifact checksum;
- release date, window, owner, and approvers;
- included issues and requirements;
- migrations and configuration changes;
- test, UAT, security, restore, and validation evidence;
- known limitations and accepted residual risks;
- deployment, verification, rollback, and communication plans; and
- post-deployment observation results.

## Release gates

No operational deployment may proceed when:

- a required check or approval is missing;
- a critical defect or risk is open;
- forecast-integrity changes lack domain validation;
- a migration lacks recovery evidence;
- backup or rollback readiness is unknown;
- required monitoring is absent;
- the deployed artifact cannot be traced to an approved commit; or
- the operational forecasting or system authority declines release.

## Environments

| Environment   | Purpose                                              | Data                                     | Deployment                                    |
| ------------- | ---------------------------------------------------- | ---------------------------------------- | --------------------------------------------- |
| Development   | Local implementation and automated tests             | Synthetic or approved non-sensitive data | Developer controlled                          |
| Test          | Integrated verification                              | Synthetic or masked data                 | CI controlled                                 |
| Pilot/staging | UAT, validation, training, and operational exercises | Approved representative data             | Release-controlled                            |
| Production    | Authorized operational service                       | Approved operational data                | Independently approved, controlled deployment |

Do not use production as the first place to test behavior, migrations, or configuration.

## Emergency changes

1. Open or reference an incident record.
2. Obtain approval from the emergency change authority.
3. Make the smallest safe change.
4. Preserve backup and rollback readiness.
5. Run minimum critical checks before deployment.
6. Monitor continuously after deployment.
7. Complete full tests, documentation, root-cause review, and normal approval within five working days.

## Post-implementation review

A review is mandatory after emergency changes, rollback, forecast-integrity defects, security incidents, data loss, or significant user impact. Record what happened, detection, response, user impact, corrective actions, owners, and deadlines.
