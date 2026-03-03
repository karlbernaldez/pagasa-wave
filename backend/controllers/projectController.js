import asyncHandler from '../utils/asyncHandler.js';
import { throwError } from '../utils/errorHelper.js';
import {
  ensureProjectExists,
  ensureUniqueProjectName,
  deleteProjectAndFeatures,
} from '../utils/dbHelpers.js';
import Project from '../models/Project.js';

/* =========================================================
   STATUS TRANSITION MAP
========================================================= */
const allowedTransitions = {
  Draft: ['Submitted'],
  Submitted: ['Under Review'],
  'Under Review': ['Approved', 'Rejected'],
  Approved: ['Published'],
  Rejected: ['Draft'],
  Published: ['Archived'],
};

/* =========================================================
   ADMIN: GET ALL PROJECTS
========================================================= */
export const getAllProjectsForAdmin = asyncHandler(async (req, res) => {
  if (!req.user || req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const allowedAdminStatuses = [
    'Submitted',
    'Under Review',
    'Approved',
    'Published',
    'Rejected',
    'Archived'
  ];

  const { status } = req.query;

  const filter = {
    status: { $in: allowedAdminStatuses }
  };

  if (status) {
    if (!allowedAdminStatuses.includes(status)) {
      throwError('Invalid or unauthorized status filter', 400);
    }
    filter.status = status;
  }

  const projects = await Project.find(filter)
    .populate('owner', 'firstName lastName email username')
    .sort({ submittedAt: -1, createdAt: -1 })
    .lean();

  res.json(projects);
});

/* =========================================================
   CREATE PROJECT
========================================================= */
export const createProject = asyncHandler(async (req, res) => {
  const { name, description, chartType, forecastDate } = req.body;

  if (!req.user) throwError('Unauthorized', 401);
  if (!name || !chartType || !forecastDate) {
    throwError('name, chartType and forecastDate are required', 400);
  }

  await ensureUniqueProjectName(name, req.user.id);

  const project = await Project.create({
    name: name.trim(),
    description: description?.trim() || '',
    chartType: chartType.trim(),
    forecastDate,
    owner: req.user.id,
    status: 'Draft',
    version: 1,
    auditLogs: [
      {
        action: 'created',
        performedBy: req.user.id,
        previousStatus: null,
        newStatus: 'Draft',
        comment: 'Project created',
      },
    ],
  });

  res.status(201).json(project);
});

/* =========================================================
   GET USER PROJECTS
========================================================= */
export const getUserProjects = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const {
    page = 1,
    limit = 8,
    search = '',
    status = ''
  } = req.query;

  const query = { owner: req.user.id };

  if (search.trim()) {
    query.$or = [
      { name: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } }
    ];
  }

  if (status && status !== 'All') {
    query.status = status;
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [projects, total] = await Promise.all([
    Project.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
    Project.countDocuments(query)
  ]);

  res.json({
    projects,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / Number(limit))
  });
});

/* =========================================================
   GET LATEST USER PROJECT
========================================================= */
export const getLatestUserProject = asyncHandler(async (req, res) => {
  if (!req.user) throwError('Unauthorized', 401);

  const project = await Project.findOne({ owner: req.user.id })
    .sort({ updatedAt: -1 }) // Most recently modified
    .lean();

  if (!project) {
    return res.json({
      project: null,
      message: 'No projects found for this user'
    });
  }

  res.json({ project });
});

/* =========================================================
   GET PROJECT BY ID
========================================================= */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await ensureProjectExists(req.params.id, req.user.id);

  await project.populate('owner', 'firstName lastName email position');

  res.json(project);
});

/* =========================================================
   UPDATE PROJECT (ONLY DRAFT OR REJECTED)
========================================================= */
export const updateProject = asyncHandler(async (req, res) => {
  const { name, description, chartType, forecastDate } = req.body;

  const project = await ensureProjectExists(req.params.id, req.user.id);

  if (!['Draft', 'Rejected'].includes(project.status)) {
    throwError('Only Draft or Rejected projects can be edited', 400);
  }

  if (!name || !chartType || !forecastDate) {
    throwError('All fields are required', 400);
  }

  await ensureUniqueProjectName(name, req.user.id, project._id);

  project.name = name.trim();
  project.description = description?.trim() || '';
  project.chartType = chartType.trim();
  project.forecastDate = forecastDate;

  project.auditLogs.push({
    action: 'edited',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: project.status,
    comment: 'Project edited',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   SUBMIT PROJECT (OWNER)
========================================================= */
export const submitProject = asyncHandler(async (req, res) => {
  const project = await ensureProjectExists(req.params.id, req.user.id);

  if (!allowedTransitions[project.status]?.includes('Submitted')) {
    throwError('Invalid status transition', 400);
  }

  project.status = 'Submitted';
  project.submittedAt = new Date();

  project.auditLogs.push({
    action: 'submitted',
    performedBy: req.user.id,
    previousStatus: 'Draft',
    newStatus: 'Submitted',
    comment: 'Submitted for review',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   APPROVE PROJECT (ADMIN)
========================================================= */
export const approveProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!allowedTransitions[project.status]?.includes('Approved')) {
    throwError('Invalid status transition', 400);
  }

  if (project.owner.toString() === req.user.id) {
    throwError('You cannot approve your own project', 400);
  }

  project.status = 'Approved';
  project.reviewedAt = new Date();
  project.approvedBy = req.user.id;

  project.auditLogs.push({
    action: 'approved',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: 'Approved',
    comment: 'Project approved',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   REJECT PROJECT (ADMIN)
========================================================= */
export const rejectProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const { comment } = req.body;

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!allowedTransitions[project.status]?.includes('Rejected')) {
    throwError('Invalid status transition', 400);
  }

  project.status = 'Rejected';
  project.rejectedBy = req.user.id;
  project.reviewComment = comment || '';
  project.reviewedAt = new Date();

  project.auditLogs.push({
    action: 'rejected',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: 'Rejected',
    comment: comment || 'Rejected',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   PUBLISH PROJECT (ADMIN)
========================================================= */
export const publishProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (!allowedTransitions[project.status]?.includes('Published')) {
    throwError('Invalid status transition', 400);
  }

  project.status = 'Published';
  project.publishedAt = new Date();

  project.auditLogs.push({
    action: 'published',
    performedBy: req.user.id,
    previousStatus: project.status,
    newStatus: 'Published',
    comment: 'Project published',
  });

  await project.save();

  res.json(project);
});

/* =========================================================
   DELETE PROJECT
========================================================= */
export const deleteProject = asyncHandler(async (req, res) => {
  const deletedFeaturesCount = await deleteProjectAndFeatures(
    req.params.id,
    req.user.id
  );

  res.json({
    message: 'Project and related features deleted successfully',
    deletedFeatures: deletedFeaturesCount,
  });
});

/* =========================================================
   ARCHIVE PROJECT (ADMIN)
========================================================= */
export const archiveProject = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    throwError('Admin access required', 403);
  }

  const project = await Project.findById(req.params.id);
  if (!project) throwError('Project not found', 404);

  if (project.status !== 'Published') {
    throwError('Only published projects can be archived', 400);
  }

  project.status = 'Archived';

  project.auditLogs.push({
    action: 'archived',
    performedBy: req.user.id,
    previousStatus: 'Published',
    newStatus: 'Archived',
    comment: 'Project archived',
  });

  await project.save();

  res.json(project);
});