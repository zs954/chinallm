# ChinaLLM API Backend MVP Design

## Goal

Build a small OpenAI-compatible DeepSeek gateway for three to five early testers. The MVP validates API access, proxies non-streaming chat completions, records token usage, and provides two protected administrator operations. It does not include accounts, payments, balances, dashboards, model routing, or team management.

## Location And Stack

The backend lives in `backend/` beside the existing static landing page. It uses Node.js, Express, and SQLite. Production code is divided by responsibility rather than placed in one large server file:

- `backend/server.js` loads configuration and starts the HTTP server.
- `backend/src/app.js` composes middleware, routes, and error responses.
- `backend/src/auth.js` generates, hashes, and validates API credentials.
- `backend/src/database.js` owns schema creation and parameterized queries.
- `backend/src/deepseek.js` validates and forwards upstream requests.

## API Contract

### `GET /health`

Returns HTTP 200 without authentication:

```json
{
  "status": "ok",
  "service": "ChinaLLM API Backend"
}
```

### `POST /admin/create-key`

Requires the configured administrator secret in `x-admin-secret`. Accepts an optional JSON `name`. Returns a new credential with a `cllm_` prefix and the resolved name. The raw credential is returned once and is never stored.

### `GET /admin/logs`

Requires `x-admin-secret`. Returns the newest 100 usage records. Records contain only an API key prefix, never a full credential or hash.

### `POST /v1/chat/completions`

Requires `Authorization: Bearer <key>`. The MVP accepts `model`, `messages`, `temperature`, and `max_tokens`. `messages` must be a non-empty array. `stream: true` returns HTTP 400 because streaming is outside this version.

The request is sent to DeepSeek's chat completions endpoint with the server-side DeepSeek credential. Successful upstream JSON is returned unchanged. Compatible upstream error JSON and status codes are preserved when possible.

## Authentication And Secrets

- Generate credentials from 24 cryptographically secure random bytes.
- Store a SHA-256 hash and a short display prefix, not the raw key.
- Compare administrator secrets with a timing-safe comparison after normalizing buffer lengths.
- Never log the DeepSeek key, administrator secret, full client key, authorization header, request messages, or model output.
- Reject startup when `DEEPSEEK_API_KEY` or `ADMIN_SECRET` is missing.
- Keep `.env`, SQLite files, and `node_modules` out of version control.

## Database

The `api_keys` table contains an identifier, unique key hash, display prefix, name, active flag, and creation timestamp.

The `usage_logs` table contains an identifier, key prefix, model, prompt tokens, completion tokens, total tokens, status, upstream HTTP status, latency in milliseconds, a bounded error summary, and creation timestamp.

All queries are parameterized. Schema initialization is idempotent. The database path comes from `DATABASE_PATH` and defaults to a local file inside `backend/data/`.

## Request Flow

1. Parse JSON with a 2 MB limit.
2. Read and hash the bearer credential.
3. Query for an active matching API key.
4. Validate the supported request fields.
5. Forward the request to DeepSeek with an abort timeout.
6. Parse the upstream JSON response.
7. Record a success or error log with key prefix, model, token usage, status, and latency.
8. Return the response to the caller.

Invalid credentials and invalid request bodies do not call DeepSeek. Authentication failures are not written as usage records because no verified key identity exists.

## Error Handling

Local errors use the OpenAI-style shape:

```json
{
  "error": {
    "message": "Invalid API key",
    "type": "invalid_request_error"
  }
}
```

- Invalid admin secret or API key: HTTP 401
- Malformed or oversized JSON: HTTP 400 or 413
- Invalid messages or unsupported streaming: HTTP 400
- DeepSeek timeout: HTTP 504 with `upstream_error`
- Upstream network or non-JSON failure: HTTP 502 with `upstream_error`
- SQLite or unexpected internal failure: HTTP 500 without sensitive details

Error summaries stored in SQLite are bounded to 1,000 characters.

## CORS

CORS is disabled unless `ALLOWED_ORIGINS` contains one or more comma-separated origins. Requests from configured origins receive the appropriate headers. Local development can explicitly use `http://localhost:4173`. The API remains callable by server-side SDKs regardless of browser CORS configuration.

## Configuration

The backend uses:

- `PORT`, default `3000`
- `DEEPSEEK_API_KEY`, required
- `ADMIN_SECRET`, required
- `DATABASE_PATH`, default `backend/data/database.sqlite`
- `ALLOWED_ORIGINS`, optional comma-separated list
- `UPSTREAM_TIMEOUT_MS`, default `30000`
- `DEEPSEEK_BASE_URL`, default `https://api.deepseek.com/v1`

`DEEPSEEK_BASE_URL` exists to support deterministic tests and compatible hosted endpoints; it is not exposed to API clients.

## Repository And Deployment

Use one GitHub repository for both deliverables:

- The repository root contains the static landing page and is published with GitHub Pages.
- `backend/` contains the Express service and is deployed to Render from the same repository.
- GitHub Pages does not execute the backend; browser and SDK clients call the Render service URL.

The repository includes a GitHub Actions workflow that publishes only the static root assets required by the landing page. It excludes `backend/`, tests, local databases, environment files, and design documents from the Pages artifact.

Render uses `backend/` as its root directory, installs dependencies with `npm ci`, and starts the service with `npm start`. Production secrets are configured only in Render environment variables and are never committed to GitHub.

The Render service must attach a persistent disk and set `DATABASE_PATH` to a path on that disk. Without persistent storage, API keys and logs disappear on redeploy or restart. The public API base URL is the Render origin plus `/v1`, for example `https://chinallm-api.onrender.com/v1`.

The README documents local setup, key creation, an OpenAI Python SDK example, environment variables, GitHub Pages publishing, Render deployment, health checks, and the persistent-disk requirement.

## Testing

Use Node's built-in test runner, temporary SQLite databases, and a local fake DeepSeek HTTP server. Tests cover:

- Health response
- Missing and invalid administrator authentication
- Key creation, hashing, one-time raw-key return, and client authentication
- Missing or invalid bearer credentials
- Invalid `messages` and unsupported streaming
- Successful upstream forwarding and unchanged response output
- Upstream JSON errors, non-JSON failures, network failures, and timeouts
- Token, latency, and error logging with credential redaction
- CORS allow-list behavior
- Database schema initialization and newest-first log ordering

No test sends traffic to the real DeepSeek service.
