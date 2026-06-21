import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

import { createApp } from '../src/app.js';
import { createDatabase } from '../src/database.js';

async function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'chinallm-ui-'));
  const repository = createDatabase(path.join(directory, 'database.sqlite'));
  const app = createApp({
    repository,
    config: {
      adminSecret: 'admin-secret',
      deepseekApiKey: 'sk-test',
      deepseekBaseUrl: 'http://127.0.0.1:1/v1',
      upstreamTimeoutMs: 50,
      allowedOrigins: [],
    },
  });
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    async cleanup() {
      await new Promise((resolve) => server.close(resolve));
      repository.close();
      fs.rmSync(directory, { recursive: true, force: true });
    },
  };
}

test('dashboard and docs are served with strict security headers', async () => {
  const context = await fixture();
  try {
    for (const route of ['/', '/docs']) {
      const response = await fetch(`${context.baseUrl}${route}`);
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.match(response.headers.get('content-type'), /text\/html/);
      assert.match(response.headers.get('content-security-policy'), /default-src 'self'/);
      assert.match(response.headers.get('content-security-policy'), /script-src 'self'/);
      assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
      assert.equal(response.headers.get('x-frame-options'), 'DENY');
      assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.match(response.headers.get('permissions-policy'), /camera=\(\)/);
      assert.match(html, /EN/);
      assert.match(html, /中文/);
    }
  } finally {
    await context.cleanup();
  }
});

test('dashboard exposes all administrator views and protected-data placeholders', async () => {
  const context = await fixture();
  try {
    const html = await (await fetch(`${context.baseUrl}/`)).text();
    for (const id of ['login-view', 'overview-view', 'leads-view', 'keys-view', 'logs-view']) {
      assert.match(html, new RegExp(`id="${id}"`));
    }
    assert.match(html, /sessionStorage/);
    assert.match(html, /admin\.js/);
    assert.match(html, /admin\.css/);
    assert.match(html, /href="\/docs"/);
  } finally {
    await context.cleanup();
  }
});

test('dashboard scripts use safe DOM rendering and complete bilingual dictionaries', () => {
  const publicDir = path.join(process.cwd(), 'public');
  const adminScript = fs.readFileSync(path.join(publicDir, 'admin.js'), 'utf8');
  const docsScript = fs.readFileSync(path.join(publicDir, 'docs.js'), 'utf8');

  assert.doesNotMatch(adminScript, /\.innerHTML\s*=/);
  assert.doesNotMatch(docsScript, /\.innerHTML\s*=/);
  assert.match(adminScript, /sessionStorage\.setItem/);
  assert.match(adminScript, /x-admin-secret/);
  assert.match(adminScript, /const ADMIN_TRANSLATIONS/);
  assert.match(docsScript, /const DOC_TRANSLATIONS/);
  assert.match(adminScript, /overview\.title/);
  assert.match(adminScript, /'zh'/);
  assert.match(docsScript, /docs\.title/);
  assert.match(docsScript, /'zh'/);
});

test('static dashboard assets are available and no-store', async () => {
  const context = await fixture();
  try {
    for (const asset of ['/admin.css', '/admin.js', '/docs.js']) {
      const response = await fetch(`${context.baseUrl}${asset}`);
      assert.equal(response.status, 200);
      assert.equal(response.headers.get('cache-control'), 'no-store');
    }
  } finally {
    await context.cleanup();
  }
});
