# ChinaLLM API Backend

Small OpenAI-compatible gateway for issuing early-access keys and forwarding non-streaming chat completions to DeepSeek.

## Requirements

- Node.js 22.5 or newer
- A DeepSeek API key

## Local Setup

```powershell
Copy-Item .env.example .env
npm install
npm start
```

Set a strong random `ADMIN_SECRET` and your real `DEEPSEEK_API_KEY` in `.env`. The default service URL is `http://localhost:3000`.

Check health:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Open the administrator dashboard at `http://localhost:3000/` and enter the `ADMIN_SECRET` from `.env`. The secret is kept only for the current browser tab. Bilingual API documentation is available at `http://localhost:3000/docs`.

The dashboard provides overview statistics, early-access registrations, API key creation, and recent usage logs.

Failed administrator authentication is limited to 10 attempts per client per 15 minutes. The 11th failure returns HTTP 429 with `Retry-After`. A correct administrator secret remains usable to prevent malicious lockout.

## Early Access Form

The public landing page submits name, email, company, country, project, preferred model, and expected usage to:

```text
POST /early-access
```

Emails are normalized and deduplicated. Repeated submissions update the existing record. The endpoint accepts five submissions per client per 15 minutes and does not persist client IP addresses.

## Create A Test Key

```powershell
$headers = @{ 'x-admin-secret' = 'your-admin-secret' }
$body = @{ name = 'test-user' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3000/admin/create-key `
  -Headers $headers -ContentType 'application/json' -Body $body
```

The returned `cllm_...` credential is shown once. Only its SHA-256 hash and display prefix are stored.

## Call The API

```python
from openai import OpenAI

client = OpenAI(
    api_key="cllm_your_test_key",
    base_url="http://localhost:3000/v1",
)

response = client.chat.completions.create(
    model="deepseek-chat",
    messages=[{"role": "user", "content": "Hello"}],
)
print(response.choices[0].message.content)
```

Streaming is deliberately unsupported in this MVP.

## View Logs

```powershell
Invoke-RestMethod -Uri http://localhost:3000/admin/logs `
  -Headers @{ 'x-admin-secret' = 'your-admin-secret' }
```

Logs contain key prefixes, model names, token counts, status, and latency. They do not contain full credentials, prompts, or completions.

## Environment Variables

| Variable | Required | Default |
| --- | --- | --- |
| `DEEPSEEK_API_KEY` | Yes | None |
| `ADMIN_SECRET` | Yes | None |
| `PORT` | No | `3000` |
| `DATABASE_PATH` | No | `./data/database.sqlite` |
| `ALLOWED_ORIGINS` | No | Browser CORS disabled |
| `UPSTREAM_TIMEOUT_MS` | No | `30000` |
| `DEEPSEEK_BASE_URL` | No | `https://api.deepseek.com/v1` |

`ALLOWED_ORIGINS` is a comma-separated list. Set it to the exact GitHub Pages origin, such as `https://your-name.github.io`.

For local development, the root landing page automatically uses `http://localhost:3000`. Before GitHub Pages deployment, set the production `PUBLIC_API_BASE_URL` in the root `script.js` to the Render origin.

## Tests

```powershell
npm test
```

Tests use temporary SQLite files and a local fake upstream. They never call DeepSeek.

## Deploy The Landing Page To GitHub Pages

The repository workflow `.github/workflows/pages.yml` publishes only `index.html`, `styles.css`, and `script.js` from the repository root.

1. Push the repository to GitHub with `main` as the default branch.
2. Open repository **Settings > Pages**.
3. Set **Source** to **GitHub Actions**.
4. Run the workflow or push to `main`.

GitHub Pages hosts only the static landing page. It does not run this backend.

## Deploy The Backend To Render

The root `render.yaml` defines the backend web service.

1. Push the repository to GitHub.
2. In Render, create a new Blueprint and select the repository.
3. Set `DEEPSEEK_API_KEY`, `ADMIN_SECRET`, and `ALLOWED_ORIGINS` when prompted.
4. Confirm the persistent disk is attached at `/var/data`.
5. Deploy and verify `https://your-service.onrender.com/health`.
6. Set `PUBLIC_API_BASE_URL` near the top of the root `script.js` to `https://your-service.onrender.com/v1`.

The persistent disk is required. Without it, SQLite keys and logs are lost when the service is replaced or redeployed.
