import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database.js';

async function listen(server) {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return server.address().port;
}

async function close(server) {
  if (!server) return;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}

async function createFixture(upstreamHandler = (_request, response) => {
  response.writeHead(200, { 'content-type': 'application/json' });
  response.end(JSON.stringify({
    id: 'chatcmpl_test',
    object: 'chat.completion',
    choices: [{ index: 0, message: { role: 'assistant', content: 'Hello from DeepSeek' } }],
    usage: { prompt_tokens: 5, completion_tokens: 4, total_tokens: 9 },
  }));
}, configOverrides = {}) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chinallm-app-'));
  const repository = createDatabase(path.join(directory, 'database.sqlite'));
  const upstreamServer = http.createServer(upstreamHandler);
  const upstreamPort = await listen(upstreamServer);
  const app = createApp({
    repository,
    config: {
      adminSecret: 'admin-secret',
      deepseekApiKey: 'sk-upstream-secret',
      deepseekBaseUrl: `http://127.0.0.1:${upstreamPort}/v1`,
      upstreamTimeoutMs: 500,
      allowedOrigins: [],
      ...configOverrides,
    },
  });
  const apiServer = http.createServer(app);
  const apiPort = await listen(apiServer);
  const baseUrl = `http://127.0.0.1:${apiPort}`;

  return {
    baseUrl,
    repository,
    async createKey(name = 'test-user') {
      const response = await fetch(`${baseUrl}/admin/create-key`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-secret': 'admin-secret' },
        body: JSON.stringify({ name }),
      });
      return { response, body: await response.json() };
    },
    async cleanup() {
      await close(apiServer);
      await close(upstreamServer);
      repository.close();
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

test('GET /health reports the service without authentication', async () => {
  const fixture = await createFixture();
  try {
    const response = await fetch(`${fixture.baseUrl}/health`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: 'ok', service: 'ChinaLLM API Backend' });
  } finally {
    await fixture.cleanup();
  }
});

test('admin endpoints reject missing or incorrect secrets', async () => {
  const fixture = await createFixture();
  try {
    for (const request of [
      fetch(`${fixture.baseUrl}/admin/create-key`, { method: 'POST' }),
      fetch(`${fixture.baseUrl}/admin/logs`, { headers: { 'x-admin-secret': 'wrong' } }),
    ]) {
      const response = await request;
      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), {
        error: { message: 'Unauthorized', type: 'authentication_error' },
      });
    }
  } finally {
    await fixture.cleanup();
  }
});

test('administrator authentication rate limits repeated failures without locking out a valid secret', async () => {
  const fixture = await createFixture();
  try {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch(`${fixture.baseUrl}/admin/stats`, {
        headers: { 'x-admin-secret': `wrong-${attempt}` },
      });
      assert.equal(response.status, 401);
    }
    const limited = await fetch(`${fixture.baseUrl}/admin/stats`, {
      headers: { 'x-admin-secret': 'wrong-final' },
    });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('retry-after'), '900');
    assert.deepEqual(await limited.json(), {
      error: { message: 'Too many authentication attempts', type: 'rate_limit_error' },
    });

    const valid = await fetch(`${fixture.baseUrl}/admin/stats`, {
      headers: { 'x-admin-secret': 'admin-secret' },
    });
    assert.equal(valid.status, 200);
  } finally {
    await fixture.cleanup();
  }
});

test('admin creates a one-time API key that authenticates chat requests', async () => {
  let upstreamRequest;
  const fixture = await createFixture(async (request, response) => {
    let body = '';
    for await (const chunk of request) body += chunk;
    upstreamRequest = { headers: request.headers, body: JSON.parse(body) };
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      id: 'chatcmpl_test',
      choices: [{ message: { role: 'assistant', content: 'Hello' } }],
      usage: { prompt_tokens: 5, completion_tokens: 4, total_tokens: 9 },
    }));
  });

  try {
    const created = await fixture.createKey('alpha tester');
    assert.equal(created.response.status, 201);
    assert.match(created.body.api_key, /^cllm_[a-f0-9]{48}$/);
    assert.equal(created.body.name, 'alpha tester');

    const invalid = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer cllm_invalid' },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    assert.equal(invalid.status, 401);

    const response = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${created.body.api_key}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.2,
        max_tokens: 100,
      }),
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).choices[0].message.content, 'Hello');
    assert.equal(upstreamRequest.headers.authorization, 'Bearer sk-upstream-secret');
    assert.deepEqual(upstreamRequest.body, {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: 'Hello' }],
      temperature: 0.2,
      max_tokens: 100,
      stream: false,
    });

    const logsResponse = await fetch(`${fixture.baseUrl}/admin/logs`, {
      headers: { 'x-admin-secret': 'admin-secret' },
    });
    const { logs } = await logsResponse.json();
    assert.equal(logs.length, 1);
    assert.equal(logs[0].prompt_tokens, 5);
    assert.equal(logs[0].total_tokens, 9);
    assert.equal(logs[0].status, 'success');
    assert.equal(logs[0].key_prefix, created.body.api_key.slice(0, 13));
    assert.equal(JSON.stringify(logs).includes(created.body.api_key), false);
    assert.equal(JSON.stringify(logs).includes('Hello'), false);
  } finally {
    await fixture.cleanup();
  }
});

test('chat validates messages and rejects streaming before calling upstream', async () => {
  let upstreamCalls = 0;
  const fixture = await createFixture((_request, response) => {
    upstreamCalls += 1;
    response.end('{}');
  });
  try {
    const created = await fixture.createKey();
    for (const body of [{ messages: [] }, { messages: 'wrong' }, { messages: [{}], stream: true }]) {
      const response = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${created.body.api_key}` },
        body: JSON.stringify(body),
      });
      assert.equal(response.status, 400);
      assert.equal((await response.json()).error.type, 'invalid_request_error');
    }
    assert.equal(upstreamCalls, 0);
  } finally {
    await fixture.cleanup();
  }
});

test('upstream JSON errors preserve status and body while logs stay redacted', async () => {
  const fixture = await createFixture(async (_request, response) => {
    response.writeHead(429, { 'content-type': 'application/json' });
    response.end(JSON.stringify({
      error: { message: 'Rate limited for prompt: private prompt', type: 'rate_limit_error' },
    }));
  });
  try {
    const created = await fixture.createKey();
    const response = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${created.body.api_key}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'private prompt' }] }),
    });
    assert.equal(response.status, 429);
    assert.equal((await response.json()).error.type, 'rate_limit_error');

    const logsResponse = await fetch(`${fixture.baseUrl}/admin/logs`, {
      headers: { 'x-admin-secret': 'admin-secret' },
    });
    const { logs } = await logsResponse.json();
    assert.equal(logs[0].upstream_status, 429);
    assert.equal(logs[0].error_message, 'DeepSeek returned HTTP 429');
    assert.equal(JSON.stringify(logs).includes('private prompt'), false);
    assert.equal(JSON.stringify(logs).includes(created.body.api_key), false);
    assert.equal(JSON.stringify(logs).includes('sk-upstream-secret'), false);
  } finally {
    await fixture.cleanup();
  }
});

test('non-JSON upstream responses map to a safe 502 error', async () => {
  const fixture = await createFixture((_request, response) => {
    response.writeHead(502, { 'content-type': 'text/html' });
    response.end('<h1>Proxy failure</h1>');
  });
  try {
    const created = await fixture.createKey();
    const response = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${created.body.api_key}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    assert.equal(response.status, 502);
    assert.deepEqual(await response.json(), {
      error: { message: 'DeepSeek returned an invalid response', type: 'upstream_error' },
    });
  } finally {
    await fixture.cleanup();
  }
});

test('upstream timeouts map to 504 and are logged', async () => {
  const fixture = await createFixture(() => {}, { upstreamTimeoutMs: 30 });
  try {
    const created = await fixture.createKey();
    const response = await fetch(`${fixture.baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${created.body.api_key}` },
      body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] }),
    });
    assert.equal(response.status, 504);
    assert.equal((await response.json()).error.type, 'upstream_error');
    assert.equal(fixture.repository.listUsageLogs()[0].status, 'error');
  } finally {
    await fixture.cleanup();
  }
});

test('CORS allows configured origins and returns JSON for denied preflights', async () => {
  const fixture = await createFixture(undefined, { allowedOrigins: ['https://frontend.example'] });
  try {
    const allowed = await fetch(`${fixture.baseUrl}/health`, {
      headers: { origin: 'https://frontend.example' },
    });
    assert.equal(allowed.headers.get('access-control-allow-origin'), 'https://frontend.example');

    const denied = await fetch(`${fixture.baseUrl}/health`, {
      method: 'OPTIONS',
      headers: { origin: 'https://attacker.example' },
    });
    assert.equal(denied.status, 403);
    assert.equal(denied.headers.get('access-control-allow-origin'), null);
    assert.deepEqual(await denied.json(), {
      error: { message: 'Origin not allowed', type: 'cors_error' },
    });
  } finally {
    await fixture.cleanup();
  }
});

test('malformed JSON receives an OpenAI-shaped 400 error', async () => {
  const fixture = await createFixture();
  try {
    const response = await fetch(`${fixture.baseUrl}/admin/create-key`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-secret': 'admin-secret' },
      body: '{bad json',
    });
    assert.equal(response.status, 400);
    assert.deepEqual(await response.json(), {
      error: { message: 'Malformed JSON body', type: 'invalid_request_error' },
    });
  } finally {
    await fixture.cleanup();
  }
});

test('public early-access endpoint creates and updates a normalized lead', async () => {
  const fixture = await createFixture();
  const lead = {
    name: 'Ada Lovelace',
    email: 'ADA@example.com',
    company: 'Engine Co',
    country: 'United Kingdom',
    project: 'Developer tools',
    model: 'DeepSeek',
    usage: '1M-10M tokens',
  };
  try {
    const created = await fetch(`${fixture.baseUrl}/early-access`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(lead),
    });
    assert.equal(created.status, 201);
    assert.deepEqual(await created.json(), { status: 'created' });

    const updated = await fetch(`${fixture.baseUrl}/early-access`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...lead, email: 'ada@EXAMPLE.com', company: 'New Co' }),
    });
    assert.equal(updated.status, 200);
    assert.deepEqual(await updated.json(), { status: 'updated' });

    const leadsResponse = await fetch(`${fixture.baseUrl}/admin/leads`, {
      headers: { 'x-admin-secret': 'admin-secret' },
    });
    const { leads } = await leadsResponse.json();
    assert.equal(leads.length, 1);
    assert.equal(leads[0].email, 'ada@example.com');
    assert.equal(leads[0].company, 'New Co');
    assert.equal(JSON.stringify(leads).includes('127.0.0.1'), false);
  } finally {
    await fixture.cleanup();
  }
});

test('early-access returns field errors and limits each client to five requests', async () => {
  const fixture = await createFixture();
  try {
    const invalid = await fetch(`${fixture.baseUrl}/early-access`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'bad' }),
    });
    assert.equal(invalid.status, 400);
    const invalidBody = await invalid.json();
    assert.equal(invalidBody.error.type, 'validation_error');
    assert.equal(invalidBody.error.fields.name, 'Name is required.');

    const lead = {
      name: 'Rate Test', company: '', country: 'US', project: 'Test',
      model: 'Qwen', usage: 'Not sure yet',
    };
    for (let index = 0; index < 4; index += 1) {
      const response = await fetch(`${fixture.baseUrl}/early-access`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...lead, email: `rate${index}@example.com` }),
      });
      assert.equal(response.status, 201);
    }
    const limited = await fetch(`${fixture.baseUrl}/early-access`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ...lead, email: 'rate-final@example.com' }),
    });
    assert.equal(limited.status, 429);
    assert.equal((await limited.json()).error.type, 'rate_limit_error');
  } finally {
    await fixture.cleanup();
  }
});

test('administrator lead and stats endpoints require authentication and report totals', async () => {
  const fixture = await createFixture();
  try {
    const unauthorizedLeads = await fetch(`${fixture.baseUrl}/admin/leads`);
    const unauthorizedStats = await fetch(`${fixture.baseUrl}/admin/stats`);
    assert.equal(unauthorizedLeads.status, 401);
    assert.equal(unauthorizedStats.status, 401);

    await fetch(`${fixture.baseUrl}/early-access`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Stats User', email: 'stats@example.com', company: '', country: 'US',
        project: 'Stats', model: 'Kimi', usage: 'Under 1M tokens',
      }),
    });
    await fixture.createKey();

    const response = await fetch(`${fixture.baseUrl}/admin/stats`, {
      headers: { 'x-admin-secret': 'admin-secret' },
    });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      leads: 1,
      active_keys: 1,
      requests: 0,
      total_tokens: 0,
      successful_requests: 0,
      failed_requests: 0,
    });
  } finally {
    await fixture.cleanup();
  }
});
