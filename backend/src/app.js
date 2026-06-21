import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { generateApiKey, hashApiKey, parseBearerToken, safeSecretEqual } from './auth.js';
import { createDeepSeekClient, UpstreamError } from './deepseek.js';
import { validateLeadSubmission } from './leads.js';

const publicDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

function apiError(message, type = 'invalid_request_error') {
  return { error: { message, type } };
}

function corsMiddleware(allowedOrigins) {
  const allowed = new Set(allowedOrigins);
  return (request, response, next) => {
    const origin = request.headers.origin;
    if (origin && allowed.has(origin)) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Vary', 'Origin');
      response.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, X-Admin-Secret');
      response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (request.method === 'OPTIONS') {
      if (allowed.has(origin)) return response.status(204).end();
      return response.status(403).json(apiError('Origin not allowed', 'cors_error'));
    }
    next();
  };
}

export function createApp({ repository, config, deepseekClient }) {
  const app = express();
  const leadRequests = new Map();
  const adminFailures = new Map();
  const client = deepseekClient || createDeepSeekClient({
    apiKey: config.deepseekApiKey,
    baseUrl: config.deepseekBaseUrl,
    timeoutMs: config.upstreamTimeoutMs,
  });

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use((_request, response, next) => {
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self'; font-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'");
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('X-Frame-Options', 'DENY');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    response.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use(corsMiddleware(config.allowedOrigins || []));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.static(publicDirectory, { index: false, etag: false, maxAge: 0 }));

  function requireAdmin(request, response, next) {
    const attemptKey = request.ip;
    if (safeSecretEqual(request.headers['x-admin-secret'], config.adminSecret)) {
      adminFailures.delete(attemptKey);
      return next();
    }
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const current = adminFailures.get(attemptKey);
    const bucket = !current || now - current.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : current;
    bucket.count += 1;
    adminFailures.set(attemptKey, bucket);
    if (bucket.count > 10) {
      response.setHeader('Retry-After', '900');
      return response.status(429).json(apiError(
        'Too many authentication attempts',
        'rate_limit_error'
      ));
    }
    return response.status(401).json(apiError('Unauthorized', 'authentication_error'));
  }

  app.get('/health', (_request, response) => {
    response.json({ status: 'ok', service: 'ChinaLLM API Backend' });
  });

  app.get('/', (_request, response) => {
    response.sendFile(path.join(publicDirectory, 'index.html'));
  });

  app.get('/docs', (_request, response) => {
    response.sendFile(path.join(publicDirectory, 'docs.html'));
  });

  app.post('/admin/create-key', requireAdmin, (request, response) => {
    const name = typeof request.body?.name === 'string' && request.body.name.trim()
      ? request.body.name.trim().slice(0, 120)
      : 'early-user';
    const generated = generateApiKey();
    repository.insertApiKey({
      keyHash: generated.keyHash,
      keyPrefix: generated.keyPrefix,
      name,
    });
    response.status(201).json({ api_key: generated.apiKey, name });
  });

  app.get('/admin/logs', requireAdmin, (_request, response) => {
    response.json({ logs: repository.listUsageLogs() });
  });

  app.get('/admin/leads', requireAdmin, (_request, response) => {
    response.json({ leads: repository.listLeads() });
  });

  app.get('/admin/stats', requireAdmin, (_request, response) => {
    response.json(repository.getStats());
  });

  app.post('/early-access', (request, response) => {
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const key = request.ip;
    const current = leadRequests.get(key);
    const bucket = !current || now - current.startedAt >= windowMs
      ? { startedAt: now, count: 0 }
      : current;
    bucket.count += 1;
    leadRequests.set(key, bucket);
    if (bucket.count > 5) {
      return response.status(429).json(apiError(
        'Too many early-access requests. Please try again later.',
        'rate_limit_error'
      ));
    }

    const result = validateLeadSubmission(request.body);
    if (Object.keys(result.errors).length) {
      return response.status(400).json({
        error: {
          message: 'Check the submitted fields.',
          type: 'validation_error',
          fields: result.errors,
        },
      });
    }
    const saved = repository.upsertLead(result.data);
    return response.status(saved.created ? 201 : 200).json({
      status: saved.created ? 'created' : 'updated',
    });
  });

  app.post('/v1/chat/completions', async (request, response) => {
    const apiKey = parseBearerToken(request.headers.authorization);
    const keyRecord = apiKey ? repository.findActiveKey(hashApiKey(apiKey)) : undefined;
    if (!keyRecord) {
      return response.status(401).json(apiError('Invalid API key', 'authentication_error'));
    }

    const { messages, stream = false } = request.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return response.status(400).json(apiError('messages must be a non-empty array'));
    }
    if (stream) {
      return response.status(400).json(apiError('Streaming is not supported in this MVP version'));
    }

    const model = typeof request.body.model === 'string' && request.body.model
      ? request.body.model
      : 'deepseek-chat';
    const payload = {
      model,
      messages,
      temperature: request.body.temperature ?? 0.7,
      ...(request.body.max_tokens == null ? {} : { max_tokens: request.body.max_tokens }),
      stream: false,
    };
    const startedAt = performance.now();

    try {
      const upstream = await client.createChatCompletion(payload);
      const usage = upstream.data.usage || {};
      repository.insertUsageLog({
        keyPrefix: keyRecord.key_prefix,
        model,
        promptTokens: usage.prompt_tokens || 0,
        completionTokens: usage.completion_tokens || 0,
        totalTokens: usage.total_tokens || 0,
        status: 'success',
        upstreamStatus: upstream.status,
        latencyMs: Math.round(performance.now() - startedAt),
      });
      return response.status(upstream.status).json(upstream.data);
    } catch (error) {
      const upstreamError = error instanceof UpstreamError
        ? error
        : new UpstreamError('DeepSeek service is unavailable', { status: 502 });
      repository.insertUsageLog({
        keyPrefix: keyRecord.key_prefix,
        model,
        status: 'error',
        upstreamStatus: upstreamError.status,
        latencyMs: Math.round(performance.now() - startedAt),
        errorMessage: upstreamError.message,
      });
      if (upstreamError.responseBody) {
        return response.status(upstreamError.status).json(upstreamError.responseBody);
      }
      return response.status(upstreamError.status).json(apiError(
        upstreamError.message,
        'upstream_error'
      ));
    }
  });

  app.use((error, _request, response, _next) => {
    if (error?.type === 'entity.too.large') {
      return response.status(413).json(apiError('Request body is too large'));
    }
    if (error instanceof SyntaxError && error.status === 400) {
      return response.status(400).json(apiError('Malformed JSON body'));
    }
    console.error('Unhandled request error:', error?.message || error);
    return response.status(500).json(apiError('Internal server error', 'server_error'));
  });

  return app;
}
