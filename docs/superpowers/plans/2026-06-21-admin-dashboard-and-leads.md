# ChinaLLM Admin Dashboard And Leads Implementation Plan

**Status:** Implemented and verified on 2026-06-21.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add secure lead collection, bilingual administrator UI, bilingual API docs, and real landing-page submission to the existing backend.

**Architecture:** Extend the SQLite repository with lead upsert and aggregate queries, add validation and fixed-window limiting around `POST /early-access`, and serve framework-free dashboard assets from `backend/public/`. The public landing page posts to the backend origin, while administrator data remains protected by the existing header secret.

**Tech Stack:** Node.js 22, Express 5, built-in SQLite, HTML, CSS, browser JavaScript, Node test runner

---

### Task 1: Lead validation and persistence

**Files:**
- Create: `backend/src/leads.js`
- Create: `backend/tests/leads.test.js`
- Modify: `backend/src/database.js`
- Modify: `backend/tests/database.test.js`

- [ ] **Step 1: Write failing validation tests**

Test normalization, required fields, length limits, email format, accepted models, and accepted usage values.

- [ ] **Step 2: Verify validation tests fail**

Run: `npm test -- tests/leads.test.js`
Expected: FAIL because `src/leads.js` does not exist.

- [ ] **Step 3: Implement validation**

Return normalized lead data and field-specific errors without HTML interpretation.

- [ ] **Step 4: Write failing database tests**

Test lead insertion, lowercase-email deduplication, update timestamps, newest-first listing, and aggregate statistics.

- [ ] **Step 5: Implement repository methods**

Add the idempotent lead table, upsert query, list query, and aggregate statistics query.

- [ ] **Step 6: Verify lead and database tests pass**

Run: `npm test -- tests/leads.test.js tests/database.test.js`
Expected: all tests pass.

### Task 2: Public and administrator lead APIs

**Files:**
- Modify: `backend/src/app.js`
- Modify: `backend/tests/app.test.js`

- [ ] **Step 1: Write failing endpoint tests**

Test public creation, repeated-email updates, invalid input, five-request rate limit, protected lead listing, accurate stats, and absence of IP data.

- [ ] **Step 2: Verify endpoint tests fail**

Run: `npm test -- tests/app.test.js`
Expected: new lead and stats tests fail.

- [ ] **Step 3: Implement rate limiter and routes**

Add trusted proxy mode, an in-memory five-per-15-minute limiter, `POST /early-access`, `GET /admin/leads`, and `GET /admin/stats`.

- [ ] **Step 4: Verify endpoint tests pass**

Run: `npm test -- tests/app.test.js`
Expected: all endpoint tests pass.

### Task 3: Secure bilingual dashboard and documentation

**Files:**
- Create: `backend/public/index.html`
- Create: `backend/public/admin.css`
- Create: `backend/public/admin.js`
- Create: `backend/public/docs.html`
- Create: `backend/public/docs.js`
- Create: `backend/tests/admin-ui.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write failing UI and security tests**

Test root/docs/assets, CSP, no-store and security headers, administrator views, bilingual controls, dictionary parity, sessionStorage authentication, and absence of dynamic `innerHTML`.

- [ ] **Step 2: Verify UI tests fail**

Run: `npm test -- tests/admin-ui.test.js`
Expected: FAIL because assets and routes do not exist.

- [ ] **Step 3: Implement static routes and security headers**

Serve the dashboard and docs explicitly, serve assets from `backend/public/`, and apply the specified strict response headers.

- [ ] **Step 4: Implement the bilingual dashboard**

Build login, overview, leads search, key creation dialog, logs, navigation, logout, error states, and responsive layout using safe DOM properties.

- [ ] **Step 5: Implement bilingual API docs**

Document all public and administrator endpoints with unchanged code examples and remembered language selection.

- [ ] **Step 6: Verify UI and security tests pass**

Run: `npm test -- tests/admin-ui.test.js`
Expected: all UI tests pass.

### Task 4: Connect and expand the landing-page form

**Files:**
- Modify: `index.html`
- Modify: `script.js`
- Modify: `styles.css`
- Modify: `tests/form.test.js`
- Modify: `tests/page.test.js`

- [ ] **Step 1: Write failing landing-page tests**

Test name, company, and country fields; bilingual dictionary parity; complete validation; and submission to `${PUBLIC_API_BASE_URL}/early-access`.

- [ ] **Step 2: Verify landing-page tests fail**

Run: `node --test tests/form.test.js tests/page.test.js`
Expected: new form and endpoint tests fail.

- [ ] **Step 3: Implement fields and real submission**

Add the three fields, localized copy and errors, update the lead validator, and send validated JSON to the backend endpoint.

- [ ] **Step 4: Verify frontend tests pass**

Run: `node --test tests/*.test.js`
Expected: all frontend tests pass.

### Task 5: End-to-end verification and local launch

**Files:**
- Modify: `backend/README.md`

- [ ] **Step 1: Update operating documentation**

Document dashboard login, leads, docs, form endpoint, rate limit, and production origin configuration.

- [ ] **Step 2: Run complete tests and syntax checks**

Run frontend tests, backend tests, and `node --check` on all browser and server JavaScript.
Expected: zero failures.

- [ ] **Step 3: Restart the backend**

Restart the local backend from `.env` and verify `/`, `/docs`, `/health`, dashboard assets, and an authenticated stats request.

- [ ] **Step 4: Verify the landing-page server remains available**

Verify `http://localhost:4173` and its static assets return HTTP 200.
