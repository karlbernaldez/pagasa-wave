import asyncHandler from '../../utils/asyncHandler.js';
import { throwError } from '../../utils/errorHelper.js';

import { ProjectService } from '../../services/project/projectService.js';
import { ProjectWorkflowService } from '../../services/project/projectWorkflowService.js';
import { ProjectQueryService } from '../../services/project/projectQueryService.js';

/* =========================================================
   GET USER PROJECTS
========================================================= */

export const getUserProjects =
  asyncHandler(async (req, res) => {
    const result =
      await ProjectQueryService.getUserProjects(
        req.user.id,
        req.query
      );
    res.json(result);
  });

/* =========================================================
   GET LATEST PROJECT
========================================================= */

export const getLatestUserProject =
  asyncHandler(async (req, res) => {
    const project =
      await ProjectQueryService.getLatestProject(
        req.user.id
      );

    res.json({ project });
  });

/* =========================================================
   GET PROJECT BY ID
========================================================= */

export const getProjectById =
  asyncHandler(async (req, res) => {
    const project =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    if (!project) throwError('Project not found', 404);

    await ProjectQueryService.trackOpen(
      req.params.id,
      req.user.id
    );

    res.json(project);
  });

/* =========================================================
   CREATE PROJECT
========================================================= */

export const createProject =
  asyncHandler(async (req, res) => {
    const {
      name,
      description,
      forecastDate,
    } = req.body;

    const project =
      await ProjectService.createProject({
        name,
        description,
        forecastDate,
        ownerId: req.user.id,
      });

    const response =
      await ProjectQueryService.getProjectWithCharts(
        project._id
      );

    res.status(201).json(response);
  });

/* =========================================================
   RENAME PROJECT
========================================================= */

export const renameProject =
  asyncHandler(async (req, res) => {
    await ProjectService.renameProject(
      req.params.id,
      req.user.id,
      req.body.name
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   UPDATE PROJECT
========================================================= */

export const updateProject =
  asyncHandler(async (req, res) => {
    await ProjectService.updateProject(
      req.params.id,
      req.user.id,
      req.body
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   DELETE PROJECT
========================================================= */

export const deleteProject =
  asyncHandler(async (req, res) => {
    const result =
      await ProjectService.deleteProject(
        req.params.id,
        req.user.id
      );

    res.json({
      message: 'Project deleted successfully',
      ...result,
    });
  });

/* =========================================================
   SUBMIT
========================================================= */

export const submitProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.submit(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   START REVIEW
========================================================= */

export const startReviewProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.startReview(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   ADD REVIEW COMMENT
========================================================= */

export const addReviewComment =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.addComment(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   REQUEST REVISION
========================================================= */

export const requestProjectRevision =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.requestRevision(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   APPROVE
========================================================= */

export const approveProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.approve(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   REJECT
========================================================= */

export const rejectProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.reject(
      req.params.id,
      req.user.id,
      req.body.comment
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   PUBLISH
========================================================= */

export const publishProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.publish(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });

/* =========================================================
   ARCHIVE
========================================================= */

export const archiveProject =
  asyncHandler(async (req, res) => {
    await ProjectWorkflowService.archive(
      req.params.id,
      req.user.id
    );

    const response =
      await ProjectQueryService.getProjectWithCharts(
        req.params.id
      );

    res.json(response);
  });