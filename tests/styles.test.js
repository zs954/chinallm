const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const stylePath = path.join(__dirname, '..', 'styles.css');

test('stylesheet provides the approved visual and accessibility primitives', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.match(css, /\.glass-panel/);
  assert.match(css, /backdrop-filter/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(max-width:/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-height:\s*44px/);
});

test('stylesheet includes the iOS language segmented control', () => {
  const css = fs.readFileSync(stylePath, 'utf8');
  assert.match(css, /\.language-switcher/);
  assert.match(css, /\.language-button\[aria-pressed="true"\]/);
  assert.match(css, /\.header-actions/);
});
