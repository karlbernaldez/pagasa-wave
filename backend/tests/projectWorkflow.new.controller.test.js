import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryReplSet } from 'mongodb-memory-server';

import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import {
  startReviewProject,
  addReviewComment,
  approveProject,
  rejectProject,
  publishProject,
  requestProjectRevision,
} from '../controllers/projects/projectController.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

let mongod;
let replset;

// ── Lifecycle ─────────────────────────────────────────────────────────────────

test.before(async () => {
  replset = await MongoMemoryReplSet.create({
    replSet: {
      count: 1,
      storageEngine: 'wiredTiger',
    },
  });

  await mongoose.connect(replset.getUri());
});

test.after(async () => {
  await mongoose.disconnect();
  await replset.stop();
});

test.afterEach(async () => {
  const collections =
    mongoose.connection.collections;

  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

const OWNER_ID = new mongoose.Types.ObjectId();
const ADMIN_ID = new mongoose.Types.ObjectId();

async function createProject(overrides = {}) {
  return Project.create({
    name: overrides.name ?? 'Test Project',
    description: '',
    forecastDate: new Date(),
    owner: overrides.owner ?? OWNER_ID,
    status: overrides.status ?? PROJECT_STATUS.SUBMITTED,
    version: 1,
    versions: [],
    auditLogs: [],
    ...overrides,
  });
}

function createReq({ projectId, role = 'admin', userId = ADMIN_ID, body = {} } = {}) {
  return {
    params: { id: String(projectId) },
    body,
    user: { id: String(userId), role },
  };
}

async function runController(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: undefined,

      status(code) {
        this.statusCode = code;
        return this;
      },

      json(payload) {
        this.body = payload;
        resolve(this);
      },
    };

    Promise.resolve(
      handler(req, res, reject)
    ).catch(reject);
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test('startReviewProject moves submitted project to under review', async () => {
  const project = await createProject({ status: PROJECT_STATUS.SUBMITTED });

  const res = await runController(startReviewProject, createReq({ projectId: project._id }));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.UNDER_REVIEW);

  const updated = await Project.findById(project._id);
  assert.equal(updated.status, PROJECT_STATUS.UNDER_REVIEW);
  assert.ok(updated.auditLogs.some(l => l.action === 'review_started'));
});

test('startReviewProject is idempotent when already under review', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  const res = await runController(startReviewProject, createReq({ projectId: project._id }));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.UNDER_REVIEW);
});

test('addReviewComment keeps status unchanged and writes audit log', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  const res = await runController(
    addReviewComment,
    createReq({ projectId: project._id, body: { comment: 'Please verify this annotation.' } })
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.UNDER_REVIEW);

  const updated = await Project.findById(project._id);
  const log = updated.auditLogs.find(l => l.action === 'comment_added');
  assert.ok(log);
  assert.equal(log.comment, 'Please verify this annotation.');
});

test('addReviewComment rejects comments outside submitted or under review', async () => {
  const project = await createProject({ status: PROJECT_STATUS.APPROVED });

  await assert.rejects(
    () => runController(addReviewComment, createReq({
      projectId: project._id,
      body: { comment: 'Too late.' },
    })),
    { status: 400 }
  );
});

test('requestProjectRevision moves under review project to revision requested', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  const res = await runController(
    requestProjectRevision,
    createReq({ projectId: project._id, body: { comment: 'Fix the advisory area.' } })
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.REVISION_REQUESTED);

  const updated = await Project.findById(project._id);
  assert.equal(updated.status, PROJECT_STATUS.REVISION_REQUESTED);
  assert.equal(updated.reviewComment, 'Fix the advisory area.');
});

test('requestProjectRevision requires a comment', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await assert.rejects(
    () => runController(requestProjectRevision, createReq({
      projectId: project._id,
      body: { comment: '   ' },
    })),
    { status: 400 }
  );
});

test('approveProject moves under review project to approved', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  const res = await runController(approveProject, createReq({ projectId: project._id }));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.APPROVED);

  const updated = await Project.findById(project._id);
  assert.equal(updated.status, PROJECT_STATUS.APPROVED);
  assert.ok(updated.approvedBy);
});

test('rejectProject requires a rejection comment', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await assert.rejects(
    () => runController(rejectProject, createReq({
      projectId: project._id,
      body: { comment: '' },
    })),
    { status: 400 }
  );
});

test('rejectProject moves under review project to rejected', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  const res = await runController(
    rejectProject,
    createReq({ projectId: project._id, body: { comment: 'Incorrect forecast.' } })
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.REJECTED);

  const updated = await Project.findById(project._id);
  assert.equal(updated.status, PROJECT_STATUS.REJECTED);
  assert.equal(updated.reviewComment, 'Incorrect forecast.');
});

test('publishProject only publishes approved projects', async () => {
  const project = await createProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await assert.rejects(
    () => runController(publishProject, createReq({ projectId: project._id })),
    { status: 400 }
  );
});

test('publishProject moves approved project to published', async () => {
  const project = await createProject({ status: PROJECT_STATUS.APPROVED });

  const res = await runController(publishProject, createReq({ projectId: project._id }));

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.status, PROJECT_STATUS.PUBLISHED);

  const updated = await Project.findById(project._id);
  assert.equal(updated.status, PROJECT_STATUS.PUBLISHED);
  assert.ok(updated.publishedAt);
});