const ADMIN_TRANSLATIONS = {
  en: {
    'status.checking': 'Checking', 'status.online': 'Online', 'status.offline': 'Unavailable',
    'action.logout': 'Log out', 'action.refresh': 'Refresh',
    'login.kicker': 'Secure access', 'login.title': 'Open the control room.',
    'login.lead': 'Enter your administrator secret. It stays in sessionStorage and clears when this tab closes.',
    'login.label': 'Administrator secret', 'login.submit': 'Continue',
    'login.invalid': 'That secret was not accepted.', 'login.network': 'The backend could not be reached.',
    'nav.overview': 'Overview', 'nav.leads': 'Early Access', 'nav.keys': 'API Keys',
    'nav.logs': 'Usage Logs', 'nav.docs': 'API Docs',
    'overview.kicker': 'Live operations', 'overview.title': 'Overview',
    'metric.leads': 'Early access leads', 'metric.keys': 'Active API keys',
    'metric.requests': 'API requests', 'metric.tokens': 'Total tokens',
    'metric.success': 'Successful', 'metric.failed': 'Failed',
    'leads.kicker': 'People who raised a hand', 'leads.title': 'Early Access',
    'leads.search': 'Search leads', 'leads.empty': 'No leads yet.',
    'keys.kicker': 'Early tester access', 'keys.title': 'API Keys', 'keys.label': 'Key name',
    'keys.create': 'Create key', 'keys.error': 'Could not create the key.',
    'logs.kicker': 'Recent activity', 'logs.title': 'Usage Logs', 'logs.empty': 'No API requests yet.',
    'table.name': 'Name', 'table.email': 'Email', 'table.company': 'Company',
    'table.country': 'Country', 'table.project': 'Project', 'table.model': 'Model',
    'table.usage': 'Usage', 'table.date': 'Date', 'table.key': 'Key',
    'table.status': 'Status', 'table.tokens': 'Tokens', 'table.latency': 'Latency',
    'table.error': 'Error', 'dialog.kicker': 'One-time secret',
    'dialog.title': 'Copy this API key now.', 'dialog.lead': 'For security, it will not be shown again.',
    'dialog.copy': 'Copy key', 'dialog.copied': 'Copied', 'dialog.close': 'Close'
  },
  zh: {
    'status.checking': '检查中', 'status.online': '在线', 'status.offline': '不可用',
    'action.logout': '退出', 'action.refresh': '刷新',
    'login.kicker': '安全访问', 'login.title': '进入管理后台',
    'login.lead': '请输入管理员密钥。密钥只保存在 sessionStorage，关闭标签页后即清除。',
    'login.label': '管理员密钥', 'login.submit': '继续',
    'login.invalid': '管理员密钥不正确。', 'login.network': '无法连接后端。',
    'nav.overview': '概览', 'nav.leads': '内测申请', 'nav.keys': 'API 密钥',
    'nav.logs': '调用日志', 'nav.docs': 'API 文档',
    'overview.kicker': '实时运行', 'overview.title': '概览',
    'metric.leads': '内测申请人数', 'metric.keys': '有效 API 密钥',
    'metric.requests': 'API 请求数', 'metric.tokens': '总 Token',
    'metric.success': '成功请求', 'metric.failed': '失败请求',
    'leads.kicker': '感兴趣的用户', 'leads.title': '内测申请',
    'leads.search': '搜索申请人', 'leads.empty': '还没有申请人。',
    'keys.kicker': '测试用户访问', 'keys.title': 'API 密钥', 'keys.label': '密钥名称',
    'keys.create': '创建密钥', 'keys.error': '无法创建密钥。',
    'logs.kicker': '近期活动', 'logs.title': '调用日志', 'logs.empty': '还没有 API 请求。',
    'table.name': '姓名', 'table.email': '邮箱', 'table.company': '公司',
    'table.country': '国家', 'table.project': '项目', 'table.model': '模型',
    'table.usage': '用量', 'table.date': '时间', 'table.key': '密钥',
    'table.status': '状态', 'table.tokens': 'Token', 'table.latency': '延迟',
    'table.error': '错误', 'dialog.kicker': '一次性密钥',
    'dialog.title': '请立即复制此 API Key', 'dialog.lead': '出于安全考虑，它不会再次显示。',
    'dialog.copy': '复制密钥', 'dialog.copied': '已复制', 'dialog.close': '关闭'
  }
};

const LANGUAGE_KEY = 'chinallm-admin-language';
const SECRET_KEY = 'chinallm-admin-secret';
let language = localStorage.getItem(LANGUAGE_KEY) === 'zh' ? 'zh' : 'en';
let leads = [];
let logs = [];

const one = (selector) => document.querySelector(selector);
const all = (selector) => document.querySelectorAll(selector);
const text = (key) => ADMIN_TRANSLATIONS[language][key] || ADMIN_TRANSLATIONS.en[key] || key;

function applyLanguage() {
  document.documentElement.lang = language === 'zh' ? 'zh-CN' : 'en';
  all('[data-i18n]').forEach((element) => { element.textContent = text(element.dataset.i18n); });
  all('[data-i18n-placeholder]').forEach((element) => {
    element.placeholder = text(element.dataset.i18nPlaceholder);
  });
  all('[data-language]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  renderLeads();
  renderLogs();
}

function getSecret() {
  return sessionStorage.getItem(SECRET_KEY) || '';
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.headers || {}), 'x-admin-secret': getSecret() }
  });
  if (response.status === 401) {
    logout();
    throw new Error('unauthorized');
  }
  const body = await response.json();
  if (!response.ok) throw new Error(body.error?.message || 'request failed');
  return body;
}

async function checkHealth() {
  try {
    const response = await fetch('/health');
    if (!response.ok) throw new Error('offline');
    one('#health-indicator').className = 'health online';
    one('#health-indicator span').textContent = text('status.online');
  } catch {
    one('#health-indicator').className = 'health offline';
    one('#health-indicator span').textContent = text('status.offline');
  }
}

function showDashboard() {
  one('#login-view').classList.add('hidden');
  one('#dashboard-view').classList.remove('hidden');
  one('#logout-button').classList.remove('hidden');
}

function logout() {
  sessionStorage.removeItem(SECRET_KEY);
  one('#dashboard-view').classList.add('hidden');
  one('#logout-button').classList.add('hidden');
  one('#login-view').classList.remove('hidden');
}

async function loadData() {
  const [stats, leadData, logData] = await Promise.all([
    api('/admin/stats'), api('/admin/leads'), api('/admin/logs')
  ]);
  one('#stat-leads').textContent = stats.leads.toLocaleString();
  one('#stat-keys').textContent = stats.active_keys.toLocaleString();
  one('#stat-requests').textContent = stats.requests.toLocaleString();
  one('#stat-tokens').textContent = stats.total_tokens.toLocaleString();
  one('#stat-success').textContent = stats.successful_requests.toLocaleString();
  one('#stat-failed').textContent = stats.failed_requests.toLocaleString();
  leads = leadData.leads;
  logs = logData.logs;
  renderLeads();
  renderLogs();
}

function addCell(row, value, title = '') {
  const cell = document.createElement('td');
  cell.textContent = value ?? '—';
  if (title) cell.title = title;
  row.append(cell);
}

function renderLeads() {
  const body = one('#leads-body');
  if (!body) return;
  body.replaceChildren();
  const term = (one('#lead-search').value || '').toLowerCase();
  const filtered = leads.filter((lead) => Object.values(lead).some(
    (value) => String(value ?? '').toLowerCase().includes(term)
  ));
  filtered.forEach((lead) => {
    const row = document.createElement('tr');
    addCell(row, lead.name);
    addCell(row, lead.email);
    addCell(row, lead.company || '—');
    addCell(row, lead.country);
    addCell(row, lead.project, lead.project);
    addCell(row, lead.model);
    addCell(row, lead.usage);
    addCell(row, new Date(`${lead.created_at}Z`).toLocaleString());
    body.append(row);
  });
  one('#leads-empty').classList.toggle('hidden', filtered.length !== 0);
}

function renderLogs() {
  const body = one('#logs-body');
  if (!body) return;
  body.replaceChildren();
  logs.forEach((log) => {
    const row = document.createElement('tr');
    addCell(row, log.key_prefix);
    addCell(row, log.model);
    const statusCell = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = `status-pill ${log.status}`;
    pill.textContent = log.status;
    statusCell.append(pill);
    row.append(statusCell);
    addCell(row, log.total_tokens);
    addCell(row, `${log.latency_ms} ms`);
    addCell(row, log.error_message || '—', log.error_message || '');
    addCell(row, new Date(`${log.created_at}Z`).toLocaleString());
    body.append(row);
  });
  one('#logs-empty').classList.toggle('hidden', logs.length !== 0);
}

one('#login-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  sessionStorage.setItem(SECRET_KEY, one('#admin-secret').value);
  one('#login-message').textContent = '';
  try {
    await api('/admin/stats');
    showDashboard();
    await loadData();
  } catch (error) {
    one('#login-message').textContent = error.message === 'unauthorized'
      ? text('login.invalid') : text('login.network');
  }
});

all('[data-language]').forEach((button) => button.addEventListener('click', () => {
  language = button.dataset.language;
  localStorage.setItem(LANGUAGE_KEY, language);
  applyLanguage();
  checkHealth();
}));
all('.nav-item[data-view]').forEach((button) => button.addEventListener('click', () => {
  all('.nav-item[data-view]').forEach((item) => item.classList.remove('active'));
  button.classList.add('active');
  all('.panel-view').forEach((view) => view.classList.add('hidden'));
  one(`#${button.dataset.view}`).classList.remove('hidden');
}));
one('#logout-button').addEventListener('click', logout);
one('#lead-search').addEventListener('input', renderLeads);
one('.refresh-button').addEventListener('click', loadData);

one('#key-form').addEventListener('submit', async (event) => {
  event.preventDefault();
  one('#key-message').textContent = '';
  try {
    const result = await api('/admin/create-key', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: one('#key-name').value })
    });
    one('#created-key').textContent = result.api_key;
    one('#key-dialog').showModal();
    one('#key-form').reset();
    await loadData();
  } catch {
    one('#key-message').textContent = text('keys.error');
  }
});
one('#copy-key').addEventListener('click', async () => {
  await navigator.clipboard.writeText(one('#created-key').textContent);
  one('#copy-key').textContent = text('dialog.copied');
});
one('#close-dialog').addEventListener('click', () => {
  one('#key-dialog').close();
  one('#created-key').textContent = '';
  one('#copy-key').textContent = text('dialog.copy');
});

applyLanguage();
checkHealth();
if (getSecret()) {
  showDashboard();
  loadData().catch(logout);
}
