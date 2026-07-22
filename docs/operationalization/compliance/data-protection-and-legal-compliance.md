# WaveLab data protection and legal compliance framework

**Status:** In review — applicability and engineering assessment baseline
**Version:** 0.2
**Legal/privacy decision requested:** Confirm the assessment approach, accountable reviewers, and required evidence; no compliance certification is requested
**Last source review:** 2026-07-21

## Important limitation

This document supports engineering and compliance discovery. It is not legal advice and does not certify WaveLab as compliant. The accountable PAGASA legal, privacy/data-protection, security, records, procurement, and system authorities must determine applicability and approve the final controls.

## Applicability approach

Create a compliance register for every applicable law, regulation, circular, contract, license, records rule, accessibility requirement, and government policy. For each obligation record:

- source and effective/version date;
- why it applies;
- accountable authority;
- affected data, system, vendor, and process;
- control and evidence;
- review frequency;
- exceptions and residual risk; and
- change-monitoring owner.

Do not write “GDPR compliant,” “DPA compliant,” or similar claims solely because technical controls exist.

## Philippine Data Privacy Act baseline

As a Philippine government/research system processing user-account and operational records, WaveLab should be assessed first against:

- [Republic Act No. 10173, Data Privacy Act of 2012](https://privacy.gov.ph/data-privacy-act/)
- [Implementing Rules and Regulations of RA 10173](https://privacy.gov.ph/implementing-rules-regulations-data-privacy-act-2012/)
- [NPC Circular No. 2023-06 and related current NPC security guidance](https://privacy.gov.ph/pips-and-pics/advisories-circulars/)

Engineering work must support, as applicable:

- transparency, legitimate purpose, proportionality, accuracy, and data minimization;
- an identified personal information controller/processor role and data-protection responsibility;
- a lawful basis and documented purpose for each processing activity;
- notices and data-subject rights procedures;
- privacy by design/default and privacy impact assessment;
- reasonable organizational, physical, and technical security;
- access control, auditability, retention, secure disposal, and processor/vendor management;
- breach detection, assessment, documentation, notification, and response;
- controls for data sharing, outsourcing, and cross-border/external-provider access; and
- current registration, records, or notification duties determined by the responsible authority.

## GDPR applicability

The [EU General Data Protection Regulation, Regulation (EU) 2016/679](https://eur-lex.europa.eu/eli/reg/2016/679/oj/eng), does not apply merely because a public website can be opened from Europe. The privacy/legal authority must document territorial and material applicability, including Article 3 considerations such as an EU establishment or offering goods/services to, or monitoring the behavior of, people in the EU.

When GDPR applies, the control register should address, as relevant:

- Article 5 processing principles and accountability;
- Article 6 lawful basis and Articles 9/10 special categories where applicable;
- Articles 12–22 notices and data-subject rights;
- Article 25 data protection by design and by default;
- Articles 28 and 44–49 processor and international-transfer requirements;
- Article 30 records of processing;
- Articles 32–34 security and personal-data breaches;
- Article 35 data protection impact assessment;
- Articles 37–39 data protection officer duties where applicable; and
- demonstrable accountability and retained evidence.

If GDPR is not applicable, its privacy-by-design practices may still be adopted as an engineering benchmark, clearly labelled as such.

## Initial WaveLab processing inventory

The authoritative inventory remains TBD. Assess at minimum:

| Processing area             | Possible personal/regulated data                                        | Required decisions                                                           |
| --------------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Accounts and profiles       | Name, email, role, affiliation, status                                  | Purpose, lawful basis, required fields, retention, access, rights            |
| Authentication and recovery | Credential hashes, tokens, OTP/recovery events, IP/device/security logs | Security, lifetime, revocation, disclosure, retention                        |
| Forecast workflow           | Creator/reviewer identity, comments, decisions, timestamps              | Accountability, visibility, retention, correction                            |
| Notifications and email     | Address, content, delivery metadata                                     | Provider role, disclosure, retention, opt-out where applicable               |
| Support and incidents       | Reporter identity, messages, attachments, logs                          | Minimization, sensitive content, access, retention                           |
| Audit and operations        | Actor, IP/device, action, object, result, diagnostics                   | Purpose, integrity, access, retention, monitoring                            |
| Backups                     | Copies of the above                                                     | Encryption, access, location, retention, restoration, deletion               |
| AI development tools        | Prompts, source/context, logs, generated output, user identifiers       | Tool approval, prohibited data, provider terms, retention/training, transfer |

## Privacy-by-design engineering requirements

- Collect only approved fields and make optionality explicit.
- Use synthetic/masked test data and sanitized logs.
- Separate public, user, reviewer, administrator, operator, and auditor access.
- Enforce access on the server and review privileges periodically.
- Keep retention and deletion rules enforceable across primary data, logs, caches, exports, and backups.
- Provide approved workflows for access, correction, export, restriction/objection, and deletion where applicable without corrupting required audit records.
- Document automated processing and ensure material decisions retain authorized human review.
- Prevent personal data from entering Discord, email, analytics, AI tools, error messages, or third-party maps without approved purpose and safeguards.
- Record vendor/sub-processor, hosting location, data flow, contract, security, breach, deletion, and exit requirements.
- Test privacy controls and retain evidence.

## AI-assisted development compliance

Before non-public code or context is provided to an AI service:

1. Approve the provider and exact use case.
2. Determine what data leaves PAGASA-controlled systems.
3. Confirm retention, deletion, training use, sub-processors, location/transfer, security, incident, confidentiality, and intellectual-property terms.
4. Prohibit secrets, production data, personal data, restricted forecasts, and unsanitized logs unless a specifically approved arrangement permits them.
5. Use least data and sanitized context.
6. Keep a human accountable for generated output, third-party code, licenses, and legal statements.
7. Record material AI use in the PR without exposing confidential prompts/context.

## Other legal and policy workstreams

The responsible authorities should also assess:

- government records retention, archival, and freedom-of-information obligations;
- cybersecurity, government ICT, hosting/cloud, procurement, and incident-reporting requirements;
- accessibility requirements for public digital services;
- intellectual-property ownership and the MIT/ISC repository metadata conflict;
- licenses and terms for Mapbox, icons, fonts, data/model sources, npm/pnpm/Python packages, and generated content;
- domain, branding, official-publication, disclaimer, and public-information requirements; and
- collaboration agreements for DOST-MECO-TECO-VOTE III and partner institutions.

## Evidence required before pilot

- approved data inventory and processing register;
- applicability memo and compliance register;
- privacy impact assessment and threat model;
- approved privacy notices and account/rights procedures;
- data-sharing/processor/vendor records;
- retention and disposal schedule;
- access-control and audit evidence;
- security and breach-response exercise;
- AI tool/provider approval record, if used with non-public context;
- license and third-party-content inventory; and
- signed residual-risk/exception records.

## Source maintenance

Legal and regulatory sources can change. The privacy/legal owner must review official sources before each pilot/production readiness decision and at an approved recurring interval.
