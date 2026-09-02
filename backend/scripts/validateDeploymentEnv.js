import fs from 'node:fs';
import path from 'node:path';

import dotenv from 'dotenv';

import { validateSecurityConfig } from '../config/securityConfig.js';

const envPath = process.argv[2];

if (!envPath) {
  console.error('Usage: node scripts/validateDeploymentEnv.js <env-file>');
  process.exit(1);
}

const resolvedPath = path.resolve(envPath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`Backend environment file not found: ${resolvedPath}`);
  process.exit(1);
}

const parsedEnv = dotenv.parse(fs.readFileSync(resolvedPath));

try {
  validateSecurityConfig(parsedEnv);
} catch (error) {
  console.error(`Backend deployment environment is invalid: ${error.message}`);
  process.exit(1);
}

console.log(`Backend deployment environment preflight passed (${parsedEnv.NODE_ENV || 'unset'}).`);
