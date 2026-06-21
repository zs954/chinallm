import test from 'node:test';
import assert from 'node:assert/strict';

import { validateLeadSubmission, MODEL_VALUES, USAGE_VALUES } from '../src/leads.js';

const validLead = {
  name: '  Ada Lovelace ',
  email: ' ADA@Example.COM ',
  company: ' Analytical Engines ',
  country: ' United Kingdom ',
  project: ' A developer tool ',
  model: 'DeepSeek',
  usage: '1M-10M tokens',
};

test('validateLeadSubmission normalizes a complete lead', () => {
  const result = validateLeadSubmission(validLead);
  assert.deepEqual(result.errors, {});
  assert.deepEqual(result.data, {
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    company: 'Analytical Engines',
    country: 'United Kingdom',
    project: 'A developer tool',
    model: 'DeepSeek',
    usage: '1M-10M tokens',
  });
});

test('validateLeadSubmission reports required fields', () => {
  assert.deepEqual(validateLeadSubmission({}).errors, {
    name: 'Name is required.',
    email: 'Email is required.',
    country: 'Country is required.',
    project: 'Project description is required.',
    model: 'Preferred model is required.',
    usage: 'Expected usage is required.',
  });
});

test('validateLeadSubmission rejects invalid values and length limits', () => {
  const result = validateLeadSubmission({
    name: 'x'.repeat(121),
    email: 'not-an-email',
    company: 'x'.repeat(161),
    country: 'x'.repeat(101),
    project: 'x'.repeat(2001),
    model: 'Unknown',
    usage: 'Unlimited',
  });
  assert.deepEqual(Object.keys(result.errors).sort(), [
    'company', 'country', 'email', 'model', 'name', 'project', 'usage',
  ]);
});

test('lead options match the supported public form values', () => {
  assert.deepEqual(MODEL_VALUES, ['DeepSeek', 'Qwen', 'Kimi', 'Other']);
  assert.deepEqual(USAGE_VALUES, [
    'Under 1M tokens',
    '1M-10M tokens',
    '10M-100M tokens',
    '100M+ tokens',
    'Not sure yet',
  ]);
});
