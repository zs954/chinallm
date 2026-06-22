# Contact and Model Status Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add public Gmail and Telegram contact links and accurately label DeepSeek, Qwen, and Kimi availability on the bilingual landing page.

**Architecture:** Keep the change frontend-only. Extend existing static markup, translation dictionaries, and iOS-inspired CSS without changing API routing or backend credentials.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js built-in test runner

---

### Task 1: Lock the content contract in tests

**Files:**
- Modify: `tests/page.test.js`
- Modify: `tests/form.test.js`

- [x] **Step 1: Add failing page assertions**

Assert that the page links to `mailto:juliaburnsfaith@gmail.com` and `https://t.me/lancer`, labels DeepSeek as available, labels Qwen and Kimi as coming soon, and includes the additional-model contact prompt.

- [x] **Step 2: Add failing translation assertions**

Require matching English and Chinese keys for the contact heading, additional-model prompt, and model status labels.

- [x] **Step 3: Run tests and confirm the new assertions fail**

Run: `node --test tests\form.test.js tests\page.test.js`

Expected: FAIL because the new links, Kimi card, and translation keys do not exist.

### Task 2: Implement bilingual model and contact content

**Files:**
- Modify: `index.html`
- Modify: `script.js`

- [x] **Step 1: Update model cards**

Keep DeepSeek as available, change Qwen to coming soon, replace the generic future card with Kimi, and add a contact prompt below the cards.

- [x] **Step 2: Add footer contact links**

Add accessible email and Telegram anchors with visible labels and safe external-link attributes for Telegram.

- [x] **Step 3: Add complete translations**

Add matching `en` and `zh` dictionary keys for contact labels, statuses, Kimi description, and the additional-model prompt.

- [x] **Step 4: Run behavior and page tests**

Run: `node --test tests\form.test.js tests\page.test.js`

Expected: all tests pass.

### Task 3: Style and deploy

**Files:**
- Modify: `styles.css`
- Modify: `tests/styles.test.js`

- [x] **Step 1: Add a failing style assertion**

Require contact-link and model-contact styles, including visible keyboard focus behavior.

- [x] **Step 2: Implement responsive iOS-style contact presentation**

Use compact rounded translucent links, preserve mobile wrapping, and reuse existing color and spacing tokens.

- [x] **Step 3: Run complete frontend verification**

Run: `node --check script.js`

Run: `node --test tests\form.test.js tests\page.test.js tests\styles.test.js`

Expected: syntax succeeds and all frontend tests pass.

- [ ] **Step 4: Commit and push**

Commit the HTML, CSS, JavaScript, tests, spec, and plan; push `main` so GitHub Pages redeploys automatically.

- [ ] **Step 5: Verify production**

Fetch the deployed HTML and script and confirm the contact URLs, accurate model statuses, and bilingual copy are present.
