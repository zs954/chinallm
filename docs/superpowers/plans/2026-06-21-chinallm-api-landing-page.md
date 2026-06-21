# ChinaLLM API Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and run a polished static English landing page that collects early-access interest for ChinaLLM API.

**Architecture:** A semantic `index.html` provides the page and form, `styles.css` owns the dark iOS-inspired responsive presentation, and `script.js` owns form validation, submission, CTA scrolling, and progressive reveal behavior. Node's built-in test runner validates the JavaScript behavior without introducing dependencies.

**Tech Stack:** HTML5, CSS3, browser JavaScript, Node.js built-in test runner, static HTTP server

---

### Task 1: Form behavior contract

**Files:**
- Create: `tests/form.test.js`
- Create: `script.js`

- [x] **Step 1: Write failing tests**

Test that `validateLead` rejects missing fields and invalid email, accepts a complete lead, and that `submitLead` returns demo success without an endpoint while surfacing HTTP failures for a configured endpoint.

- [x] **Step 2: Run tests to verify failure**

Run: `node --test tests/form.test.js`
Expected: FAIL because `script.js` does not exist.

- [x] **Step 3: Implement minimal behavior**

Export `validateLead` and `submitLead` for Node, and initialize DOM interactions only when `document` exists. Keep `FORM_ENDPOINT` as the single integration setting.

- [x] **Step 4: Run tests to verify success**

Run: `node --test tests/form.test.js`
Expected: all tests pass.

### Task 2: Semantic landing-page content

**Files:**
- Create: `index.html`
- Test: `tests/page.test.js`

- [x] **Step 1: Write failing structure tests**

Assert the document includes the approved headline, feature/model sections, OpenAI Python example, all four form fields, accessible labels, metadata, and references to local CSS and JavaScript.

- [x] **Step 2: Run tests to verify failure**

Run: `node --test tests/page.test.js`
Expected: FAIL because `index.html` does not exist.

- [x] **Step 3: Implement semantic HTML**

Create the approved single-page funnel with header, hero, trust strip, features, models, code example, early-access form, honest early-access notice, and footer.

- [x] **Step 4: Run structure tests**

Run: `node --test tests/page.test.js`
Expected: all tests pass.

### Task 3: Dark iOS-inspired visual system

**Files:**
- Create: `styles.css`
- Test: `tests/styles.test.js`

- [x] **Step 1: Write failing CSS checks**

Assert the stylesheet includes responsive breakpoints, reduced-motion handling, focus-visible styling, glass-panel primitives, and mobile-safe form controls.

- [x] **Step 2: Run tests to verify failure**

Run: `node --test tests/styles.test.js`
Expected: FAIL because `styles.css` does not exist.

- [x] **Step 3: Implement the visual system**

Add graphite gradients, ambient blue/violet light, translucent large-radius surfaces, iOS-blue actions, responsive two-column layouts, accessible focus states, and restrained motion.

- [x] **Step 4: Run the complete suite**

Run: `node --test tests/*.test.js`
Expected: all tests pass.

### Task 4: Run and browser verification

**Files:**
- Create: `serve.ps1`

- [x] **Step 1: Add a local server launcher**

Use Python's standard HTTP server on port 4173 so the static site can be opened without a build step.

- [x] **Step 2: Start the server**

Run: `powershell -ExecutionPolicy Bypass -File .\serve.ps1`
Expected: `http://localhost:4173` serves the landing page.

- [ ] **Step 3: Verify in browser**

Check desktop and mobile layout, CTA scrolling, form validation, demo submission success, console errors, and missing assets.

- [x] **Step 4: Re-run automated verification**

Run: `node --test tests/*.test.js`
Expected: all tests pass with zero failures.
