const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const pagePath = path.join(__dirname, '..', 'index.html');

test('page contains the approved product message and sections', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /OpenAI-compatible API for Chinese LLMs/);
  assert.match(html, /Access DeepSeek, Qwen and other Chinese AI models/);
  assert.match(html, /id="features"/);
  assert.match(html, /id="models"/);
  assert.match(html, /id="early-access"/);
  assert.match(html, /api\.chinallmapi\.com\/v1/);
});

test('page includes all labeled early-access fields', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  for (const field of ['name', 'email', 'company', 'country', 'project', 'model', 'usage']) {
    assert.match(html, new RegExp(`label[^>]*for="${field}"`));
    assert.match(html, new RegExp(`(?:input|textarea|select)[^>]*(?:id|name)="${field}"`));
  }
});

test('page includes local assets and social metadata', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /href="styles\.css"/);
  assert.match(html, /src="script\.js"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /name="description"/);
  assert.match(html, /name="theme-color"/);
});

test('page includes an accessible English and Chinese switcher', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /class="language-switcher"/);
  assert.match(html, /role="group"/);
  assert.match(html, /data-language="en"/);
  assert.match(html, /data-language="zh"/);
  assert.match(html, /aria-pressed="true"/);
});

test('page marks content and placeholders for translation', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /data-i18n="hero\.title"/);
  assert.match(html, /data-i18n="form\.emailLabel"/);
  assert.match(html, /data-i18n-placeholder="form\.emailPlaceholder"/);
  assert.match(html, /data-i18n="footer\.note"/);
});

test('page shows accurate model availability and public contact links', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  assert.match(html, /data-model="DeepSeek"[\s\S]*?data-status="available"/);
  assert.match(html, /data-model="Qwen"[\s\S]*?data-status="coming-soon"/);
  assert.match(html, /data-model="Kimi"[\s\S]*?data-status="coming-soon"/);
  assert.match(html, /data-i18n="models\.contactPrompt"/);
  assert.match(html, /href="mailto:juliaburnsfaith@gmail\.com"/);
  assert.match(html, /href="https:\/\/t\.me\/lancer"/);
  assert.match(html, />@lancer</);
});

test('landing page exposes a configurable public API base URL', () => {
  const html = fs.readFileSync(pagePath, 'utf8');
  const script = fs.readFileSync(path.join(__dirname, '..', 'script.js'), 'utf8');
  assert.match(script, /const PUBLIC_API_BASE_URL\s*=/);
  assert.match(script, /PUBLIC_API_BASE_URL.*early-access/s);
  assert.match(html, /data-api-base/);
});

test('repository includes safe GitHub Pages and Render deployment configuration', () => {
  const root = path.join(__dirname, '..');
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'pages.yml'), 'utf8');
  const render = fs.readFileSync(path.join(root, 'render.yaml'), 'utf8');
  const gitignore = fs.readFileSync(path.join(root, '.gitignore'), 'utf8');

  assert.match(workflow, /index\.html/);
  assert.match(workflow, /styles\.css/);
  assert.match(workflow, /script\.js/);
  assert.doesNotMatch(workflow, /cp\s+-r\s+backend/);
  assert.match(render, /rootDir:\s*backend/);
  assert.match(render, /plan:\s*free/);
  assert.match(render, /DATABASE_PATH[\s\S]*\/tmp\/chinallm\/database\.sqlite/);
  assert.doesNotMatch(render, /\bdisk:/);
  assert.match(gitignore, /\.env/);
  assert.match(gitignore, /\*\.sqlite/);
});
