import assert from 'node:assert/strict';
import test from 'node:test';

const PROJECT_ID = 'project-1';
const USER_A = 'forecaster-a';
const USER_B = 'forecaster-b';
const USER_C = 'forecaster-c';
const T1 = new Date('2026-08-12T05:00:00.000Z');
const T2 = new Date('2026-08-12T05:00:01.000Z');

function createPackage({
  updatedAt = T1,
  activeEditors = [],
  participants = [],
  readyEditors = [],
  complete = false,
  saveMode = 'success',
} = {}) {
  return {
    _id: 'package-1',
    owner: 'owner-1',
    status: 'Draft',
    updatedAt,
    charts: [
      {
        chartType: 'analysis',
        project: PROJECT_ID,
        activeEditors: activeEditors.map((user) => ({ user, startedAt: T1 })),
        participants: participants.map((user) => ({
          user,
          firstJoinedAt: T1,
          lastJoinedAt: T1,
        })),
        readyEditors: readyEditors.map((user) => ({ user, readyAt: T1 })),
        claimedBy: activeEditors[0] || null,
        claimedAt: activeEditors.length ? T1 : null,
        readyBy: complete ? readyEditors.at(-1) || null : null,
        readyAt: complete ? T1 : null,
      },
    ],
    chartCompletion: [
      {
        chartType: 'analysis',
        isComplete: complete,
        completedAt: complete ? T1 : null,
        completedBy: complete ? readyEditors.at(-1) || null : null,
      },
    ],
    auditLogs: [],
    async save() {
      this.saveWhere = this.$where;
      if (saveMode === 'stale') {
        const error = new Error('stale package snapshot');
        error.name = 'DocumentNotFoundError';
        throw error;
      }
      return this;
    },
    toObject() {
      return this;
    },
  };
}

function createPopulateQuery(value) {
  const query = {
    populate() {
      return query;
    },
    then(resolve, reject) {
      return Promise.resolve(value).then(resolve, reject);
    },
  };
  return query;
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

async function loadModules() {
  const controller = await import('../controllers/forecastPackageEditingController.js');
  const packageModel = await import('../models/ForecastPackage.js');
  return { controller, ForecastPackage: packageModel.default };
}

async function withPackageMocks(
  ForecastPackage,
  { snapshots, finalPackage, updateResults = [], onUpdate = () => {} },
  fn
) {
  const originalFindOne = ForecastPackage.findOne;
  const originalFindById = ForecastPackage.findById;
  const originalUpdateOne = ForecastPackage.updateOne;
  let findOneIndex = 0;
  let updateIndex = 0;

  ForecastPackage.findOne = () => snapshots[Math.min(findOneIndex++, snapshots.length - 1)];
  ForecastPackage.findById = () => createPopulateQuery(finalPackage || snapshots.at(-1));
  ForecastPackage.updateOne = async (filter, update) => {
    onUpdate(filter, update, updateIndex);
    const result = updateResults[updateIndex] || { matchedCount: 1, modifiedCount: 1 };
    updateIndex += 1;
    return result;
  };

  try {
    await fn({ getFindOneCalls: () => findOneIndex, getUpdateCalls: () => updateIndex });
  } finally {
    ForecastPackage.findOne = originalFindOne;
    ForecastPackage.findById = originalFindById;
    ForecastPackage.updateOne = originalUpdateOne;
  }
}

function request(userId, body = {}, query = {}) {
  return {
    params: { projectId: PROJECT_ID },
    body,
    query,
    user: { id: userId, role: 'forecaster' },
  };
}

function users(rows = []) {
  return rows.map((row) => String(row.user)).sort();
}

test('concurrent chart join retries from the newer snapshot and preserves every editor', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const first = createPackage({ activeEditors: [USER_A], participants: [USER_A], updatedAt: T1 });
  const newer = createPackage({
    activeEditors: [USER_A, USER_C],
    participants: [USER_A, USER_C],
    updatedAt: T2,
  });
  const writes = [];

  await withPackageMocks(
    ForecastPackage,
    {
      snapshots: [first, newer],
      finalPackage: newer,
      updateResults: [
        { matchedCount: 0, modifiedCount: 0 },
        { matchedCount: 1, modifiedCount: 1 },
      ],
      onUpdate(filter, update) {
        writes.push({ filter, update });
      },
    },
    async () => {
      await run(controller.getForecastPackageChartContextByProject, request(USER_B));
    }
  );

  assert.equal(writes.length, 2);
  assert.equal(writes[0].filter.updatedAt, T1);
  assert.equal(writes[1].filter.updatedAt, T2);
  assert.deepEqual(users(writes[1].update.$set['charts.$.activeEditors']), [
    USER_A,
    USER_B,
    USER_C,
  ]);
  assert.deepEqual(users(writes[1].update.$set['charts.$.participants']), [USER_A, USER_B, USER_C]);
});

test('release retry preserves an editor who joined after the stale snapshot was read', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const first = createPackage({
    activeEditors: [USER_A, USER_B],
    participants: [USER_A, USER_B],
    updatedAt: T1,
  });
  const newer = createPackage({
    activeEditors: [USER_A, USER_B, USER_C],
    participants: [USER_A, USER_B, USER_C],
    updatedAt: T2,
  });
  const writes = [];

  await withPackageMocks(
    ForecastPackage,
    {
      snapshots: [first, newer],
      finalPackage: newer,
      updateResults: [
        { matchedCount: 0, modifiedCount: 0 },
        { matchedCount: 1, modifiedCount: 1 },
      ],
      onUpdate(filter, update) {
        writes.push({ filter, update });
      },
    },
    async () => {
      await run(controller.releaseForecastPackageChartEditingByProject, request(USER_B));
    }
  );

  assert.equal(writes.length, 2);
  assert.equal(writes[1].filter.updatedAt, T2);
  assert.deepEqual(users(writes[1].update.$set['charts.$.activeEditors']), [USER_A, USER_C]);
});

test('ready vote retries on a newer snapshot and completes after both participant votes survive', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const first = createPackage({
    activeEditors: [USER_A, USER_B],
    participants: [USER_A, USER_B],
    updatedAt: T1,
    saveMode: 'stale',
  });
  const newer = createPackage({
    activeEditors: [USER_B],
    participants: [USER_A, USER_B],
    readyEditors: [USER_A],
    updatedAt: T2,
  });

  await withPackageMocks(
    ForecastPackage,
    { snapshots: [first, newer], finalPackage: newer },
    async ({ getFindOneCalls }) => {
      await run(
        controller.updateForecastChartCompletionByProject,
        request(USER_B, { isComplete: true })
      );
      assert.equal(getFindOneCalls(), 2);
    }
  );

  assert.deepEqual(first.saveWhere, { status: 'Draft', updatedAt: T1 });
  assert.deepEqual(newer.saveWhere, { status: 'Draft', updatedAt: T2 });
  assert.deepEqual(users(newer.charts[0].readyEditors), [USER_A, USER_B]);
  assert.equal(newer.chartCompletion[0].isComplete, true);
  assert.deepEqual(newer.charts[0].activeEditors, []);
});

test('stale chart reopen does not retry and cannot erase newer readiness state', async () => {
  const { controller, ForecastPackage } = await loadModules();
  const stale = createPackage({
    activeEditors: [],
    participants: [USER_A, USER_B],
    readyEditors: [USER_A, USER_B],
    complete: true,
    updatedAt: T1,
    saveMode: 'stale',
  });

  await withPackageMocks(
    ForecastPackage,
    { snapshots: [stale], finalPackage: stale },
    async ({ getFindOneCalls }) => {
      await assert.rejects(
        () =>
          run(
            controller.updateForecastChartCompletionByProject,
            request(USER_B, { isComplete: false })
          ),
        (error) => {
          assert.equal(error.status, 409);
          return true;
        }
      );
      assert.equal(getFindOneCalls(), 1);
    }
  );

  assert.deepEqual(stale.saveWhere, { status: 'Draft', updatedAt: T1 });
});
