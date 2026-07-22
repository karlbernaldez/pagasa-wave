# ADR-0003: Keep the experimental chatbot outside the core operational boundary

**Status:** Proposed; not implemented — PR #185 was closed without merge
**Date:** 2026-07-21
**Related:** Issues #182 and #184; closed-unmerged PRs #183 and #185
**Security/privacy review:** Required before any enabled environment
**Forecast-domain review:** Not required for containment; required if future output affects forecast decisions

## Context

WaveLab contains an experimental chatbot/RAG feature with provider, retrieval, embedding, and public-widget code. The feature is not a priority for core forecast operations. Its dependencies and external-processing implications increase security, privacy, supply-chain, startup, and support scope even when the feature is not intentionally used.

PR #185 attempted to implement the containment described below, but it was closed without merge. On the current `main` branch, the chatbot remains mounted in the backend and rendered by the public frontend by default. The controls in this ADR therefore describe a proposed boundary, not current runtime behavior; issue #184 remains the implementation tracker.

## Considered options

### Continue loading and exposing it by default

Rejected because an experimental, non-priority surface would remain part of the default application boundary.

### Remove it immediately

Potentially appropriate later, but immediate removal could mix broad cleanup with core operationalization and discard R&D work before a product decision.

### Disable and avoid loading by default

Contain the feature behind exact opt-in backend and frontend flags, avoid loading routes/providers/widget in normal startup, and keep removal or service/package isolation tracked separately.

## Decision

Propose disabled-by-default containment:

- backend chat routes return unavailable unless `WAVELAB_CHAT_ENABLED=true`;
- chatbot controllers/providers/model stack load only after the backend flag is enabled;
- public widget is absent and not loaded unless `VITE_WAVELAB_CHAT_ENABLED=true`;
- both flags remain absent or false in core development, pilot, and operational configurations unless a separate approved experiment permits them;
- enabling the feature does not authorize operational use or the processing of personal/restricted data; and
- vulnerable installed dependencies must still be removed, upgraded, or isolated before an operational artifact is approved.

## Consequences

### Positive

- Core startup and public surface do not depend on the experimental feature.
- Security/privacy and provider assessment can be handled separately.
- Core forecast operationalization remains focused.

### Risks and treatment

- Packages may remain installed even while code is not loaded. Track removal/isolation in issue #184 and scan the complete artifact.
- Misconfigured flags could enable the feature. Use exact-match flags, configuration validation, deployment checks, and environment documentation.
- Frontend and backend flags could disagree. Treat partial enablement as an invalid experimental configuration and verify both sides.

## Verification

Before merging any future containment implementation that resolves issue #184:

- confirm chat API is unavailable with the backend flag absent and false;
- confirm the widget is absent and not loaded with the frontend flag absent and false;
- confirm core backend startup and frontend build/tests pass;
- in a controlled non-production environment only, confirm explicit enablement behaves as documented; and
- verify deployment configuration keeps both flags disabled.

Before any future operational artifact, confirm experimental packages are absent or formally isolated and assessed.
