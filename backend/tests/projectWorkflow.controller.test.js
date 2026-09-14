import test from 'node:test';
import assert from 'node:assert/strict';

import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import {
  addReviewComment,
  approveProject,
  getAllProjectsForAdmin,
  publishProject,
  rejectProject,
  requestProjectRevision,
  startReviewProject,
} from '../controllers/projectController.js';
import { PROJECT_STATUS } from '../utils/projectWorkflow.js';

const OWNER_ID = 'owner-1';
const ADMIN_ID = 'admin-1';
const REVIEW_PERMISSIONS = ['projects.review', 'projects.approve', 'projects.publish'];

function ownerId(value = OWNER_ID) {
  return {
    toString: () => value,
  };
}

function createFakeProject(overrides = {}) {
  return {
    _id: overrides._id ?? 'project-1',
    name: overrides.name ?? 'Test Project',
    owner: Object.prototype.hasOwnProperty.call(overrides, 'owner') ? overrides.owner : ownerId(),
    status: overrides.status ?? PROJECT_STATUS.UNDER_REVIEW,
    versions: overrides.versions ?? [],
    auditLogs: overrides.auditLogs ?? [],
    reviewStartedAt: overrides.reviewStartedAt,
    reviewStartedBy: overrides.reviewStartedBy,
    reviewedAt: overrides.reviewedAt,
    approvedBy: overrides.approvedBy,
    rejectedBy: overrides.rejectedBy,
    reviewComment: overrides.reviewComment,
    publishedAt: overrides.publishedAt,
    saveCalls: 0,
    populateCalls: [],
    async save() {
      this.saveCalls += 1;
      return this;
    },
    async populate(args) {
      this.populateCalls.push(args);
      return this;
    },
  };
}

function createReq({
  projectId = 'project-1',
  role = 'admin',
  userId = ADMIN_ID,
  body = {},
  query = {},
  authorizedPermissions = REVIEW_PERMISSIONS,
} = {}) {
  return {
    params: { id: projectId },
    body,
    query,
    user: {
      id: userId,
      role,
    },
    authorizedPermissions,
  };
}

function createAdminProjectQuery(result = []) {
  return {
    populate() {
      return this;
    },
    sort() {
      return this;
    },
    lean() {
      return Promise.resolve(result);
    },
  };
}

function runController(handler, req) {
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

    handler(req, res, (error) => {
      if (error) reject(error);
      else resolve(res);
    });
  });
}

async function withMockedProject(project, fn) {
  const originalFindById = Project.findById;
  Project.findById = async () => project;

  try {
    return await fn();
  } finally {
    Project.findById = originalFindById;
  }
}

async function withMockedNotifications(fn) {
  const originalCreate = Notification.create;
  const originalWarn = console.warn;
  const created = [];

  Notification.create = async (payload) => {
    created.push(payload);
    return {
      ...payload,
      toObject: () => payload,
    };
  };

  console.warn = (...args) => {
    if (String(args[0] || '').startsWith('[socketEmitter] _io is null')) return;
    originalWarn(...args);
  };

  try {
    await fn(created);
  } finally {
    Notification.create = originalCreate;
    console.warn = originalWarn;
  }
}

test('review project list excludes draft projects from review desk query', async () => {
  const originalFind = Project.find;
  let capturedFilter;

  Project.find = (filter) => {
    capturedFilter = filter;
    return createAdminProjectQuery([]);
  };

  try {
    const res = await runController(getAllProjectsForAdmin, createReq());

    assert.deepEqual(res.body, []);
    assert.equal(capturedFilter.status.$in.includes(PROJECT_STATUS.DRAFT), false);
    assert.equal(capturedFilter.status.$in.includes(PROJECT_STATUS.SUBMITTED), true);
    assert.equal(capturedFilter.status.$in.includes(PROJECT_STATUS.UNDER_REVIEW), true);
  } finally {
    Project.find = originalFind;
  }
});

test('review project list rejects Draft as an unauthorized review status filter', async () => {
  await assert.rejects(
    () =>
      runController(getAllProjectsForAdmin, createReq({ query: { status: PROJECT_STATUS.DRAFT } })),
    { message: 'Invalid or unauthorized status filter', status: 400 }
  );
});

test('startReviewProject moves submitted project to under review and writes audit log', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.SUBMITTED });

  await withMockedProject(project, async () => {
    const res = await runController(startReviewProject, createReq());

    assert.equal(res.body, project);
    assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
    assert.equal(project.reviewStartedBy, ADMIN_ID);
    assert.ok(project.reviewStartedAt instanceof Date);
    assert.equal(project.saveCalls, 1);
    assert.deepEqual(project.auditLogs.at(-1), {
      action: 'review_started',
      performedBy: ADMIN_ID,
      previousStatus: PROJECT_STATUS.SUBMITTED,
      newStatus: PROJECT_STATUS.UNDER_REVIEW,
      comment: 'Project review started',
    });
  });
});

test('startReviewProject is idempotent when project is already under review', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    const res = await runController(startReviewProject, createReq());

    assert.equal(res.body, project);
    assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('startReviewProject rejects draft projects as not reviewable', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.DRAFT });

  await withMockedProject(project, async () => {
    await assert.rejects(() => runController(startReviewProject, createReq()), {
      message: 'Invalid status transition',
      status: 400,
    });

    assert.equal(project.status, PROJECT_STATUS.DRAFT);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('startReviewProject blocks users without review permission regardless of User Type', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.SUBMITTED });

  await withMockedProject(project, async () => {
    for (const role of ['admin', 'forecaster', 'duty_reviewer']) {
      await assert.rejects(
        () =>
          runController(
            startReviewProject,
            createReq({
              role,
              userId: `${role}-1`,
              authorizedPermissions: [],
            })
          ),
        { message: 'You do not have permission to perform this action.', status: 403 }
      );
    }
  });
});

test('addReviewComment keeps project status unchanged, writes audit log, and notifies owner', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      const res = await runController(
        addReviewComment,
        createReq({ body: { comment: 'Please verify this annotation.' } })
      );

      assert.equal(res.body, project);
      assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
      assert.equal(project.saveCalls, 1);
      assert.deepEqual(project.auditLogs.at(-1), {
        action: 'comment_added',
        performedBy: ADMIN_ID,
        previousStatus: PROJECT_STATUS.UNDER_REVIEW,
        newStatus: PROJECT_STATUS.UNDER_REVIEW,
        comment: 'Please verify this annotation.',
      });
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].type, 'comment_added');
      assert.equal(notifications[0].recipientUser, project.owner);
      assert.equal(notifications[0].actorUser, ADMIN_ID);
    });
  });
});

test('addReviewComment rejects comments outside submitted or under review states', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.APPROVED });

  await withMockedProject(project, async () => {
    await assert.rejects(
      () => runController(addReviewComment, createReq({ body: { comment: 'Too late.' } })),
      {
        message: 'Comments can only be added while a project is submitted or under review',
        status: 400,
      }
    );
    assert.equal(project.saveCalls, 0);
  });
});

test('addReviewComment rejects draft projects as not reviewable', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.DRAFT });

  await withMockedProject(project, async () => {
    await assert.rejects(
      () => runController(addReviewComment, createReq({ body: { comment: 'Not ready.' } })),
      {
        message: 'Comments can only be added while a project is submitted or under review',
        status: 400,
      }
    );

    assert.equal(project.status, PROJECT_STATUS.DRAFT);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('requestProjectRevision requires a revision comment before mutating project', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await assert.rejects(
      () => runController(requestProjectRevision, createReq({ body: { comment: '   ' } })),
      { message: 'Revision comment is required', status: 400 }
    );
    assert.equal(project.saveCalls, 0);
    assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
  });
});

test('requestProjectRevision moves under review project to revision requested', async () => {
  const project = createFakeProject({
    status: PROJECT_STATUS.UNDER_REVIEW,
    versions: [{ versionNumber: 1, reason: 'revision_baseline' }],
  });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      await runController(
        requestProjectRevision,
        createReq({ body: { comment: 'Fix the advisory area.' } })
      );

      assert.equal(project.status, PROJECT_STATUS.REVISION_REQUESTED);
      assert.equal(project.reviewComment, 'Fix the advisory area.');
      assert.equal(project.rejectedBy, undefined);
      assert.ok(project.reviewedAt instanceof Date);
      assert.equal(project.saveCalls, 1);
      assert.deepEqual(project.auditLogs.at(-1), {
        action: 'revision_requested',
        performedBy: ADMIN_ID,
        previousStatus: PROJECT_STATUS.UNDER_REVIEW,
        newStatus: PROJECT_STATUS.REVISION_REQUESTED,
        comment: 'Fix the advisory area.',
      });
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].type, 'revision_requested');
    });
  });
});

test('requestProjectRevision rejects submitted projects until review starts', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.SUBMITTED });

  await withMockedProject(project, async () => {
    await assert.rejects(
      () =>
        runController(
          requestProjectRevision,
          createReq({ body: { comment: 'Needs review first.' } })
        ),
      { message: 'Invalid status transition', status: 400 }
    );

    assert.equal(project.status, PROJECT_STATUS.SUBMITTED);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('approveProject supports shared forecast charts without a legacy owner', async () => {
  const project = createFakeProject({
    status: PROJECT_STATUS.UNDER_REVIEW,
    owner: null,
  });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      await runController(approveProject, createReq());

      assert.equal(project.status, PROJECT_STATUS.APPROVED);
      assert.equal(project.approvedBy, ADMIN_ID);
      assert.ok(project.reviewedAt instanceof Date);
      assert.equal(project.saveCalls, 1);
      assert.equal(notifications.length, 0);
    });
  });
});

test('approveProject moves under review project to approved and notifies owner', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      await runController(approveProject, createReq());

      assert.equal(project.status, PROJECT_STATUS.APPROVED);
      assert.equal(project.approvedBy, ADMIN_ID);
      assert.ok(project.reviewedAt instanceof Date);
      assert.equal(project.saveCalls, 1);
      assert.deepEqual(project.auditLogs.at(-1), {
        action: 'approved',
        performedBy: ADMIN_ID,
        previousStatus: PROJECT_STATUS.UNDER_REVIEW,
        newStatus: PROJECT_STATUS.APPROVED,
        comment: 'Project approved',
      });
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].type, 'approved');
    });
  });
});

test('approveProject rejects submitted projects until review starts', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.SUBMITTED });

  await withMockedProject(project, async () => {
    await assert.rejects(() => runController(approveProject, createReq()), {
      message: 'Invalid status transition',
      status: 400,
    });

    assert.equal(project.status, PROJECT_STATUS.SUBMITTED);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('rejectProject requires a rejection comment', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await assert.rejects(() => runController(rejectProject, createReq({ body: { comment: '' } })), {
      message: 'Rejection comment is required',
      status: 400,
    });
    assert.equal(project.saveCalls, 0);
    assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
  });
});

test('rejectProject moves under review project to rejected and saves remarks', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      await runController(rejectProject, createReq({ body: { comment: 'Incorrect forecast.' } }));

      assert.equal(project.status, PROJECT_STATUS.REJECTED);
      assert.equal(project.rejectedBy, ADMIN_ID);
      assert.equal(project.reviewComment, 'Incorrect forecast.');
      assert.ok(project.reviewedAt instanceof Date);
      assert.equal(project.saveCalls, 1);
      assert.deepEqual(project.auditLogs.at(-1), {
        action: 'rejected',
        performedBy: ADMIN_ID,
        previousStatus: PROJECT_STATUS.UNDER_REVIEW,
        newStatus: PROJECT_STATUS.REJECTED,
        comment: 'Incorrect forecast.',
      });
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].type, 'rejected');
    });
  });
});

test('rejectProject rejects submitted projects until review starts', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.SUBMITTED });

  await withMockedProject(project, async () => {
    await assert.rejects(
      () => runController(rejectProject, createReq({ body: { comment: 'Not acceptable.' } })),
      { message: 'Invalid status transition', status: 400 }
    );

    assert.equal(project.status, PROJECT_STATUS.SUBMITTED);
    assert.equal(project.saveCalls, 0);
    assert.equal(project.auditLogs.length, 0);
  });
});

test('publishProject only publishes approved projects', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.UNDER_REVIEW });

  await withMockedProject(project, async () => {
    await assert.rejects(() => runController(publishProject, createReq()), {
      message: 'Invalid status transition',
      status: 400,
    });
    assert.equal(project.saveCalls, 0);
    assert.equal(project.status, PROJECT_STATUS.UNDER_REVIEW);
  });
});

test('publishProject moves approved project to published and notifies owner', async () => {
  const project = createFakeProject({ status: PROJECT_STATUS.APPROVED });

  await withMockedProject(project, async () => {
    await withMockedNotifications(async (notifications) => {
      await runController(publishProject, createReq());

      assert.equal(project.status, PROJECT_STATUS.PUBLISHED);
      assert.ok(project.publishedAt instanceof Date);
      assert.equal(project.saveCalls, 1);
      assert.deepEqual(project.auditLogs.at(-1), {
        action: 'published',
        performedBy: ADMIN_ID,
        previousStatus: PROJECT_STATUS.APPROVED,
        newStatus: PROJECT_STATUS.PUBLISHED,
        comment: 'Project published',
      });
      assert.equal(notifications.length, 1);
      assert.equal(notifications[0].type, 'published');
    });
  });
});
