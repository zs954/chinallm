import crypto from 'node:crypto';

export function hashApiKey(apiKey) {
  return crypto.createHash('sha256').update(String(apiKey)).digest('hex');
}

export function generateApiKey(randomBytes = crypto.randomBytes) {
  const apiKey = `cllm_${randomBytes(24).toString('hex')}`;
  return {
    apiKey,
    keyPrefix: apiKey.slice(0, 13),
    keyHash: hashApiKey(apiKey),
  };
}

export function parseBearerToken(authorization) {
  if (typeof authorization !== 'string' || !authorization.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function safeSecretEqual(received, expected) {
  if (typeof received !== 'string' || typeof expected !== 'string') return false;
  const receivedBuffer = crypto.createHash('sha256').update(received).digest();
  const expectedBuffer = crypto.createHash('sha256').update(expected).digest();
  return crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}
