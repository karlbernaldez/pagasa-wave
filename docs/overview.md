# WaveLab Overview

## What is WaveLab?

WaveLab is a web-based marine forecast operations platform used to create, review, revise, approve, and publish forecast chart projects.

WaveLab is not a numerical weather or wave simulation engine. It is the operational workflow platform used by forecasting teams to manage forecast products.

WaveLab helps teams:

- Create marine forecast chart projects
- Add map annotations and forecast markers
- Manage review workflows
- Compare revisions
- Approve forecast outputs
- Publish finalized forecast products
- Track project activity and review history

## Common Questions

### Question: What does WaveLab do?
Answer:
WaveLab helps forecasting teams prepare and manage marine forecast chart products from draft creation through final publication.

### Question: Is WaveLab a wave simulation engine?
Answer:
No. WaveLab is an operational workflow and forecast product management platform. Numerical modeling systems may provide forecast data, but WaveLab manages the chart authoring and review lifecycle.

### Question: Who uses WaveLab?
Answer:
WaveLab is designed for operational users such as Forecasters and Admin reviewers.

## Main Work Areas

## Project Library
Purpose:
The Project Library is where users create, search, organize, and open forecast chart projects.

Users can:

- Create new projects
- Search existing projects
- Filter by workflow status
- Sort projects
- Open projects in Studio
- Review project summaries

## Studio Workspace
Purpose:
Studio is the interactive map workspace used to edit forecast projects.

Users can:

- Add forecast markers
- Draw annotations
- Manage map layers
- Save project changes
- Prepare submissions for review

Studio becomes read-only when a project is locked by workflow state.

## Review Workspace
Purpose:
The review workspace allows Admin users to inspect submitted forecast products.

Admins can:

- Review submitted projects
- Compare revisions
- Add review comments
- Request revisions
- Approve projects
- Reject projects
- Publish approved products

## Notifications
Purpose:
Notifications inform users about project workflow activity.

Examples:

- Project submitted
- Revision requested
- Project approved
- Project rejected
- Project published

## User Roles

### Forecaster
Forecasters create and edit forecast projects.

Responsibilities:

- Create draft projects
- Add forecast annotations
- Submit projects for review
- Revise projects when requested

### Admin
Admins review and manage forecast workflow decisions.

Responsibilities:

- Review submitted projects
- Compare revisions
- Request changes
- Approve projects
- Publish final outputs

## Workflow Summary

Typical project lifecycle:

Draft → Submitted → Under Review → Revision Requested → Approved → Published

Possible alternative states:

- Rejected
- Archived

## Known Constraints

WaveLab currently depends on:

- authenticated user access
- project workflow permissions
- editable project states for authoring
- backend API availability
- map rendering services

## Terminology

Important domain terms are documented in glossary.md.
