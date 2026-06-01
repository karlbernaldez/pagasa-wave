# Sprint 1 Workflow Refactor Plan

## Goal

Move workflow ownership from projectController.js into ProjectWorkflowService.

## Current State

Controllers directly:

- validate transitions
- mutate status
- mutate workflow metadata
- create audit logs
- save project
- trigger notifications

## Target State

ProjectWorkflowService owns:

- submit
- startReview
- requestRevision
- approve
- reject
- publish
- archive

## Migration Order

1. submitProject
2. startReviewProject
3. requestProjectRevision
4. approveProject
5. rejectProject
6. publishProject
7. archiveProject

## Follow-up

- notification hooks
- optimistic locking
- workflow transactions
- workflow unit tests
