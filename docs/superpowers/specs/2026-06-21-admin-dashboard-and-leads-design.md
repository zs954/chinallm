# ChinaLLM Admin Dashboard And Leads Design

## Goal

Add a simple bilingual administrative interface to the backend, connect the landing-page early-access form to SQLite, and provide bilingual API documentation without introducing a frontend framework or an administrator account system.

## Scope

### Included

- Dark iOS-inspired administrator interface served at `/`
- Bilingual English and Simplified Chinese switching for the landing page, administrator interface, and API documentation
- Public early-access submission endpoint
- Lead storage, email deduplication, field validation, and rate limiting
- Overview metrics, lead list, API key creation, usage logs, and API documentation
- Security headers, CSP, no-store responses, and safe text rendering

### Excluded

- Administrator usernames, password reset, or multi-user roles
- Customer login or self-service dashboard
- Payments, balances, billing, or quota management
- Editing or deleting leads and API keys
- Export files, email automation, or CRM integrations

## Public Lead Form

The landing-page form collects:

- Name
- Email
- Company
- Country
- What are you building?
- Preferred model
- Expected monthly usage

Name, email, country, project, model, and usage are required. Company is optional. The existing English and Chinese switcher covers all new labels, placeholders, validation messages, loading text, and submission results.

The form sends JSON to `POST /early-access` using the configured backend origin. Demo success mode is removed once the endpoint is configured.

## Lead Storage

Add an `early_access_leads` table with:

- Integer identifier
- Name
- Normalized lowercase email with a unique constraint
- Company
- Country
- Project description
- Preferred model
- Expected usage
- Creation timestamp
- Update timestamp

Repeated submissions with the same normalized email update the profile fields and update timestamp without creating another row. The original creation timestamp is preserved.

## Public Lead Endpoint

### `POST /early-access`

Accepts JSON only. It validates:

- Name: 1-120 characters
- Email: valid basic email format and at most 254 characters
- Company: optional, at most 160 characters
- Country: 1-100 characters
- Project: 1-2,000 characters
- Model: one of DeepSeek, Qwen, Kimi, or Other
- Usage: one of the values supported by the landing-page form

Invalid input returns HTTP 400 with field-specific errors. Successful creation returns HTTP 201. Updating an existing email returns HTTP 200. Neither response exposes internal identifiers.

The endpoint uses a small in-memory, per-IP fixed-window limiter suitable for an MVP. It allows five submissions per 15 minutes and returns HTTP 429 after the limit. The limiter does not persist or expose IP addresses, and no IP is written to SQLite or application logs. Render's trusted proxy setting is enabled so Express reads the connecting client address correctly.

## Administrator Authentication

The dashboard starts with a single administrator-secret prompt. The secret is stored only in `sessionStorage`, sent as `x-admin-secret`, and removed on logout or HTTP 401. It is never placed in a URL, cookie, localStorage, HTML source, or log.

All administrator data endpoints use the existing timing-safe secret comparison:

- `GET /admin/stats`
- `GET /admin/leads`
- `POST /admin/create-key`
- `GET /admin/logs`

The first dashboard HTML response is public but contains no protected data. Protected data loads only after successful API authentication.

## Administrator Data APIs

### `GET /admin/stats`

Returns:

- Total early-access leads
- Active API keys
- Total recorded API requests
- Total tokens
- Successful requests
- Failed requests

### `GET /admin/leads`

Returns the newest 500 leads with all form fields and timestamps. The client performs simple case-insensitive search across name, email, company, country, project, and model.

Existing key-creation and log endpoints retain their current behavior. Full API key values remain one-time responses.

## Administrator Interface

The backend serves framework-free static assets from `backend/public/`:

- `index.html`
- `admin.css`
- `admin.js`
- `docs.html`

The dashboard uses the existing dark iOS visual direction:

- Translucent graphite surfaces
- Blue selected navigation and actions
- Large-radius cards
- Clear status colors with sufficient contrast
- Responsive sidebar on desktop and horizontal tabs on mobile

### Views

- **Overview:** Service health and the six summary metrics
- **Early Access:** Lead table and search field
- **API Keys:** Name input and create button; newly generated key appears once in a copyable dialog
- **Usage Logs:** Recent model, status, token, latency, error summary, and time
- **API Docs:** Link to or embedded navigation for `/docs`

All dynamic values are assigned through `textContent` or DOM property setters. Submitted lead content is never injected through `innerHTML`.

## API Documentation

`GET /docs` serves bilingual human-readable documentation for:

- `GET /health`
- `POST /early-access`
- `POST /admin/create-key`
- `GET /admin/stats`
- `GET /admin/leads`
- `GET /admin/logs`
- `POST /v1/chat/completions`

Documentation includes request and response examples, authentication requirements, error behavior, the lack of streaming support, and Python OpenAI SDK usage. Code examples remain unchanged when switching language.

## Language Behavior

The administrator interface and documentation each provide an `EN / 中文` segmented control. English is the default. The selected language is stored under a dedicated localStorage key and restored on future visits. Administrator authentication remains in sessionStorage and is not coupled to language persistence.

Missing or invalid language state falls back to English. Switching language updates static copy, table headers, empty states, errors, dialog text, form labels, and status messages without reloading protected data.

## Security Headers

Dashboard and documentation responses set:

- `Content-Security-Policy` limited to same-origin scripts, styles, images, and connections
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: DENY`
- `Permissions-Policy` disabling camera, microphone, and geolocation
- `Cache-Control: no-store`

Inline scripts and event handlers are not used so the CSP can exclude `unsafe-inline` for scripts. Production runs behind Render HTTPS. CORS remains restricted to explicitly configured landing-page origins.

## Error And Empty States

- Wrong or expired administrator secret returns to the login screen with a localized message.
- Network failures show a retryable localized error without exposing internals.
- Empty leads and logs have clear empty states.
- Lead rate limits return a localized-friendly API error shape.
- Key creation dialog warns that the key will not be shown again.
- Dashboard health status clearly distinguishes online and unavailable.

## Testing

Automated tests cover:

- Lead schema migration and idempotent initialization
- Required fields, lengths, email format, accepted model and usage values
- Email normalization, insert, and update semantics
- Rate-limit success and rejection without IP persistence
- Administrator authentication for stats and leads
- Accurate aggregate metrics
- Dashboard, docs, and asset routes
- CSP and all security headers
- Static source checks preventing `innerHTML` use for server data
- English and Chinese dictionary parity
- Landing-page field presence and real endpoint submission
- Existing API key, logging, DeepSeek proxy, CORS, and timeout regressions

## Deployment

The landing page remains on GitHub Pages and posts to the Render backend. `PUBLIC_API_BASE_URL` in the root `script.js` is set to the Render service URL before production publishing.

The dashboard and API documentation are served by Render at:

- `https://<render-service>/`
- `https://<render-service>/docs`

SQLite continues to use the persistent Render disk. No administrator secret, DeepSeek key, generated client key, or lead database is committed to GitHub.
