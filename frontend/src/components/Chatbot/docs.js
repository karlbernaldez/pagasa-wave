export default `
# WaveLab Overview
WaveLab is a web-based marine forecast operations platform used to create, review, revise, approve, and publish forecast chart projects.

WaveLab manages operational forecast workflows rather than serving as a numerical simulation engine.

Common responsibilities:
- project creation
- map annotation authoring
- review workflows
- revision management
- approval workflows
- publication workflows

# User Roles
Forecaster:
- creates projects
- edits forecast charts
- submits projects for review
- revises requested changes

Admin:
- reviews submitted projects
- compares revisions
- requests revisions
- approves projects
- rejects projects
- publishes approved projects

# Project Workflow
Project statuses:
- Draft
- Submitted
- Under Review
- Revision Requested
- Approved
- Rejected
- Published
- Archived

Workflow behavior:
Draft projects are editable.
Submitted projects are read-only for Forecasters.
Revision Requested projects can be edited again.
Published projects are final.

# Project Library
Question: What is Project Library?
Answer:
Project Library is the main workspace for managing forecast projects.

Question: What can users do in Project Library?
Answer:
Users can:
- create projects
- search projects
- filter by status
- sort projects
- open projects
- inspect summaries

# Studio Workspace
Question: What is Studio?
Answer:
Studio is the interactive map editing workspace.

Question: What can users do in Studio?
Answer:
Users can:
- place markers
- add annotations
- draw forecast features
- manage layers
- save project edits

Question: Why is Studio read-only?
Answer:
Studio becomes read-only when workflow rules lock editing.

# Review Workspace
Question: What is Review Mode?
Answer:
Review Mode allows Admin users to inspect submitted forecast projects.

Admin review actions:
- add comments
- request revision
- approve
- reject
- publish

# Diff Mode
Question: What is Diff Mode?
Answer:
Diff Mode compares previous and current project versions.

Diff helps reviewers identify:
- added annotations
- removed annotations
- changed content

# Notifications
Question: What notifications exist?
Answer:
Notifications may appear for:
- submission events
- revision requests
- approval events
- rejection events
- publication events

# Troubleshooting
Question: Why is my project read-only?
Answer:
Possible reasons:
- project is submitted
- project is under review
- project is approved
- project is published
- project is archived

Question: Why can I not submit?
Answer:
Possible reasons:
- incomplete project data
- invalid workflow state
- expired session
- permissions issue

Question: Why can I not find my project?
Answer:
Possible reasons:
- filters are active
- search terms are incorrect
- visibility restrictions exist

# Marine Forecast Terms
Wave Height:
Represents forecasted wave conditions.

Wave Direction:
Represents expected movement or origin direction of wave activity.

Forecast Product:
A finalized marine forecast output prepared for publication.
`;