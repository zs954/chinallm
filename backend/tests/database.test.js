import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { createDatabase } from '../src/database.js';
import { hashApiKey } from '../src/auth.js';

function temporaryDatabase() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chinallm-db-'));
  const databasePath = path.join(directory, 'nested', 'database.sqlite');
  const repository = createDatabase(databasePath);
  return {
    databasePath,
    repository,
    cleanup() {
      repository.close();
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

test('database initializes idempotently and finds active hashed keys', () => {
  const fixture = temporaryDatabase();
  try {
    const rawKey = 'cllm_super-secret-value';
    const keyHash = hashApiKey(rawKey);
    fixture.repository.insertApiKey({ keyHash, keyPrefix: 'cllm_super-s', name: 'first tester' });

    const found = fixture.repository.findActiveKey(keyHash);
    assert.equal(found.key_prefix, 'cllm_super-s');
    assert.equal(found.name, 'first tester');
    assert.equal(found.is_active, 1);
    assert.equal(fixture.repository.findActiveKey(hashApiKey('wrong')), undefined);
    assert.doesNotMatch(fs.readFileSync(fixture.databasePath).toString('utf8'), /super-secret-value/);
  } finally {
    fixture.cleanup();
  }
});

test('usage logs are bounded, redacted, newest first, and limited to 100', () => {
  const fixture = temporaryDatabase();
  try {
    for (let index = 0; index < 105; index += 1) {
      fixture.repository.insertUsageLog({
        keyPrefix: 'cllm_12345678',
        model: `model-${index}`,
        promptTokens: index,
        completionTokens: 2,
        totalTokens: index + 2,
        status: index === 104 ? 'error' : 'success',
        upstreamStatus: index === 104 ? 500 : 200,
        latencyMs: 20 + index,
        errorMessage: index === 104 ? `failure ${'x'.repeat(1200)}` : null,
      });
    }

    const logs = fixture.repository.listUsageLogs();
    assert.equal(logs.length, 100);
    assert.equal(logs[0].model, 'model-104');
    assert.equal(logs[99].model, 'model-5');
    assert.equal(logs[0].error_message.length, 1000);
    assert.equal(logs[0].key_prefix, 'cllm_12345678');
    assert.equal(Object.hasOwn(logs[0], 'key_hash'), false);
    assert.equal(Object.hasOwn(logs[0], 'api_key'), false);
  } finally {
    fixture.cleanup();
  }
});

test('opening an initialized database again preserves data', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chinallm-reopen-'));
  const databasePath = path.join(directory, 'database.sqlite');
  const first = createDatabase(databasePath);
  first.insertApiKey({ keyHash: hashApiKey('cllm_saved'), keyPrefix: 'cllm_saved', name: 'saved' });
  first.close();

  const second = createDatabase(databasePath);
  try {
    assert.equal(second.findActiveKey(hashApiKey('cllm_saved')).name, 'saved');
  } finally {
    second.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('lead upsert normalizes duplicate emails and preserves creation time', () => {
  const fixture = temporaryDatabase();
  try {
    const first = fixture.repository.upsertLead({
      name: 'Ada', email: 'ada@example.com', company: '', country: 'UK',
      project: 'First project', model: 'DeepSeek', usage: 'Under 1M tokens',
    });
    const second = fixture.repository.upsertLead({
      name: 'Ada Updated', email: 'ada@example.com', company: 'Engine Co', country: 'UK',
      project: 'Second project', model: 'Qwen', usage: '1M-10M tokens',
    });
    const leads = fixture.repository.listLeads();

    assert.equal(first.created, true);
    assert.equal(second.created, false);
    assert.equal(leads.length, 1);
    assert.equal(leads[0].name, 'Ada Updated');
    assert.equal(leads[0].project, 'Second project');
    assert.equal(leads[0].created_at, first.lead.created_at);
    assert.ok(leads[0].updated_at >= leads[0].created_at);
  } finally {
    fixture.cleanup();
  }
});

test('stats aggregate leads, active keys, requests, tokens, and statuses', () => {
  const fixture = temporaryDatabase();
  try {
    fixture.repository.upsertLead({
      name: 'Ada', email: 'ada@example.com', company: '', country: 'UK',
      project: 'Project', model: 'DeepSeek', usage: 'Under 1M tokens',
    });
    fixture.repository.insertApiKey({
      keyHash: hashApiKey('cllm_active'), keyPrefix: 'cllm_active', name: 'active',
    });
    fixture.repository.insertUsageLog({
      keyPrefix: 'cllm_active', model: 'deepseek-chat', promptTokens: 3,
      completionTokens: 2, totalTokens: 5, status: 'success', upstreamStatus: 200,
    });
    fixture.repository.insertUsageLog({
      keyPrefix: 'cllm_active', model: 'deepseek-chat', status: 'error', upstreamStatus: 502,
    });
    assert.deepEqual(fixture.repository.getStats(), {
      leads: 1,
      active_keys: 1,
      requests: 2,
      total_tokens: 5,
      successful_requests: 1,
      failed_requests: 1,
    });
  } finally {
    fixture.cleanup();
  }
});
