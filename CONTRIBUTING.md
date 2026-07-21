# Contributing to WaveLab

WaveLab is an R&D prototype progressing through a controlled operationalization process. Contributions must protect forecast integrity, security, privacy, auditability, maintainability, and service recovery.

Read [AGENTS.md](AGENTS.md) whether the change is written manually or with an AI coding agent.

## 1. Start with traceable work

Before coding:

1. Use or create a GitHub issue with a requirement, defect, incident, or risk identifier.
2. Define measurable acceptance criteria, including failure and denied behavior.
3. Classify the change as Standard, Normal, Forecast integrity, Security/privacy, or Emergency.
4. Identify data, migration, configuration, dependency, operational, privacy, and rollback impact.
5. Record an ADR before a significant architecture or operational decision.

## 2. Branch and change scope

- Create a short-lived branch from current `main`.
- Keep the change focused on one coherent outcome.
- Preserve backward compatibility unless an approved requirement and migration plan say otherwise.
- Separate mechanical refactors from behavior changes.
- Do not mix unrelated formatting or cleanup into a functional change.

## 3. Engineering expectations

Follow the [engineering quality standard](docs/operationalization/development/engineering-quality-standard.md).

Important repository rules:

- Backend package manager: npm with `backend/package-lock.json`.
- Frontend package manager: pinned pnpm with `frontend/pnpm-lock.yaml`.
- Do not commit secrets or local environment files.
- Keep business and forecast/time rules in focused, testable modules.
- Enforce protected operations and workflow rules on the server.
- Use explicit structured errors and safe structured logs.
- Document external interfaces and dependency decisions.
- Add a regression test for every defect fix.

## 4. Test locally

Repository quality checks:

```bash
npm ci --ignore-scripts
npm run quality
```

These checks lint and format-check new or changed files, validate repository hygiene, check changed JSON and local Markdown links, scan for selected high-confidence secret patterns, and enforce the package-manager lockfile policy.

Backend:

```bash
cd backend
npm ci
npm test
npm run test:workflow
```

Frontend:

```bash
cd frontend
corepack enable
pnpm install --frozen-lockfile
pnpm test
pnpm build
```

Run additional targeted integration, end-to-end, security, performance, recovery, or domain-validation checks based on risk. Record commands and results in the PR.

Do not change an expected result simply to match incorrect current behavior. Resolve the requirement conflict first.

## 5. AI-assisted contributions

AI assistance is permitted under the [AI-assisted development standard](docs/operationalization/development/ai-assisted-development-standard.md).

The contributor must:

- protect confidential, personal, restricted, and production information;
- understand and review every material generated change;
- verify dependencies, APIs, calculations, commands, and sources;
- disclose material AI assistance in the PR; and
- remain accountable for correctness, tests, security, licensing, and documentation.

## 6. Open a pull request

Complete every applicable section of the PR template. A reviewable PR includes:

- linked issue, requirements, and ADR;
- behavior, risk, and user/operator impact;
- test and validation evidence;
- screenshots or examples for UI/output changes;
- migration, configuration, monitoring, deployment, and rollback notes;
- documentation and traceability updates; and
- required code, forecast-domain, security/privacy, data, and service reviewers.

## 7. Review and merge

- The repository is currently in a declared solo-maintainer R&D phase. The sole developer uses a pull request, required CI, the completed PR checklist, and a documented self-review before integration.
- Solo self-review permits development integration only; it does not grant meteorological validation, legal/security risk acceptance, or operational authorization.
- High-risk forecast, production, security/privacy, destructive data, or migration changes remain Draft/R&D-only or obtain the appropriate external/domain/organizational review.
- All required checks and review conversations must be complete.
- Forecast-integrity changes require an authorized domain review and comparison evidence.
- Security/privacy changes require the appropriate review.
- Draft documentation may be merged as a working baseline only when clearly labelled Draft; merging does not constitute operational approval.
- Confirm whether merging will trigger a production deployment.

## 8. Definition of done

Use the SDLC [Definition of done](docs/operationalization/governance/sdlc-plan.md#definition-of-done). Work remains incomplete when required tests, documentation, migration, monitoring, rollback, or traceability evidence is missing.

## Reporting vulnerabilities

Do not disclose a suspected vulnerability, credential, or sensitive log in a public issue. Use the approved private security reporting channel. The channel and response owner are currently TBD and must be established before operational use.
