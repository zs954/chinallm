export const MODEL_VALUES = ['DeepSeek', 'Qwen', 'Kimi', 'Other'];
export const USAGE_VALUES = [
  'Under 1M tokens',
  '1M-10M tokens',
  '10M-100M tokens',
  '100M+ tokens',
  'Not sure yet',
];

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateLeadSubmission(input = {}) {
  const data = {
    name: clean(input.name),
    email: clean(input.email).toLowerCase(),
    company: clean(input.company),
    country: clean(input.country),
    project: clean(input.project),
    model: clean(input.model),
    usage: clean(input.usage),
  };
  const errors = {};

  if (!data.name) errors.name = 'Name is required.';
  else if (data.name.length > 120) errors.name = 'Name must be 120 characters or fewer.';

  if (!data.email) errors.email = 'Email is required.';
  else if (data.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.email = 'Enter a valid email address.';
  }

  if (data.company.length > 160) errors.company = 'Company must be 160 characters or fewer.';
  if (!data.country) errors.country = 'Country is required.';
  else if (data.country.length > 100) errors.country = 'Country must be 100 characters or fewer.';

  if (!data.project) errors.project = 'Project description is required.';
  else if (data.project.length > 2000) errors.project = 'Project description must be 2,000 characters or fewer.';

  if (!data.model) errors.model = 'Preferred model is required.';
  else if (!MODEL_VALUES.includes(data.model)) errors.model = 'Choose a supported model.';

  if (!data.usage) errors.usage = 'Expected usage is required.';
  else if (!USAGE_VALUES.includes(data.usage)) errors.usage = 'Choose a supported usage range.';

  return { data, errors };
}
