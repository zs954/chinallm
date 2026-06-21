# ChinaLLM API Backend MVP Implementation Plan

**Status:** Implemented and verified on 2026-06-21.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a tested OpenAI-compatible DeepSeek gateway with hashed test keys, SQLite usage logs, GitHub Pages frontend publishing, and Render backend deployment configuration.

**Architecture:** The existing repository root remains the static site. `backend/` is an isolated Node package: `app.js` composes HTTP behavior, `auth.js` handles secrets, `database.js` owns Node 22's built-in SQLite access, and `deepseek.js` owns validated upstream requests. Integration tests run the Express app and a local fake upstream over ephemeral ports.

**Tech Stack:** Node.js 22, Express 5, built-in `node:sqlite`, dotenv, Node test runner, GitHub Actions, Render

---

### Task 1: Backend package and authentication primitives

**Files:**
- Create: `backend/package.json`
- Create: `backend/.env.example`
- Create: `backend/tests/auth.test.js`
- Create: `backend/src/auth.js`

- [ ] **Step 1: Define the backend package**

Create an ESM package requiring Node 22 with `start` and `test` scripts and runtime dependencies on Express and dotenv.

- [ ] **Step 2: Install dependencies**

Run: `npm install`
Expected: `backend/package-lock.json` is created and dependencies install successfully.

- [ ] **Step 3: Write failing authentication tests**

Test `generateApiKey`, deterministic SHA-256 `hashApiKey`, bearer parsing, and timing-safe administrator comparison without exposing secrets.

- [ ] **Step 4: Verify authentication tests fail**

Run: `npm test -- tests/auth.test.js`
Expected: FAIL because `src/auth.js` is absent.

- [ ] **Step 5: Implement authentication helpers**

Generate `cllm_` plus 48 hexadecimal characters, expose a 13-character display prefix, hash full keys with SHA-256, parse only valid bearer credentials, and compare administrator secrets with equal-length buffers.

- [ ] **Step 6: Verify authentication tests pass**

Run: `npm test -- tests/auth.test.js`
Expected: all authentication tests pass.

### Task 2: SQLite persistence

**Files:**
- Create: `backend/tests/database.test.js`
- Create: `backend/src/database.js`

- [ ] **Step 1: Write failing database tests**

Use temporary database files to test idempotent schema initialization, hashed key storage and lookup, newest-first logs, the 100-row limit, and absence of raw credentials in persisted values.

- [ ] **Step 2: Verify database tests fail**

Run: `npm test -- tests/database.test.js`
Expected: FAIL because `src/database.js` is absent.

- [ ] **Step 3: Implement the database boundary**

Create parent directories, initialize `api_keys` and `usage_logs`, and return a small repository API with prepared statements for inserting and finding keys, inserting bounded logs, listing recent logs, and closing the database.

- [ ] **Step 4: Verify database tests pass**

Run: `npm test -- tests/database.test.js`
Expected: all database tests pass.

### Task 3: DeepSeek client and four HTTP endpoints

**Files:**
- Create: `backend/tests/app.test.js`
- Create: `backend/src/deepseek.js`
- Create: `backend/src/app.js`
- Create: `backend/server.js`

- [ ] **Step 1: Write failing endpoint tests**

Start the app on an ephemeral port and verify health, admin authentication, one-time key creation, full-key redaction, invalid client keys, request validation, successful fake-upstream forwarding, token logging, and admin log retrieval.

- [ ] **Step 2: Verify endpoint tests fail**

Run: `npm test -- tests/app.test.js`
Expected: FAIL because the app modules are absent.

- [ ] **Step 3: Implement upstream request handling**

Validate a non-empty messages array, reject streaming, forward only supported fields, abort after the configured timeout, preserve JSON upstream status responses, and classify timeout, network, and non-JSON failures.

- [ ] **Step 4: Implement the Express app and server entrypoint**

Compose the four routes, 2 MB JSON parser, optional CORS allow-list, OpenAI-shaped local errors, dependency injection for tests, bounded usage logging, required production configuration, and graceful database closing on shutdown.

- [ ] **Step 5: Verify endpoint tests pass**

Run: `npm test -- tests/app.test.js`
Expected: all endpoint tests pass.

### Task 4: Failure, timeout, and CORS coverage

**Files:**
- Modify: `backend/tests/app.test.js`
- Modify: `backend/src/app.js`
- Modify: `backend/src/deepseek.js`

- [ ] **Step 1: Add failing edge-case tests**

Test upstream JSON errors, non-JSON responses, timeouts, CORS allowed and denied origins, malformed JSON, and error-log redaction.

- [ ] **Step 2: Verify the new tests fail for the expected behavior gaps**

Run: `npm test -- tests/app.test.js`
Expected: the new edge cases fail while previous endpoint tests still pass.

- [ ] **Step 3: Implement the minimal missing error behavior**

Map timeouts to 504, unavailable upstream responses to 502, preserve JSON upstream errors, restrict CORS headers to configured origins, and ensure logged summaries contain no credentials or prompts.

- [ ] **Step 4: Run the backend suite**

Run: `npm test`
Expected: all backend tests pass.

### Task 5: GitHub Pages and Render delivery

**Files:**
- Create: `.gitignore`
- Create: `.github/workflows/pages.yml`
- Create: `render.yaml`
- Create: `backend/README.md`
- Modify: `index.html`
- Test: `tests/page.test.js`

- [ ] **Step 1: Add a failing deployment-content test**

Assert that the landing page exposes a configurable production API base URL in its code sample and that deployment files exclude secrets and backend files from the Pages artifact.

- [ ] **Step 2: Verify the deployment test fails**

Run: `node --test tests/page.test.js`
Expected: FAIL because deployment configuration is absent.

- [ ] **Step 3: Add repository and deployment configuration**

Ignore environment and database files, publish only `index.html`, `styles.css`, and `script.js` to Pages, define a Render web service rooted at `backend/` with a persistent disk, and document all local and hosted operations without real secrets.

- [ ] **Step 4: Update the landing-page API configuration**

Keep the proposed public domain in visible marketing copy while adding one clearly documented constant for the actual hosted API origin used by future live demos.

- [ ] **Step 5: Run complete verification**

Run: `node --test tests/*.test.js` from the repository root, then `npm test` from `backend/`.
Expected: all frontend and backend tests pass with no failures.
