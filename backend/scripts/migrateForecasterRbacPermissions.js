import 'dotenv/config';
import mongoose from 'mongoose';

import Role from '../models/Role.js';
import User from '../models/User.js';

const REQUIRED_FORECASTER_PERMISSIONS = [
  'projects.view',
  'chat.use_internal',
  'chat.forecaster_knowledge',
];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const result = await Role.updateOne(
    { key: 'forecaster' },
    { $addToSet: { permissions: { $each: REQUIRED_FORECASTER_PERMISSIONS } } }
  );

  if (result.modifiedCount > 0) {
    const users = await User.updateMany(
      { role: 'forecaster', deletedAt: null },
      { $inc: { sessionVersion: 1 } }
    );
    console.log(
      `Forecaster RBAC permissions updated; invalidated ${users.modifiedCount} active authorization session(s).`
    );
  } else {
    console.log('Forecaster RBAC permissions already present; no changes required.');
  }
}

main()
  .catch((error) => {
    console.error('[migrateForecasterRbacPermissions]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
