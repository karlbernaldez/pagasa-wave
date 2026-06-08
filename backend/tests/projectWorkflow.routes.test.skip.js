import test from 'node:test';
import assert from 'node:assert/strict';

import mongoose from 'mongoose';
import request from 'supertest';

import { MongoMemoryReplSet } from 'mongodb-memory-server';

import app from '../server.js';

import Project from '../models/Project.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

import { PROJECT_STATUS } from '../utils/projectWorkflow.js';
import { generateToken } from '../utils/generateToken.js';

let replset;

// ─────────────────────────────────────────────────────────────
// Lifecycle
// ─────────────────────────────────────────────────────────────

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
  await Project.deleteMany({});
  await Notification.deleteMany({});
  await User.deleteMany({});
});

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

async function createAdminUser() {
  return User.create({
    firstName: 'Admin',
    lastName: 'User',
    email: `admin-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'admin',
  });
}

async function createForecasterUser() {
  return User.create({
    firstName: 'Forecaster',
    lastName: 'User',
    email: `forecaster-${Date.now()}@test.com`,
    password: 'Password123!',
    role: 'forecaster',
  });
}

function createToken(user) {
  return generateToken(user._id);
}

async function createProject({
  owner,
  status = PROJECT_STATUS.SUBMITTED,
} = {}) {
  return Project.create({
    name: 'Test Project',
    description: 'Testing',
    forecastDate: new Date(),
    owner,
    status,
    version: 1,
    versions: [],
    auditLogs: [],
  });
}

// ─────────────────────────────────────────────────────────────
// Route Middleware Tests
// ─────────────────────────────────────────────────────────────

test('non-admin cannot start review', async () => {
  const forecaster = await createForecasterUser();

  const project = await createProject({
    owner: forecaster._id,
    status: PROJECT_STATUS.SUBMITTED,
  });

  const token = createToken(forecaster);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/start-review`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
});

test('non-admin cannot approve project', async () => {
  const forecaster = await createForecasterUser();

  const project = await createProject({
    owner: forecaster._id,
    status: PROJECT_STATUS.UNDER_REVIEW,
  });

  const token = createToken(forecaster);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/approve`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);
});

test('admin cannot review own project', async () => {
  const admin = await createAdminUser();

  const project = await createProject({
    owner: admin._id,
    status: PROJECT_STATUS.SUBMITTED,
  });

  const token = createToken(admin);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/start-review`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);

  assert.match(
    res.body.message,
    /cannot review their own projects/i
  );
});

test('admin cannot approve own project', async () => {
  const admin = await createAdminUser();

  const project = await createProject({
    owner: admin._id,
    status: PROJECT_STATUS.UNDER_REVIEW,
  });

  const token = createToken(admin);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/approve`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 403);

  assert.match(
    res.body.message,
    /cannot review their own projects/i
  );
});

test('admin can review project owned by another user', async () => {
  const admin = await createAdminUser();

  const forecaster = await createForecasterUser();

  const project = await createProject({
    owner: forecaster._id,
    status: PROJECT_STATUS.SUBMITTED,
  });

  const token = createToken(admin);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/start-review`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);

  const updated = await Project.findById(project._id);

  assert.equal(
    updated.status,
    PROJECT_STATUS.UNDER_REVIEW
  );
});

test('admin can approve project owned by another user', async () => {
  const admin = await createAdminUser();

  const forecaster = await createForecasterUser();

  const project = await createProject({
    owner: forecaster._id,
    status: PROJECT_STATUS.UNDER_REVIEW,
  });

  const token = createToken(admin);

  const res = await request(app)
    .patch(`/api/projects/${project._id}/approve`)
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);

  const updated = await Project.findById(project._id);

  assert.equal(
    updated.status,
    PROJECT_STATUS.APPROVED
  );
});