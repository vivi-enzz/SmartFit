import { locale } from './i18n.js';
export async function api(path, options = {}) {
  const isForm = options.body instanceof FormData;
  let response;
  try {
    response = await fetch('/api' + path, {
      credentials: 'same-origin',
      ...options,
      headers: {
        ...(!isForm && options.body ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers,
      },
      body: options.body && !isForm ? JSON.stringify(options.body) : options.body,
    });
  } catch {
    throw new Error('无法连接服务，请检查后端是否运行。');
  }
  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error('服务返回了无效响应，请稍后重试。');
  }
  if (!response.ok)
    throw Object.assign(new Error(data.error || '操作失败，请重试'), { status: response.status });
  return data;
}
export const money = (n) =>
  'HK$ ' +
  (n / 100).toLocaleString('en-HK', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
export const date = (s) =>
  new Date(s).toLocaleString(locale.value === 'en' ? 'en-HK' : 'zh-HK', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
