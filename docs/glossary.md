# WaveLab Glossary

For the canonical distinction between Forecast, Forecast Package, Forecast Chart, Studio, and the internal Project persistence model, see `docs/domain/forecast-terminology.md`.

## Forecast Workflow Terms

### Forecast
Definition:
The overall WaveLab operational domain for preparing, reviewing, approving, publishing, and archiving marine forecast products.

### Forecast Package
Definition:
A complete forecast production set for a forecast date or cycle containing the required Forecast Charts and carrying the package-level workflow state.

### Forecast Chart
Definition:
One operational chart or forecast product inside a Forecast Package, such as Wave Analysis, 24-hour Wave Forecast, 36-hour Wave Forecast, or 48-hour Wave Forecast.

Implementation note:
A Forecast Chart is currently backed internally by the existing `Project` persistence model.

### Draft
Definition:
A Forecast Package that is still being prepared and may be edited by users with the required permissions.

### Submitted
Definition:
A Forecast Package that has been sent for review and is no longer in ordinary editing state until the workflow permits revision.

### Under Review
Definition:
A Forecast Package currently being evaluated by a user with review permission.

### Revision Requested
Definition:
A Forecast Package returned for required changes before it can proceed through review again.

### Approved
Definition:
A Forecast Package that passed the approval step and is eligible for publication subject to publication permission and workflow rules.

### Rejected
Definition:
A Forecast Package that did not pass review and cannot proceed to approval or publication in its current workflow instance.

### Published
Definition:
A finalized Forecast Package released through the approved publication workflow and no longer ordinarily editable.

### Archived
Definition:
A Forecast Package retained for history or records purposes and no longer active in the normal forecast-production workflow.

## Platform Terms

### Studio
Definition:
The interactive map workspace used to inspect or edit a Forecast Chart, including forecast layers, annotations, drawing tools, labels, and related chart-editing controls.

### Project
Definition:
An internal persistence and implementation concept currently used to store an individual Forecast Chart.

Usage note:
Project is retained for internal compatibility during migration and should not be used as the preferred user-facing workflow term.

### Review Queue
Definition:
The shared workspace where users with forecast review permission access Forecast Packages awaiting review or related review actions.

### Preview Mode
Definition:
A review mode showing the current Forecast Chart state.

### Diff Mode
Definition:
A comparison mode showing differences between Forecast Chart versions.

### Annotation
Definition:
A saved visual map feature such as markers, drawings, symbols, or forecast notes.

### Marker
Definition:
A specific map symbol placed on the forecast workspace.

### Layer
Definition:
A map visualization grouping used to organize forecast annotations.

## Marine Forecast Terms

### Marine Forecast
Definition:
A forecast describing expected marine or ocean conditions.

### Wave Height
Definition:
The height of forecasted wave conditions represented in marine products.

### Wave Direction
Definition:
The direction from which wave energy or wave movement is represented.

### Forecast Product
Definition:
A finalized forecast chart or operational output prepared for publication.

### Review Remark
Definition:
A reviewer comment used to document an observation, decision, or requested change during Forecast Package or Forecast Chart review.

## Chatbot Guidance Terms

### Unsupported Question
Definition:
A user question that cannot be answered from the current documentation.

Expected chatbot behavior:
The chatbot should avoid guessing and should direct the user to support or documentation when information is unavailable.
