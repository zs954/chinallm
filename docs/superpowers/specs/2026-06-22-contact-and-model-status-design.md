# Contact and Model Status Design

## Goal

Make it easy for prospective users to contact ChinaLLM API and accurately show which model providers are available.

## Contact Links

Add a compact contact area to the landing-page footer with:

- Gmail: `juliaburnsfaith@gmail.com`
- Telegram: `https://t.me/lancer` displayed as `@lancer`

Both links must use clear accessible labels and match the existing iOS-inspired visual style.

## Model Status

The model section will show:

- DeepSeek: available now
- Qwen: coming soon
- Kimi: coming soon

The early-access form will keep DeepSeek, Qwen, Kimi, and Other as interest options. Qwen and Kimi remain research choices, not claims of backend availability.

## Additional Models

Add bilingual copy inviting users who need another model API to contact the project through Gmail or Telegram.

## Localization

All new labels, statuses, and contact copy will have matching English and Chinese translations and will respond to the existing language switcher.

## Scope

This change is frontend-only. It will not add provider credentials, routing, billing, or backend API integrations. Existing DeepSeek behavior remains unchanged.

## Verification

Automated page tests will verify the contact destinations, accurate model statuses, bilingual translation parity, and the absence of claims that Qwen or Kimi are currently available.
