const test = require('node:test');
const assert = require('node:assert/strict');

const {
  TRANSLATIONS,
  normalizeLanguage,
  translate,
  setLanguage,
  validateLead,
  submitLead,
} = require('../script.js');

const validLead = {
  name: 'Ada Lovelace',
  email: 'dev@example.com',
  company: 'Engine Co',
  country: 'United Kingdom',
  project: 'An AI coding assistant',
  model: 'DeepSeek',
  usage: '1M-10M tokens',
};

test('validateLead reports every missing field', () => {
  assert.deepEqual(validateLead({}), {
    name: 'Enter your name.',
    email: 'Enter your email address.',
    country: 'Enter your country.',
    project: 'Tell us what you are building.',
    model: 'Choose a model.',
    usage: 'Choose an expected usage range.',
  });
});

test('validateLead rejects an invalid email', () => {
  assert.equal(validateLead({ ...validLead, email: 'not-an-email' }).email, 'Enter a valid email address.');
});

test('validateLead accepts a complete lead', () => {
  assert.deepEqual(validateLead(validLead), {});
});

test('submitLead uses demo mode when no endpoint is configured', async () => {
  const result = await submitLead(validLead, '', () => assert.fail('fetch should not run'));
  assert.deepEqual(result, { ok: true, demo: true });
});

test('submitLead posts JSON to a configured endpoint', async () => {
  let request;
  const result = await submitLead(validLead, 'https://example.com/leads', async (url, options) => {
    request = { url, options };
    return { ok: true };
  });

  assert.deepEqual(result, { ok: true, demo: false });
  assert.equal(request.url, 'https://example.com/leads');
  assert.equal(request.options.method, 'POST');
  assert.equal(request.options.headers['Content-Type'], 'application/json');
  assert.deepEqual(JSON.parse(request.options.body), validLead);
});

test('submitLead surfaces endpoint failures', async () => {
  await assert.rejects(
    submitLead(validLead, 'https://example.com/leads', async () => ({ ok: false })),
    /Unable to submit/
  );
});

test('normalizeLanguage defaults unsupported values to English', () => {
  assert.equal(normalizeLanguage('zh'), 'zh');
  assert.equal(normalizeLanguage('en'), 'en');
  assert.equal(normalizeLanguage('fr'), 'en');
  assert.equal(normalizeLanguage(undefined), 'en');
});

test('translate returns Chinese copy and falls back to English', () => {
  assert.equal(translate('nav.access', 'zh'), '申请内测');
  assert.equal(translate('nav.access', 'en'), 'Get Early Access');
  assert.equal(translate('missing.key', 'zh'), 'missing.key');
});

test('English and Chinese dictionaries have matching keys', () => {
  assert.deepEqual(Object.keys(TRANSLATIONS.zh).sort(), Object.keys(TRANSLATIONS.en).sort());
  assert.ok(Object.keys(TRANSLATIONS.en).length >= 50);
});

test('validateLead returns localized Chinese messages', () => {
  assert.deepEqual(validateLead({}, 'zh'), {
    name: '请输入姓名。',
    email: '请输入邮箱地址。',
    country: '请输入国家或地区。',
    project: '请告诉我们你正在开发什么。',
    model: '请选择模型。',
    usage: '请选择预计用量范围。',
  });
});

test('validateLead accepts company as optional and enforces profile lengths', () => {
  assert.deepEqual(validateLead({ ...validLead, company: '' }), {});
  const errors = validateLead({
    ...validLead,
    name: 'x'.repeat(121),
    company: 'x'.repeat(161),
    country: 'x'.repeat(101),
    project: 'x'.repeat(2001),
  });
  assert.deepEqual(Object.keys(errors).sort(), ['company', 'country', 'name', 'project']);
});

test('submitLead can post to the configured early-access endpoint', async () => {
  let request;
  await submitLead(validLead, 'https://api.example.com/early-access', async (url, options) => {
    request = { url, options };
    return { ok: true };
  });
  assert.equal(request.url, 'https://api.example.com/early-access');
  assert.deepEqual(JSON.parse(request.options.body), validLead);
});

test('setLanguage updates static and dynamic copy and persists the choice', () => {
  const originalDocument = global.document;
  const originalStorage = global.localStorage;
  const content = { dataset: { i18n: 'nav.access' }, innerHTML: '' };
  const placeholder = { dataset: { i18nPlaceholder: 'form.projectPlaceholder' }, placeholder: '' };
  const group = { dataset: { i18nAriaLabel: 'language.label' }, setAttribute(name, value) { this[name] = value; } };
  const enButton = { dataset: { language: 'en' }, setAttribute(name, value) { this[name] = value; } };
  const zhButton = { dataset: { language: 'zh' }, setAttribute(name, value) { this[name] = value; } };
  const dynamicMessage = { dataset: { i18nState: 'form.emailRequired' }, textContent: '' };
  const description = {};
  const ogDescription = {};
  let stored;

  global.localStorage = { setItem(key, value) { stored = { key, value }; } };
  global.document = {
    documentElement: { lang: 'en' },
    title: '',
    querySelector(selector) {
      if (selector === 'meta[name="description"]') return description;
      if (selector === 'meta[property="og:description"]') return ogDescription;
      return null;
    },
    querySelectorAll(selector) {
      return {
        '[data-i18n]': [content],
        '[data-i18n-placeholder]': [placeholder],
        '[data-i18n-aria-label]': [group],
        '[data-language]': [enButton, zhButton],
        '[data-i18n-state]': [dynamicMessage],
      }[selector] || [];
    },
  };

  try {
    assert.equal(setLanguage('zh'), 'zh');
    assert.equal(global.document.documentElement.lang, 'zh-CN');
    assert.equal(content.innerHTML, '申请内测');
    assert.equal(placeholder.placeholder, '简单描述你的产品或使用场景');
    assert.equal(group['aria-label'], '选择语言');
    assert.equal(enButton['aria-pressed'], 'false');
    assert.equal(zhButton['aria-pressed'], 'true');
    assert.equal(dynamicMessage.textContent, '请输入邮箱地址。');
    assert.deepEqual(stored, { key: 'chinallm-language', value: 'zh' });
  } finally {
    global.document = originalDocument;
    global.localStorage = originalStorage;
  }
});
