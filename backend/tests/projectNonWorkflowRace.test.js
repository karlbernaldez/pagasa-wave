import assert from 'node:assert/strict';
import test from 'node:test';

import Project from '../models/Project.js';
import {
  addReviewComment,
  getProjectById,
  renameProject,
  updateProject,
} from '../controllers/projectController.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const OWNER_ID = 'owner-1';
const ADMIN_ID = 'admin-1';
const UPDATED_AT = new Date('2026-08-12T07:00:00.000Z');

function ownerId(value = OWNER_ID) {
  return { toString: () => value };
}

function createProject(status = PROJECT_STATUS.DRAFT) {
  return {
    _id: 'project-1',
    owner: ownerId(),
    name: 'Wave Analysis',
    description: '',
    chartType: 'analysis',
    forecastDate: new Date('2026-08-12T00:00:00.000Z'),
    status,
    updatedAt: UPDATED_AT,
    lastOpenedAt: null,
    lastOpenedBy: null,
    openCount: 3,
    auditLogs: [],
    async populate() {
      return this;
    },
    async save() {
      this.saveWhere = this.$where ? { ...this.$where } : null;
      const error = new Error('stale snapshot');
      error.name = 'DocumentNotFoundError';
      throw error;
    },
  };
}

function request({
  role = 'forecaster',
  userId = OWNER_ID,
  body = {},
  authorizedPermissions = [],
} = {}) {
  return {
    params: { id: 'project-1' },
    body,
    query: {},
    user: { id: userId, role },
    authorizedPermissions,
  };
}

function run(handler, req) {
  return new Promise((resolve, reject) => {
    const res = {
      statusCode: 200,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        resolve(this);
        return this;
      },
    };

    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

async function withProjectMocks({ project, findOne = null, updateOne }, work) {
  const originalFindById = Project.findById;
  const originalFindOne = Project.findOne;
  const originalUpdateOne = Project.updateOne;

  Project.findById = async () => project;
  Project.findOne = async () => findOne;
  if (updateOne) Project.updateOne = updateOne;

  try {
    await work();
  } finally {
    Project.findById = originalFindById;
    Project.findOne = originalFindOne;
    Project.updateOne = originalUpdateOne;
  }
}

function assertStaleSnapshot(project, expectedStatus) {
  assert.deepEqual(project.saveWhere, {
    status: expectedStatus,
    updatedAt: UPDATED_AT,
  });
  assert.equal(project.$where, undefined);
}

test('opening a project updates access metadata atomically without saving the loaded document', async () => {
  const project = createProject();
  let updateCall;
  let saveCalls = 0;
  project.save = async () => {
    saveCalls += 1;
    return project;
  };

  await withProjectMocks(
    {
      project,
      updateOne: async (filter, update) => {
        updateCall = { filter, update };
        return { matchedCount: 1, modifiedCount: 1 };
      },
    },
    async () => {
      const res = await run(getProjectById, request());
      assert.equal(res.body.openCount, 4);
      assert.equal(res.body.lastOpenedBy, OWNER_ID);
      assert.ok(res.body.lastOpenedAt instanceof Date);
    }
  );

  assert.equal(saveCalls, 0);
  assert.deepEqual(updateCall.filter, { _id: 'project-1' });
  assert.equal(updateCall.update.$set.lastOpenedBy, OWNER_ID);
  assert.ok(updateCall.update.$set.lastOpenedAt instanceof Date);
  assert.deepEqual(updateCall.update.$inc, { openCount: 1 });
});

test('rename rejects a stale editable project snapshot', async () => {
  const project = createProject(PROJECT_STATUS.DRAFT);

  await withProjectMocks({ project }, async () => {
    await assert.rejects(
      () => run(renameProject, request({ body: { name: 'Renamed Wave Analysis' } })),
      {
        status: 409,
        message: 'Project changed while the rename was in progress. Reload and try again.',
      }
    );
  });

  assertStaleSnapshot(project, PROJECT_STATUS.DRAFT);
});

test('update rejects a stale editable project snapshot', async () => {
  const project = createProject(PROJECT_STATUS.REVISION_REQUESTED);

  await withProjectMocks({ project }, async () => {
    await assert.rejects(
      () =>
        run(
          updateProject,
          request({
            body: {
              name: 'Wave Analysis',
              description: 'Updated forecast chart',
              chartType: 'analysis',
              forecastDate: '2026-08-13',
            },
          })
        ),
      {
        status: 409,
        message: 'Project changed while the edit was in progress. Reload and try again.',
      }
    );
  });

  assertStaleSnapshot(project, PROJECT_STATUS.REVISION_REQUESTED);
});

test('review comment rejects a stale review snapshot before any success response', async () => {
  const project = createProject(PROJECT_STATUS.UNDER_REVIEW);
  let populateCalls = 0;
  project.populate = async () => {
    populateCalls += 1;
    return project;
  };

  await withProjectMocks({ project }, async () => {
    await assert.rejects(
      () =>
        run(
          addReviewComment,
          request({
            role: 'reviewer',
            userId: ADMIN_ID,
            body: { comment: 'Please verify the wave-height labels.' },
            authorizedPermissions: ['projects.review'],
          })
        ),
      {
        status: 409,
        message:
          'Project review state changed while the comment was being added. Reload and try again.',
      }
    );
  });

  assertStaleSnapshot(project, PROJECT_STATUS.UNDER_REVIEW);
  assert.equal(populateCalls, 0);
});
