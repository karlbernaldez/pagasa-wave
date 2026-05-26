# Projects Module

## Purpose

The Projects module allows users to create, manage, edit, review, and track forecast chart projects.

## Common Questions

### Question: What is a project?
Answer:
A project is a forecast chart workspace containing annotations, markers, metadata, workflow status, and review history.

### Question: Who can create projects?
Answer:
Forecasters can create projects.

### Question: Can Admin users create projects?
Answer:
Admin behavior depends on permissions and implementation rules.

## Create a Project

Steps:

1. Open Project Library.
2. Select the create project action.
3. Enter required project information.
4. Confirm creation.
5. Open the new project in Studio.

Result:
The new project starts in Draft status.

## Open a Project

Steps:

1. Open Project Library.
2. Search or filter to find the project.
3. Select Open.
4. Project loads in Studio.

## Edit a Project

A project can be edited only when workflow rules allow editing.

Editable states typically include:

- Draft
- Revision Requested

Non-editable states typically include:

- Submitted
- Under Review
- Approved
- Published
- Archived

## Submit a Project

Steps:

1. Confirm the project is complete.
2. Open the project.
3. Select Submit.
4. Confirm submission.

Result:

- project status changes to Submitted
- project becomes read-only
- Admin reviewers can access the project

## Revision Workflow

Question: What happens after revision is requested?
Answer:
The Forecaster regains editing access, makes required changes, and resubmits the project.

## Review Lifecycle

Typical flow:

Draft
Submitted
Under Review
Revision Requested
Approved
Published

Alternative outcomes:

Rejected
Archived

## Search and Filtering

Users can typically:

- search by project name
- filter by status
- filter by date
- sort project listings

## Common Problems

### Question: Why is my project read-only?
Answer:
The project is likely in a locked workflow state.

### Question: Why can I not submit my project?
Answer:
Possible reasons:

- required information is missing
- project is not in an editable state
- session expired
- workflow rules prevent submission

### Question: Why can I not find my project?
Answer:
Possible reasons:

- filters are active
- search terms are incorrect
- permissions restrict visibility
