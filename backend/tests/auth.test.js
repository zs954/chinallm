import test from 'node:test';
import assert from 'node:assert/strict';

import {
  generateApiKey,
  hashApiKey,
  parseBearerToken,
  safeSecretEqual,
} from '../src/auth.js';

test('generateApiKey returns a prefixed one-time key with hash and display prefix', () => {
  const result = generateApiKey(() => Buffer.alloc(24, 0xab));

  assert.equal(result.apiKey, `cllm_${'ab'.repeat(24)}`);
  assert.equal(result.keyPrefix, 'cllm_abababab');
  assert.equal(result.keyHash, hashApiKey(result.apiKey));
  assert.equal(result.keyHash.length, 64);
  assert.doesNotMatch(result.keyHash, /cllm_/);
});

test('hashApiKey is deterministic SHA-256 output', () => {
  assert.equal(
    hashApiKey('cllm_test'),
    'a05b871000375b9c88bebd96e6d62bcdad89def3bee8786c4fbadcc7450052c5'
  );
});

test('parseBearerToken accepts only a non-empty Bearer credential', () => {
  assert.equal(parseBearerToken('Bearer cllm_abc'), 'cllm_abc');
  assert.equal(parseBearerToken('bearer cllm_abc'), null);
  assert.equal(parseBearerToken('Basic cllm_abc'), null);
  assert.equal(parseBearerToken('Bearer   '), null);
  assert.equal(parseBearerToken(undefined), null);
});

test('safeSecretEqual compares values without throwing on different lengths', () => {
  assert.equal(safeSecretEqual('correct-secret', 'correct-secret'), true);
  assert.equal(safeSecretEqual('correct-secret', 'wrong-secret'), false);
  assert.equal(safeSecretEqual('short', 'a-much-longer-value'), false);
  assert.equal(safeSecretEqual(undefined, 'secret'), false);
});
