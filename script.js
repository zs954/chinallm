const FORM_ENDPOINT = '';
const PUBLIC_API_BASE_URL = typeof location !== 'undefined' && ['localhost', '127.0.0.1'].includes(location.hostname)
  ? 'http://localhost:3000'
  : 'https://chinallm-api.onrender.com';
const LANGUAGE_STORAGE_KEY = 'chinallm-language';

const TRANSLATIONS = {
  en: {
    'meta.title': 'ChinaLLM API - Chinese LLMs, One Simple API',
    'meta.description': 'Access DeepSeek, Qwen and other Chinese AI models through one OpenAI-compatible API.',
    'language.label': 'Choose language',
    'nav.access': 'Get Early Access',
    'hero.eyebrow': 'Private beta opening soon',
    'hero.title': 'OpenAI-compatible API for <span>Chinese LLMs</span>',
    'hero.lead': 'Access DeepSeek, Qwen and other Chinese AI models through one simple API.',
    'hero.audience': 'Built for indie hackers, AI developers, and small teams who want affordable inference without a new integration.',
    'hero.access': 'Get Early Access <span aria-hidden="true">→</span>',
    'hero.codeLink': 'See the code <span aria-hidden="true">↓</span>',
    'hero.microcopy': 'No credit card. Tell us what you want to build.',
    'code.ready': 'Ready',
    'code.compatible': 'OpenAI SDK compatible',
    'trust.compatibleTitle': 'Drop-in compatible',
    'trust.compatibleText': 'Keep your OpenAI SDK',
    'trust.englishTitle': 'English-first',
    'trust.englishText': 'Clear docs and support',
    'trust.shipTitle': 'Built to ship',
    'trust.shipText': 'One key, one endpoint',
    'features.kicker': 'The simple path',
    'features.title': 'More models.<br><span>Less integration.</span>',
    'features.lead': 'Your existing OpenAI code is already most of the way there.',
    'features.endpointTitle': 'OpenAI-compatible endpoint',
    'features.endpointText': 'Change the base URL and model name. Keep the tools and patterns your team already knows.',
    'features.keyTitle': 'Simple API key',
    'features.keyText': 'One credential across supported models, with no provider-by-provider setup.',
    'features.priceTitle': 'Affordable inference',
    'features.priceText': 'Explore capable Chinese models with cost-conscious teams in mind.',
    'features.docsTitle': 'English documentation',
    'features.docsText': 'Quickstarts and examples written for global developers from day one.',
    'features.soon': 'Coming soon',
    'features.dashboardTitle': 'Usage dashboard',
    'features.dashboardText': 'Track requests, spend, and model usage in one calm, focused view.',
    'models.kicker': 'Model access',
    'models.title': 'The models developers<br><span>are asking for.</span>',
    'models.available': 'Available now',
    'models.comingSoon': 'Coming soon',
    'models.deepseekText': 'Reasoning and general-purpose models.',
    'models.qwenText': 'Multilingual and coding-capable models.',
    'models.kimiText': 'Long-context models from Moonshot AI.',
    'models.contactPrompt': 'Need another model API? Contact us.',
    'models.planned': 'Planned',
    'models.moreTitle': 'More coming',
    'models.moreText': 'Tell us which provider should be next.',
    'code.kicker': 'One tiny change',
    'code.title': 'Your code,<br><span>new possibilities.</span>',
    'code.lead': 'Use the official OpenAI SDK. Just point it to a different base URL.',
    'code.copy': 'Ready to copy',
    'access.kicker': 'Private beta',
    'access.title': 'Help shape the API<br><span>you want to use.</span>',
    'access.lead': "We're talking to a small group of developers before we build the full product. Tell us what matters to you.",
    'access.benefit1': 'Early API access',
    'access.benefit2': 'A direct line to the builders',
    'access.benefit3': 'Influence model and pricing priorities',
    'form.title': 'Request early access',
    'form.subtitle': 'Takes less than a minute.',
    'form.nameLabel': 'Name',
    'form.namePlaceholder': 'Your name',
    'form.emailLabel': 'Email address',
    'form.emailPlaceholder': 'you@company.com',
    'form.companyLabel': 'Company',
    'form.companyPlaceholder': 'Company or team (optional)',
    'form.countryLabel': 'Country or region',
    'form.countryPlaceholder': 'United States',
    'form.projectLabel': 'What are you building?',
    'form.projectPlaceholder': 'A short description of your product or use case',
    'form.modelLabel': 'Preferred model',
    'form.modelPrompt': 'Choose one',
    'form.other': 'Other',
    'form.usageLabel': 'Expected monthly usage',
    'form.usagePrompt': 'Choose range',
    'form.usageUnder': 'Under 1M tokens',
    'form.usageMid': '1M-10M tokens',
    'form.usageHigh': '10M-100M tokens',
    'form.usageMax': '100M+ tokens',
    'form.usageUnknown': 'Not sure yet',
    'form.submit': 'Get Early Access',
    'form.loading': 'Requesting access...',
    'form.privacy': "No spam. Just beta updates and an invitation when we're ready.",
    'form.nameRequired': 'Enter your name.',
    'form.nameTooLong': 'Name must be 120 characters or fewer.',
    'form.emailRequired': 'Enter your email address.',
    'form.emailInvalid': 'Enter a valid email address.',
    'form.companyTooLong': 'Company must be 160 characters or fewer.',
    'form.countryRequired': 'Enter your country.',
    'form.countryTooLong': 'Country must be 100 characters or fewer.',
    'form.projectRequired': 'Tell us what you are building.',
    'form.projectTooLong': 'Project description must be 2,000 characters or fewer.',
    'form.modelRequired': 'Choose a model.',
    'form.usageRequired': 'Choose an expected usage range.',
    'form.demoSuccess': "You're on the preview list. Connect FORM_ENDPOINT in script.js to collect live submissions.",
    'form.success': "You're on the list. We'll be in touch soon.",
    'form.error': 'Unable to submit your request. Please try again.',
    'contact.title': 'Contact',
    'footer.note': 'Early access preview · Built for developers everywhere',
  },
  zh: {
    'meta.title': 'ChinaLLM API - 一个接口，连接中国大模型',
    'meta.description': '通过一个兼容 OpenAI 的 API，访问 DeepSeek、Qwen 等中国 AI 模型。',
    'language.label': '选择语言',
    'nav.access': '申请内测',
    'hero.eyebrow': '私测即将开放',
    'hero.title': '兼容 OpenAI 的<span>中国大模型 API</span>',
    'hero.lead': '通过一个简单的 API，访问 DeepSeek、Qwen 等中国 AI 模型。',
    'hero.audience': '专为独立开发者、AI 开发者和追求高性价比推理的小型团队打造，无需重新集成。',
    'hero.access': '申请内测 <span aria-hidden="true">→</span>',
    'hero.codeLink': '查看代码 <span aria-hidden="true">↓</span>',
    'hero.microcopy': '无需信用卡。告诉我们你想开发什么。',
    'code.ready': '已就绪',
    'code.compatible': '兼容 OpenAI SDK',
    'trust.compatibleTitle': '无缝兼容',
    'trust.compatibleText': '继续使用 OpenAI SDK',
    'trust.englishTitle': '英文优先',
    'trust.englishText': '清晰的文档与支持',
    'trust.shipTitle': '快速上线',
    'trust.shipText': '一个密钥，一个端点',
    'features.kicker': '更简单的路径',
    'features.title': '更多模型。<br><span>更少集成。</span>',
    'features.lead': '你现有的 OpenAI 代码几乎无需修改。',
    'features.endpointTitle': '兼容 OpenAI 的端点',
    'features.endpointText': '只需更换基础地址和模型名称，继续使用团队熟悉的工具与开发方式。',
    'features.keyTitle': '简单的 API 密钥',
    'features.keyText': '一个凭证访问所有支持的模型，无需逐个配置供应商。',
    'features.priceTitle': '高性价比推理',
    'features.priceText': '为注重成本的团队探索高能力中国大模型。',
    'features.docsTitle': '英文文档',
    'features.docsText': '从第一天起就为全球开发者提供快速入门和示例。',
    'features.soon': '即将推出',
    'features.dashboardTitle': '用量仪表盘',
    'features.dashboardText': '在一个简洁的界面中查看请求、费用和模型用量。',
    'models.kicker': '模型访问',
    'models.title': '开发者真正<br><span>想用的模型。</span>',
    'models.available': '已支持',
    'models.comingSoon': '即将支持',
    'models.deepseekText': '推理与通用模型。',
    'models.qwenText': '多语言与编程能力模型。',
    'models.kimiText': '来自月之暗面的长上下文模型。',
    'models.contactPrompt': '需要其他模型 API？联系我们。',
    'models.planned': '规划中',
    'models.moreTitle': '更多模型即将到来',
    'models.moreText': '告诉我们下一个应该支持谁。',
    'code.kicker': '只改一处',
    'code.title': '你的代码，<br><span>新的可能。</span>',
    'code.lead': '继续使用官方 OpenAI SDK，只需指向新的基础地址。',
    'code.copy': '可直接复制',
    'access.kicker': '私密测试',
    'access.title': '一起打造你<br><span>真正想用的 API。</span>',
    'access.lead': '在完整产品开发前，我们正在邀请少量开发者交流。告诉我们什么对你最重要。',
    'access.benefit1': '优先获得 API 访问权限',
    'access.benefit2': '与开发团队直接交流',
    'access.benefit3': '影响模型与定价优先级',
    'form.title': '申请内测资格',
    'form.subtitle': '不到一分钟即可完成。',
    'form.nameLabel': '姓名',
    'form.namePlaceholder': '你的姓名',
    'form.emailLabel': '邮箱地址',
    'form.emailPlaceholder': 'you@company.com',
    'form.companyLabel': '公司',
    'form.companyPlaceholder': '公司或团队（选填）',
    'form.countryLabel': '国家或地区',
    'form.countryPlaceholder': '中国',
    'form.projectLabel': '你正在开发什么？',
    'form.projectPlaceholder': '简单描述你的产品或使用场景',
    'form.modelLabel': '首选模型',
    'form.modelPrompt': '请选择',
    'form.other': '其他',
    'form.usageLabel': '预计每月用量',
    'form.usagePrompt': '选择用量范围',
    'form.usageUnder': '少于 100 万 tokens',
    'form.usageMid': '100 万-1000 万 tokens',
    'form.usageHigh': '1000 万-1 亿 tokens',
    'form.usageMax': '1 亿以上 tokens',
    'form.usageUnknown': '暂不确定',
    'form.submit': '申请内测',
    'form.loading': '正在提交申请...',
    'form.privacy': '不会发送垃圾邮件，只会提供测试更新与邀请。',
    'form.nameRequired': '请输入姓名。',
    'form.nameTooLong': '姓名不能超过 120 个字符。',
    'form.emailRequired': '请输入邮箱地址。',
    'form.emailInvalid': '请输入有效的邮箱地址。',
    'form.companyTooLong': '公司名称不能超过 160 个字符。',
    'form.countryRequired': '请输入国家或地区。',
    'form.countryTooLong': '国家或地区不能超过 100 个字符。',
    'form.projectRequired': '请告诉我们你正在开发什么。',
    'form.projectTooLong': '项目描述不能超过 2,000 个字符。',
    'form.modelRequired': '请选择模型。',
    'form.usageRequired': '请选择预计用量范围。',
    'form.demoSuccess': '你已加入预览名单。请在 script.js 中连接 FORM_ENDPOINT 以收集真实提交。',
    'form.success': '你已加入名单，我们会尽快联系你。',
    'form.error': '提交失败，请重试。',
    'contact.title': '联系方式',
    'footer.note': '内测预览 · 为全球开发者打造',
  },
};

let activeLanguage = 'en';

function normalizeLanguage(language) {
  return language === 'zh' ? 'zh' : 'en';
}

function translate(key, language = activeLanguage) {
  const normalized = normalizeLanguage(language);
  return TRANSLATIONS[normalized][key] ?? TRANSLATIONS.en[key] ?? key;
}

function validateLead(lead, language = 'en') {
  const errors = {};
  const name = (lead.name || '').trim();
  const email = (lead.email || '').trim();
  const company = (lead.company || '').trim();
  const country = (lead.country || '').trim();
  const project = (lead.project || '').trim();

  if (!name) errors.name = translate('form.nameRequired', language);
  else if (name.length > 120) errors.name = translate('form.nameTooLong', language);
  if (!email) errors.email = translate('form.emailRequired', language);
  else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = translate('form.emailInvalid', language);
  if (company.length > 160) errors.company = translate('form.companyTooLong', language);
  if (!country) errors.country = translate('form.countryRequired', language);
  else if (country.length > 100) errors.country = translate('form.countryTooLong', language);
  if (!project) errors.project = translate('form.projectRequired', language);
  else if (project.length > 2000) errors.project = translate('form.projectTooLong', language);
  if (!(lead.model || '').trim()) errors.model = translate('form.modelRequired', language);
  if (!(lead.usage || '').trim()) errors.usage = translate('form.usageRequired', language);
  return errors;
}

async function submitLead(lead, endpoint = FORM_ENDPOINT, fetchFn = globalThis.fetch) {
  if (!endpoint) return { ok: true, demo: true };
  const response = await fetchFn(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  if (!response.ok) throw new Error('Unable to submit your request. Please try again.');
  return { ok: true, demo: false };
}

function readStoredLanguage() {
  try { return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY)); }
  catch { return 'en'; }
}

function setLanguage(language, persist = true) {
  activeLanguage = normalizeLanguage(language);
  document.documentElement.lang = activeLanguage === 'zh' ? 'zh-CN' : 'en';
  document.title = translate('meta.title');

  const description = document.querySelector('meta[name="description"]');
  if (description) description.content = translate('meta.description');
  const ogDescription = document.querySelector('meta[property="og:description"]');
  if (ogDescription) ogDescription.content = translate('meta.description');

  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.innerHTML = translate(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = translate(element.dataset.i18nPlaceholder);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', translate(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === activeLanguage));
  });
  document.querySelectorAll('[data-i18n-state]').forEach((element) => {
    element.textContent = translate(element.dataset.i18nState);
  });

  if (persist) {
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, activeLanguage); }
    catch { /* Language switching still works without storage. */ }
  }
  return activeLanguage;
}

function initPage() {
  const form = document.querySelector('#access-form');
  if (!form) return;
  const status = document.querySelector('#form-status');
  const submitButton = form.querySelector('button[type="submit"]');
  const buttonLabel = submitButton.querySelector('.button-label');

  document.querySelectorAll('[data-api-base]').forEach((element) => {
    element.textContent = `"${PUBLIC_API_BASE_URL}"`;
  });

  setLanguage(readStoredLanguage(), false);
  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  document.querySelectorAll('[data-scroll-to-form]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelector('#early-access').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    status.className = 'form-status';
    status.textContent = '';
    form.querySelectorAll('.field-error').forEach((element) => {
      element.textContent = '';
      delete element.dataset.i18nState;
    });

    const lead = Object.fromEntries(new FormData(form).entries());
    const errors = validateLead(lead, activeLanguage);
    if (Object.keys(errors).length) {
      Object.entries(errors).forEach(([field, message]) => {
        const input = form.elements[field];
        const errorKeys = {
          name: (lead.name || '').trim().length > 120 ? 'form.nameTooLong' : 'form.nameRequired',
          email: (lead.email || '').trim() ? 'form.emailInvalid' : 'form.emailRequired',
          company: 'form.companyTooLong',
          country: (lead.country || '').trim().length > 100 ? 'form.countryTooLong' : 'form.countryRequired',
          project: (lead.project || '').trim().length > 2000 ? 'form.projectTooLong' : 'form.projectRequired',
          model: 'form.modelRequired',
          usage: 'form.usageRequired',
        };
        input.setAttribute('aria-invalid', 'true');
        const errorElement = document.querySelector(`#${field}-error`);
        errorElement.dataset.i18nState = errorKeys[field];
        errorElement.textContent = message;
      });
      form.elements[Object.keys(errors)[0]].focus();
      return;
    }

    Array.from(form.elements).forEach((element) => element.removeAttribute('aria-invalid'));
    submitButton.disabled = true;
    submitButton.classList.add('is-loading');
    buttonLabel.dataset.i18nState = 'form.loading';
    buttonLabel.textContent = translate('form.loading');

    try {
      const result = await submitLead(lead, `${PUBLIC_API_BASE_URL}/early-access`);
      form.reset();
      status.className = 'form-status success';
      status.dataset.i18nState = result.demo ? 'form.demoSuccess' : 'form.success';
      status.textContent = translate(status.dataset.i18nState);
    } catch {
      status.className = 'form-status error';
      status.dataset.i18nState = 'form.error';
      status.textContent = translate(status.dataset.i18nState);
    } finally {
      submitButton.disabled = false;
      submitButton.classList.remove('is-loading');
      delete buttonLabel.dataset.i18nState;
      buttonLabel.textContent = translate('form.submit');
    }
  });

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRANSLATIONS, normalizeLanguage, translate, setLanguage, validateLead, submitLead };
}
if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', initPage);
