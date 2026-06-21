import path from 'node:path';
import process from 'node:process';
import dotenv from 'dotenv';

import { createApp } from './src/app.js';
import { createDatabase } from './src/database.js';

dotenv.config();

const required = ['DEEPSEEK_API_KEY', 'ADMIN_SECRET'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const port = Number.parseInt(process.env.PORT || '3000', 10);
const databasePath = path.resolve(process.env.DATABASE_PATH || './data/database.sqlite');
const upstreamTimeoutMs = Number.parseInt(process.env.UPSTREAM_TIMEOUT_MS || '30000', 10);
const repository = createDatabase(databasePath);
const app = createApp({
  repository,
  config: {
    adminSecret: process.env.ADMIN_SECRET,
    deepseekApiKey: process.env.DEEPSEEK_API_KEY,
    deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    upstreamTimeoutMs,
    allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').map((value) => value.trim()).filter(Boolean),
  },
});

const server = app.listen(port, () => {
  console.log(`ChinaLLM API backend listening on port ${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down`);
  server.close(() => {
    repository.close();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
