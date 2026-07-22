# ADR-0001: Evolve the existing prototype incrementally

**Status:** Proposed for review
**Date:** 2026-07-21
**Decision owner:** Technical authority, appointment required
**Related:** Project charter; issue #178; SRS; readiness assessment
**Forecast-domain review:** Required for components affecting forecast meaning

## Context

WaveLab already implements substantial chart preparation, annotation, review, publication, deployment, and test behavior. Rebuilding the full system would discard working knowledge and create a period with less regression evidence. The existing prototype also contains technical, security, dependency, validation, and operational gaps.

## Decision drivers

- Preserve useful behavior and domain knowledge.
- Reduce migration and rewrite risk.
- Add regression evidence before changing critical workflows.
- Allow unsafe or unsuitable components to be replaced without coupling that decision to the entire platform.
- Maintain a usable R&D system while operational controls mature.

## Considered options

### Full rewrite

A rewrite could produce a cleaner target design but would recreate every workflow, migration, and edge case before delivering equivalent capability. It increases schedule, validation, and cutover risk unless the existing architecture is proven fundamentally unsuitable.

### Freeze the prototype

Freezing avoids near-term change but preserves known gaps and does not create operational evidence.

### Incremental operationalization

Assess every component as keep, refactor, replace, or validate. Add regression and domain evidence around current behavior, then modernize through small traceable changes.

## Decision

Use incremental operationalization. A full rewrite requires a documented assessment showing that security, maintainability, architecture, supportability, or lifecycle cost cannot be addressed economically and safely through incremental work.

## Consequences

### Positive

- Existing capabilities remain available for R&D and demonstrations.
- Changes can be tested and reviewed in bounded PRs.
- Critical components can be replaced independently.
- Evidence accumulates continuously in the traceability matrix.

### Risks and treatment

- Legacy behavior may be mistaken for an approved requirement. Resolve conflicts using the SRS/authorized decisions.
- Architectural inconsistency may persist temporarily. Record target decisions and removal conditions.
- Incremental gates may cover changed files before the full repository. Maintain a debt baseline and ratchet controls.

## Verification

- Every operationalization issue identifies keep/refactor/replace/validate disposition.
- Critical changes include regression, negative, rollback, and domain evidence.
- Readiness assessments show decreasing unresolved critical/high risk.
- The pilot uses a versioned release with traceable evidence.

## Reconsider when

Reassess if a component cannot be secured, tested, maintained, migrated, or supported within acceptable cost/risk, or if an approved institutional architecture requires replacement.
