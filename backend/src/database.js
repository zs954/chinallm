import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function createDatabase(databasePath) {
  fs.mkdirSync(path.dirname(path.resolve(databasePath)), { recursive: true });
  const database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_hash TEXT UNIQUE NOT NULL,
      key_prefix TEXT NOT NULL,
      name TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS usage_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_prefix TEXT NOT NULL,
      model TEXT NOT NULL,
      prompt_tokens INTEGER NOT NULL DEFAULT 0,
      completion_tokens INTEGER NOT NULL DEFAULT 0,
      total_tokens INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL,
      upstream_status INTEGER,
      latency_ms INTEGER NOT NULL DEFAULT 0,
      error_message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS early_access_leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL,
      project TEXT NOT NULL,
      model TEXT NOT NULL,
      usage TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  const insertKey = database.prepare(`
    INSERT INTO api_keys (key_hash, key_prefix, name)
    VALUES (?, ?, ?)
  `);
  const findKey = database.prepare(`
    SELECT id, key_prefix, name, is_active, created_at
    FROM api_keys
    WHERE key_hash = ? AND is_active = 1
  `);
  const insertLog = database.prepare(`
    INSERT INTO usage_logs (
      key_prefix, model, prompt_tokens, completion_tokens, total_tokens,
      status, upstream_status, latency_ms, error_message
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const listLogs = database.prepare(`
    SELECT id, key_prefix, model, prompt_tokens, completion_tokens, total_tokens,
           status, upstream_status, latency_ms, error_message, created_at
    FROM usage_logs
    ORDER BY id DESC
    LIMIT 100
  `);
  const findLead = database.prepare(`
    SELECT id, name, email, company, country, project, model, usage, created_at, updated_at
    FROM early_access_leads WHERE email = ?
  `);
  const insertLead = database.prepare(`
    INSERT INTO early_access_leads (name, email, company, country, project, model, usage)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const updateLead = database.prepare(`
    UPDATE early_access_leads
    SET name = ?, company = ?, country = ?, project = ?, model = ?, usage = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE email = ?
  `);
  const listLeads = database.prepare(`
    SELECT id, name, email, company, country, project, model, usage, created_at, updated_at
    FROM early_access_leads
    ORDER BY id DESC
    LIMIT 500
  `);
  const stats = database.prepare(`
    SELECT
      (SELECT COUNT(*) FROM early_access_leads) AS leads,
      (SELECT COUNT(*) FROM api_keys WHERE is_active = 1) AS active_keys,
      (SELECT COUNT(*) FROM usage_logs) AS requests,
      (SELECT COALESCE(SUM(total_tokens), 0) FROM usage_logs) AS total_tokens,
      (SELECT COUNT(*) FROM usage_logs WHERE status = 'success') AS successful_requests,
      (SELECT COUNT(*) FROM usage_logs WHERE status = 'error') AS failed_requests
  `);

  return {
    insertApiKey({ keyHash, keyPrefix, name }) {
      return insertKey.run(keyHash, keyPrefix, name);
    },
    findActiveKey(keyHash) {
      return findKey.get(keyHash);
    },
    insertUsageLog({
      keyPrefix,
      model,
      promptTokens = 0,
      completionTokens = 0,
      totalTokens = 0,
      status,
      upstreamStatus = null,
      latencyMs = 0,
      errorMessage = null,
    }) {
      const boundedError = errorMessage == null ? null : String(errorMessage).slice(0, 1000);
      return insertLog.run(
        keyPrefix,
        model,
        promptTokens,
        completionTokens,
        totalTokens,
        status,
        upstreamStatus,
        latencyMs,
        boundedError
      );
    },
    listUsageLogs() {
      return listLogs.all();
    },
    upsertLead(lead) {
      const existing = findLead.get(lead.email);
      if (existing) {
        updateLead.run(
          lead.name, lead.company, lead.country, lead.project, lead.model, lead.usage, lead.email
        );
        return { created: false, lead: findLead.get(lead.email) };
      }
      insertLead.run(
        lead.name, lead.email, lead.company, lead.country, lead.project, lead.model, lead.usage
      );
      return { created: true, lead: findLead.get(lead.email) };
    },
    listLeads() {
      return listLeads.all();
    },
    getStats() {
      return { ...stats.get() };
    },
    close() {
      database.close();
    },
  };
}
