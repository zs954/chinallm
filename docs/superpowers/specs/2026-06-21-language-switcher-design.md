# ChinaLLM API Language Switcher Design

## Goal

Add an English and Simplified Chinese language switcher to the existing static landing page without changing its visual direction or introducing a framework.

## User Experience

- English remains the default language for first-time visitors.
- A compact iOS-style `EN / 中文` segmented control appears in the sticky header.
- Changing language updates the page immediately without navigation or reload.
- The selected language is stored in `localStorage` and restored on later visits.
- If storage is unavailable or contains an unsupported value, the page falls back to English.

## Translation Scope

Translate:

- Page title and description metadata
- Navigation and CTA labels
- Hero, trust strip, feature, model, code, form, and footer copy
- Form labels, placeholders, select prompts, validation errors, loading text, success messages, and failure messages
- Relevant accessibility labels

Keep product names, model names, Python code, API paths, and the proposed base URL unchanged.

## Technical Design

Maintain one HTML document. Translatable DOM elements receive stable `data-i18n` keys, while placeholders and accessible labels use dedicated attribute keys. A translation dictionary in `script.js` contains complete `en` and `zh` values.

`setLanguage(language)` validates the requested language, updates text and attributes, sets `document.documentElement.lang`, updates metadata, synchronizes the segmented control, and persists the choice when storage is available. Form validation and submission messages resolve through the same dictionary so dynamic feedback matches the active language.

## Accessibility

- The switcher uses native buttons with a group label.
- Each option exposes its current state through `aria-pressed`.
- Both options have visible keyboard focus.
- Chinese mode sets the document language to `zh-CN`; English mode sets it to `en`.
- Switching language does not move focus or reset form input.

## Error Handling

- Unsupported language codes resolve to English.
- Storage read and write errors are caught and ignored.
- Missing translation keys fall back to the English value so the page never displays `undefined`.
- Existing form endpoint failures remain retryable and are shown in the active language.

## Verification

- Test English default and unsupported-language fallback.
- Test representative English and Chinese translations.
- Test localized validation and submission messages.
- Test the presence and accessibility attributes of the language control.
- Test that all declared translation keys exist in both languages.
- Reload the running page and verify both language states in the browser.

