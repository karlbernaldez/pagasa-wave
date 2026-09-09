import 'dotenv/config';
import mongoose from 'mongoose';

import Role from '../models/Role.js';
import User from '../models/User.js';

const CHAT_PERMISSIONS = ['chat.use_internal', 'chat.forecaster_knowledge'];

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is required.');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const result = await Role.updateOne(
    { key: 'forecaster' },
    { $addToSet: { permissions: { $each: CHAT_PERMISSIONS } } }
  );

  if (result.modifiedCount > 0) {
    const users = await User.updateMany(
      { role: 'forecaster', deletedAt: null },
      { $inc: { sessionVersion: 1 } }
    );
    console.log(
      `Forecaster chat permissions added; invalidated ${users.modifiedCount} active authorization session(s).`
    );
  } else {
    console.log('Forecaster chat permissions already present; no changes required.');
  }
}

main()
  .catch((error) => {
    console.error('[migrateForecasterChatPermissions]', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
