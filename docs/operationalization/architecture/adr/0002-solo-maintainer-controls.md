# ADR-0002: Interim controls for the solo-maintainer R&D phase

**Status:** Proposed for review  
**Date:** 2026-07-21  
**Current maintainer:** Karl Santiago Bernaldez  
**Related:** CONTRIBUTING.md; AGENTS.md; PR #181; engineering and AI standards  
**Operational authorization impact:** This decision does not permit self-authorization of operational use.

## Context

WaveLab is in a private repository with one current developer/maintainer. Requiring a second code approval for every R&D change would create a control that cannot truthfully be performed. Allowing direct, undocumented changes would remove useful review and traceability evidence.

## Decision

During the declared R&D phase, normal development changes may be integrated by the sole maintainer only after:

1. a focused issue/requirement and acceptance criteria;
2. a short-lived branch and pull request;
3. completed PR impact, risk, test, rollback, documentation, and AI disclosure sections;
4. passing required application and repository quality checks;
5. complete human diff self-review;
6. no unresolved review conversation or failed required check; and
7. clear R&D/prototype classification.

CI is a mechanical gate, not an independent human or domain reviewer.

Forecast-integrity, security/privacy, destructive data, migration, production, residual-risk, meteorological validation, and operational-release decisions require the appropriate external/domain/organizational authority. If unavailable, the change remains draft, disabled, isolated, or R&D-only.

## Consequences

### Positive

- The actual team model is documented honestly.
- Every integrated change retains traceability and automated evidence.
- AI-assisted changes remain human-accountable.
- High-risk organizational decisions cannot be silently converted into developer decisions.

### Risks and treatment

- Self-review can miss defects. Use small PRs, CI, checklists, tests, and external review for high-risk work.
- Single-person continuity remains high risk. Appoint and train additional maintainers before pilot.
- Repository administration and deployment may be concentrated. Inventory access and establish break-glass/transfer procedures.

## Exit criteria

This interim model ends before supervised pilot unless an authorized exception records scope, duration, compensating controls, and residual risk. At least one additional trained maintainer and the required domain/security/service reviewers shall be appointed for pilot and operational release.
