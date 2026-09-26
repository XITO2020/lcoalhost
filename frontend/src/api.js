// Client API. Meme origine partout (proxy Vite en dev, nginx en prod) => le cookie visiteur suit tout seul.
async function req(path, opts = {}) {
  const res = await fetch(`/api${path}`, {
    credentials: 'same-origin',
    ...opts,
    headers: { 'content-type': 'application/json', ...opts.headers },
  });
  if (!res.ok) {
    const err = new Error(`HTTP ${res.status}`);
    err.status = res.status;
    err.body = await res.json().catch(() => null);
    throw err;
  }
  return res.status === 204 ? null : res.json();
}

const qs = (o) => {
  const p = new URLSearchParams();
  for (const [k, v] of Object.entries(o)) if (v !== undefined && v !== null && v !== '') p.set(k, v);
  return p.toString();
};

const adminHeaders = () => {
  let token = '';
  try {
    token = localStorage.getItem('lh_admin_token') ?? '';
  } catch {
    /* stockage indisponible : le mode admin ne peut pas s'activer, tant pis */
  }
  return { 'x-admin-token': token };
};

export const api = {
  items: (params) => req(`/items?${qs(params)}`),
  react: (id, type) => req(`/items/${id}/react`, { method: 'POST', body: JSON.stringify({ type }) }),
  shelf: (id, folder) => req(`/items/${id}/shelf`, { method: 'POST', body: JSON.stringify({ folder }) }),
  shelfList: (folder) => req(`/shelf?${qs({ folder })}`),
  downloaded: (id) => req(`/items/${id}/downloaded`, { method: 'POST' }),
  hit: () => req('/hit', { method: 'POST' }),
  stats: () => req('/stats'),
  sources: () => req('/sources'),
  hacks: () => req('/hacks'),
  hacksCheckout: (hackIds) => req('/hacks/checkout', { method: 'POST', body: JSON.stringify({ hackIds }) }),
  tiktok: (topic) => req(`/tiktok?${qs({ topic })}`),
  coalQuota: () => req('/coal/quota'),
  coalSubmit: async (formData) => {
    const res = await fetch('/api/coal', { method: 'POST', credentials: 'same-origin', body: formData });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      const err = new Error(`HTTP ${res.status}`);
      err.status = res.status;
      err.body = body;
      throw err;
    }
    return body;
  },
  adminWhoami: () => req('/admin/whoami', { headers: { ...adminHeaders() } }),
  adminDeleteItem: (id) => req(`/admin/items/${id}`, { method: 'DELETE', headers: { ...adminHeaders() } }),
  adminTogglePin: (id) => req(`/admin/items/${id}/pin`, { method: 'PATCH', headers: { ...adminHeaders() } }),
  adminStorage: () => req('/admin/storage', { headers: { ...adminHeaders() } }),
  adminCreateItem: (data) => req('/admin/items', { method: 'POST', body: JSON.stringify(data), headers: { ...adminHeaders() } }),
  whoami: () => req('/whoami'),
  liquidEnhance: (area, prompt, lang) => req('/liquid/enhance', { method: 'POST', body: JSON.stringify({ area, prompt, lang }) }),
  liquidSubmit: (area, rawInput, enhanced) => req('/liquid', { method: 'POST', body: JSON.stringify({ area, rawInput, enhanced }) }),
  adsPricing: () => req('/ads/pricing'),
  adsSubmit: (data) => req('/ads', { method: 'POST', body: JSON.stringify(data) }),
  adsActive: (position) => req(`/ads/active?${qs({ position })}`),
};
