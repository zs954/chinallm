# ChinaLLM API Language Switcher Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an accessible English and Simplified Chinese switcher that defaults to English and remembers the visitor's selection.

**Architecture:** Extend `script.js` with a complete two-language dictionary and pure translation helpers, then bind those helpers to marked elements in the existing HTML. The current page and form remain single-source; CSS adds only the segmented header control and responsive header grouping.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js built-in test runner, localStorage

---

### Task 1: Translation behavior

**Files:**
- Modify: `tests/form.test.js`
- Modify: `script.js`

- [x] **Step 1: Add failing tests**

Add tests that require `normalizeLanguage`, `translate`, and language-aware `validateLead`; verify unsupported language fallback, representative Chinese copy, complete dictionary parity, and localized validation errors.

- [x] **Step 2: Verify the tests fail**

Run: `node --test tests/form.test.js`
Expected: FAIL because the translation exports do not exist.

- [x] **Step 3: Implement the translation dictionary and pure helpers**

Create complete `en` and `zh` dictionaries, return `en` from `normalizeLanguage` for unsupported values, fall back to English in `translate`, and resolve form validation messages with the active language.

- [x] **Step 4: Verify the tests pass**

Run: `node --test tests/form.test.js`
Expected: all form and translation tests pass.

### Task 2: Page language bindings

**Files:**
- Modify: `tests/page.test.js`
- Modify: `index.html`
- Modify: `script.js`

- [x] **Step 1: Add failing markup tests**

Assert that the header contains a labeled language group with `en` and `zh` buttons, that core content has `data-i18n` keys, and that translated placeholders use `data-i18n-placeholder`.

- [x] **Step 2: Verify the markup tests fail**

Run: `node --test tests/page.test.js`
Expected: FAIL because the language switcher and translation attributes are absent.

- [x] **Step 3: Mark translatable content and bind language state**

Add stable keys throughout `index.html`. Implement `setLanguage` to update text, HTML fragments, placeholders, accessible labels, metadata, document language, button state, and localStorage without resetting the form.

- [x] **Step 4: Verify all behavior and markup tests pass**

Run: `node --test tests/form.test.js tests/page.test.js`
Expected: all tests pass.

### Task 3: iOS segmented control and regression verification

**Files:**
- Modify: `tests/styles.test.js`
- Modify: `styles.css`

- [x] **Step 1: Add a failing style test**

Assert the stylesheet includes `.language-switcher`, selected button styling, and mobile header action layout.

- [x] **Step 2: Verify the style test fails**

Run: `node --test tests/styles.test.js`
Expected: FAIL because switcher styles are absent.

- [x] **Step 3: Style the segmented control**

Add a translucent rounded track, a distinct selected segment, keyboard focus compatibility, and compact mobile sizing consistent with the existing dark iOS visual system.

- [x] **Step 4: Run complete verification**

Run: `node --check script.js && node --test tests/*.test.js`
Expected: script syntax succeeds and all tests pass.

- [ ] **Step 5: Reload the local preview**

Open `http://localhost:4173`, switch to Chinese, reload to confirm persistence, switch back to English, and confirm the form messages follow the active language.
