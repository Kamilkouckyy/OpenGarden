//const API_BASE = 'http://localhost:3000';
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:3000';


async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { message: text };
    }
  }

  if (!res.ok) {
    const err = data || {};
    const msg = Array.isArray(err.message) ? err.message.join(', ') : err.message;
    throw new Error(msg || `HTTP ${res.status}`);
  }

  return data;
}

function authHeaders(user) {
  if (!user) return {};
  return {
    'X-User-Id': String(user.id),
    'X-User-Role': user.role === 'admin' ? 'admin' : 'member',
  };
}

export const gardenBedsApi = {
  list: () => request('/garden-beds'),
  get: (id) => request(`/garden-beds/${id}`),
  create: (data, user) =>
    request('/garden-beds', { method: 'POST', body: JSON.stringify(data), headers: authHeaders(user) }),
  update: (id, data, user) =>
    request(`/garden-beds/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: authHeaders(user) }),
  remove: (id, user) =>
    request(`/garden-beds/${id}`, { method: 'DELETE', headers: authHeaders(user) }),
  claim: (id, user) =>
    request(`/garden-beds/${id}/claim`, { method: 'POST', headers: authHeaders(user) }),
  release: (id, user) =>
    request(`/garden-beds/${id}/release`, { method: 'POST', headers: authHeaders(user) }),
};

export const tasksApi = {
  list: () => request('/tasks'),
  get: (id) => request(`/tasks/${id}`),
  create: (data, user) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data), headers: authHeaders(user) }),
  update: (id, data, user) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: authHeaders(user) }),
  toggleStatus: (id, user) =>
    request(`/tasks/${id}/status`, { method: 'PATCH', headers: authHeaders(user) }),
  remove: (id, user) =>
    request(`/tasks/${id}`, { method: 'DELETE', headers: authHeaders(user) }),
};

export const reportsApi = {
  list: () => request('/reports'),
  get: (id) => request(`/reports/${id}`),
  create: (data, user) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data), headers: authHeaders(user) }),
  update: (id, data, user) =>
    request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: authHeaders(user) }),
  remove: (id, user) =>
    request(`/reports/${id}`, { method: 'DELETE', headers: authHeaders(user) }),
};

export const equipmentApi = {
  list: () => request('/equipment'),
  get: (id) => request(`/equipment/${id}`),
  create: (data, user) =>
    request('/equipment', { method: 'POST', body: JSON.stringify(data), headers: authHeaders(user) }),
  update: (id, data, user) =>
    request(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: authHeaders(user) }),
  remove: (id, user) =>
    request(`/equipment/${id}`, { method: 'DELETE', headers: authHeaders(user) }),
};

export const eventsApi = {
  list: () => request('/events'),
  get: (id) => request(`/events/${id}`),
  create: (data, user) =>
    request('/events', { method: 'POST', body: JSON.stringify(data), headers: authHeaders(user) }),
  update: (id, data, user) =>
    request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data), headers: authHeaders(user) }),
  cancel: (id, user) =>
    request(`/events/${id}/cancel`, { method: 'PATCH', headers: authHeaders(user) }),
  restore: (id, user) =>
    request(`/events/${id}/restore`, { method: 'PATCH', headers: authHeaders(user) }),
  remove: (id, user) =>
    request(`/events/${id}`, { method: 'DELETE', headers: authHeaders(user) }),
  getParticipations: (id) => request(`/events/${id}/participations`),
  updateParticipation: (id, status, user) =>
    request(`/events/${id}/participation`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
      headers: authHeaders(user),
    }),
};

export const usersApi = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
  create: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
};
