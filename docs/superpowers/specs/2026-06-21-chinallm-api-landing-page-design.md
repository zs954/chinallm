# ChinaLLM API Landing Page Design

## Goal

Create a focused English landing page that tests whether overseas developers will request early access to an OpenAI-compatible API for Chinese language models. The page must validate interest before any API platform, payment system, dashboard, or complex backend is built.

## Success Criteria

- The page clearly explains the offer within the first screen.
- Visitors can submit an early-access request with their email and product needs.
- The page works on desktop and mobile and can be deployed as a static site on Vercel.
- The form destination can later be connected to Tally, Formspree, or another hosted form endpoint without changing the page structure.
- Initial validation targets are 100 visits, 5-10 email submissions, 2-3 willing testers, and direct questions about pricing, API keys, or supported models.

## Scope

### Included

- One English landing page
- Product positioning and supported-model copy
- OpenAI Python SDK example
- Early-access form
- Client-side validation and submission states
- Responsive layout, accessibility basics, SEO metadata, and subtle motion
- Static Vercel-compatible deployment files

### Excluded

- Functional model API
- Authentication or API-key issuance
- Payments or pricing checkout
- User accounts, dashboard, or usage tracking
- Complex backend or database
- Fabricated testimonials, customer logos, or usage metrics

## Technical Approach

Use plain HTML, CSS, and JavaScript with no framework or build step. This keeps the validation artifact fast, portable, and easy to deploy. Form submission uses a single configuration value in JavaScript. When no endpoint is configured, the page uses an explicitly labeled local demo success state; once a hosted form endpoint is supplied, the same form sends real submissions.

## Page Structure

1. Compact header with the `ChinaLLM API` wordmark and a `Get Early Access` action.
2. Hero section with the core promise, supporting copy, primary CTA, and an API code preview.
3. Short trust strip emphasizing OpenAI compatibility, English documentation, and low setup friction.
4. Feature cards covering the compatible endpoint, simple API key, affordable Chinese models, English documentation, and the planned usage dashboard.
5. Supported-model section for DeepSeek, Qwen, and additional models coming later.
6. Python example that makes the `base_url` replacement obvious.
7. Early-access form.
8. Minimal footer that accurately labels the product as early access.

All prominent CTAs scroll to the form.

## Content

Primary headline:

> OpenAI-compatible API for Chinese LLMs

Supporting message:

> Access DeepSeek, Qwen and other Chinese AI models through one simple API.

Audience message:

> Built for indie hackers, AI developers, and small teams who want affordable inference.

The code example uses the OpenAI Python SDK with `https://api.chinallmapi.com/v1` as the proposed base URL and `YOUR_API_KEY` as the credential placeholder.

## Visual Direction

Use a dark iOS-inspired visual system that still feels credible as developer infrastructure:

- Graphite-to-deep-blue background with restrained blue and violet ambient light
- Large-radius glass panels with subtle translucent borders and background blur
- iOS-blue gradient for the main CTA, with restrained glow
- Large, tightly composed headings and generous whitespace
- Feature rows influenced by iOS settings cards
- Compact pill treatments for model availability
- Dark translucent form controls with a soft blue focus ring
- Floating glass treatment for code samples
- Gentle entrance, hover, and spring-like feedback that respects `prefers-reduced-motion`

Avoid generic neon AI styling, excessive animation, and unsupported trust claims.

## Form Design

Collect:

- Email, required and email-validated
- What are you building?, required free text
- Which model do you want to use?, required choice: DeepSeek, Qwen, Kimi, or Other
- Expected monthly usage?, required choice with practical usage bands

Submission states:

- Idle
- Client-side validation feedback
- Loading with duplicate submissions disabled
- Success with a concise confirmation
- Failure with a retryable error message

The endpoint is defined once in JavaScript. An empty endpoint activates the local demo behavior and must be easy to identify in the source.

## Responsive And Accessible Behavior

- Use a wide two-column hero on desktop and a single-column flow on mobile.
- Keep touch targets at least 44 pixels high.
- Preserve readable contrast on glass surfaces.
- Provide visible keyboard focus and semantic labels.
- Use semantic sections and logical heading order.
- Disable nonessential motion when reduced motion is requested.

## Metadata

Include an English page title, description, canonical-ready metadata, Open Graph fields, theme color, and a simple inline favicon treatment. Social metadata must not reference an asset that does not exist.

## Verification

- Open the page directly from the filesystem and through a local HTTP server.
- Test common desktop and mobile widths.
- Confirm every CTA reaches the form.
- Exercise required-field and invalid-email errors.
- Exercise demo success and configured-endpoint failure handling.
- Check keyboard navigation and reduced-motion behavior.
- Confirm there are no runtime console errors or missing local assets.

