import test from 'node:test';
import assert from 'node:assert/strict';

import Project from '../models/Project.js';
import {
  approveProject,
  archiveProject,
  markProjectNoPublication,
  publishProject,
  rejectProject,
  requestProjectRevision,
  startReviewProject,
  submitProject,
} from '../controllers/projectController.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const OWNER_ID = 'owner-1';
const ADMIN_ID = 'admin-1';
const UPDATED_AT = new Date('2026-08-12T06:00:00.000Z');

function ownerId(value = OWNER_ID) {
  return { toString: () => value };
}

function createStaleProject(status) {
  return {
    _id: 'project-1',
    name: 'Race Test Project',
    owner: ownerId(),
    status,
    updatedAt: UPDATED_AT,
    version: 1,
    versions: [],
    auditLogs: [],
    async save() {
      assert.equal(this.$where.status, status);
      assert.equal(this.$where.updatedAt, UPDATED_AT);
      const error = new Error('stale snapshot');
      error.name = 'DocumentNotFoundError';
      throw error;
    },
    async populate() {
      return this;
    },
  };
}

function createReq({ role = 'admin', userId = ADMIN_ID, body = {} } = {}) {
  return {
    params: { id: 'project-1' },
    body,
    query: {},
    user: { id: userId, role },
  };
}

function runController(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, body: payload });
      },
    };

    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

async function withProject(project, work) {
  const originalFindById = Project.findById;
  Project.findById = async () => project;
  try {
    await work();
  } finally {
    Project.findById = originalFindById;
  }
}

const cases = [
  {
    name: 'submit',
    handler: submitProject,
    status: PROJECT_STATUS.DRAFT,
    req: createReq({ role: 'forecaster', userId: OWNER_ID }),
  },
  {
    name: 'start review',
    handler: startReviewProject,
    status: PROJECT_STATUS.SUBMITTED,
    req: createReq(),
  },
  {
    name: 'request revision',
    handler: requestProjectRevision,
    status: PROJECT_STATUS.UNDER_REVIEW,
    req: createReq({ body: { comment: 'Please revise.' } }),
  },
  {
    name: 'approve',
    handler: approveProject,
    status: PROJECT_STATUS.UNDER_REVIEW,
    req: createReq(),
  },
  {
    name: 'reject',
    handler: rejectProject,
    status: PROJECT_STATUS.UNDER_REVIEW,
    req: createReq({ body: { comment: 'Incorrect forecast.' } }),
  },
  {
    name: 'mark no publication',
    handler: markProjectNoPublication,
    status: PROJECT_STATUS.UNDER_REVIEW,
    req: createReq({ body: { reason: 'Operational cancellation' } }),
  },
  {
    name: 'publish',
    handler: publishProject,
    status: PROJECT_STATUS.APPROVED,
    req: createReq(),
  },
  {
    name: 'archive',
    handler: archiveProject,
    status: PROJECT_STATUS.PUBLISHED,
    req: createReq(),
  },
];

for (const scenario of cases) {
  test(`${scenario.name} rejects a stale project workflow snapshot`, async () => {
    const project = createStaleProject(scenario.status);

    await withProject(project, async () => {
      await assert.rejects(() => runController(scenario.handler, scenario.req), { status: 409 });
    });

    assert.equal(project.$where, undefined);
  });
}
