import assert from 'node:assert/strict';
import test from 'node:test';

import {
  formatManilaDateKey,
  hashViewerToken,
  recordPublishedChartView,
} from '../services/publishedChartViewService.js';

const PROJECT_ID = '507f1f77bcf86cd799439011';
const VIEWER_TOKEN = 'viewer-session-token-1234567890';
const HASH_SECRET = 'test-public-view-hash-secret';

function projectModelReturning(project) {
  return {
    findOne(query) {
      return {
        select(fields) {
          assert.deepEqual(query, { _id: PROJECT_ID, status: 'Published' });
          assert.equal(fields, '_id status');
          return {
            lean: async () => project,
          };
        },
      };
    },
  };
}

test('published chart view counts a valid published chart without storing the raw viewer token', async () => {
  const now = new Date('2026-09-15T16:30:00.000Z');
  let created = null;
  const PublishedChartViewModel = {
    create: async (payload) => {
      created = payload;
      return { _id: '507f191e810c19729de860ea' };
    },
  };

  const result = await recordPublishedChartView(
    { projectId: PROJECT_ID, viewerToken: VIEWER_TOKEN, now, hashSecret: HASH_SECRET },
    {
      ProjectModel: projectModelReturning({ _id: PROJECT_ID, status: 'Published' }),
      PublishedChartViewModel,
    }
  );

  assert.equal(result.counted, true);
  assert.equal(result.dateKey, '2026-09-16');
  assert.equal(created.project, PROJECT_ID);
  assert.equal(created.dateKey, '2026-09-16');
  assert.equal(created.viewerToken, undefined);
  assert.equal(created.viewerHash, hashViewerToken(VIEWER_TOKEN, HASH_SECRET));
  assert.notEqual(created.viewerHash, VIEWER_TOKEN);
});

test('published chart view rejects archived or unpublished charts before creating a view', async () => {
  let createCalled = false;
  const PublishedChartViewModel = {
    create: async () => {
      createCalled = true;
    },
  };

  await assert.rejects(
    () =>
      recordPublishedChartView(
        {
          projectId: PROJECT_ID,
          viewerToken: VIEWER_TOKEN,
          hashSecret: HASH_SECRET,
        },
        {
          ProjectModel: projectModelReturning(null),
          PublishedChartViewModel,
        }
      ),
    (error) => error.statusCode === 404
  );
  assert.equal(createCalled, false);
});

test('published chart view treats the unique project/day/viewer collision as a deduplicated view', async () => {
  const PublishedChartViewModel = {
    create: async () => {
      const error = new Error('duplicate');
      error.code = 11000;
      throw error;
    },
  };

  const result = await recordPublishedChartView(
    {
      projectId: PROJECT_ID,
      viewerToken: VIEWER_TOKEN,
      now: new Date('2026-09-16T01:00:00.000Z'),
      hashSecret: HASH_SECRET,
    },
    {
      ProjectModel: projectModelReturning({ _id: PROJECT_ID, status: 'Published' }),
      PublishedChartViewModel,
    }
  );

  assert.deepEqual(result, {
    counted: false,
    dateKey: '2026-09-16',
    duplicate: true,
  });
});

test('Manila date key crosses midnight independently of UTC date', () => {
  assert.equal(formatManilaDateKey(new Date('2026-09-15T15:59:59.000Z')), '2026-09-15');
  assert.equal(formatManilaDateKey(new Date('2026-09-15T16:00:00.000Z')), '2026-09-16');
});
