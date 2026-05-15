import { API_BASE_URL } from './authClient';
import { getAccessToken } from './authStorage';

function buildAuthHeaders(extraHeaders = {}) {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

async function parseResponse(res) {
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
    const error = new Error(msg || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  return data;
}

async function publicRequest(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  return parseResponse(res);
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: buildAuthHeaders(options.headers),
  });

  return parseResponse(res);
}

export const gardenBedsApi = {
  list: () => request('/garden-beds'),
  get: (id) => request(`/garden-beds/${id}`),
  create: (data, user) =>
    request('/garden-beds', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, user) =>
    request(`/garden-beds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id, user) =>
    request(`/garden-beds/${id}`, { method: 'DELETE' }),
  claim: (id, user) =>
    request(`/garden-beds/${id}/claim`, { method: 'POST' }),
  release: (id, user) =>
    request(`/garden-beds/${id}/release`, { method: 'POST' }),
};

export const tasksApi = {
  list: () => request('/tasks'),
  get: (id) => request(`/tasks/${id}`),
  create: (data, user) =>
    request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, user) =>
    request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  toggleStatus: (id, user) =>
    request(`/tasks/${id}/status`, { method: 'PATCH' }),
  remove: (id, user) =>
    request(`/tasks/${id}`, { method: 'DELETE' }),
};

export const reportsApi = {
  list: () => request('/reports'),
  get: (id) => request(`/reports/${id}`),
  create: (data, user) =>
    request('/reports', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, user) =>
    request(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id, user) =>
    request(`/reports/${id}`, { method: 'DELETE' }),
};

export const equipmentApi = {
  list: () => request('/equipment'),
  get: (id) => request(`/equipment/${id}`),
  create: (data, user) =>
    request('/equipment', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, user) =>
    request(`/equipment/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  remove: (id, user) =>
    request(`/equipment/${id}`, { method: 'DELETE' }),
};

export const eventsApi = {
  list: () => request('/events'),
  get: (id) => request(`/events/${id}`),
  create: (data, user) =>
    request('/events', { method: 'POST', body: JSON.stringify(data) }),
  update: (id, data, user) =>
    request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  cancel: (id, user) =>
    request(`/events/${id}/cancel`, { method: 'PATCH' }),
  restore: (id, user) =>
    request(`/events/${id}/restore`, { method: 'PATCH' }),
  remove: (id, user) =>
    request(`/events/${id}`, { method: 'DELETE' }),
  getParticipations: (id) => request(`/events/${id}/participations`),
  updateParticipation: (id, status, user) =>
    request(`/events/${id}/participation`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    }),
};

export const authApi = {
  login: (email, password) =>
    publicRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
};

export const usersApi = {
  list: () => request('/users'),
  get: (id) => request(`/users/${id}`),
  me: () => request('/users/me'),
  create: (data) =>
    request('/users', { method: 'POST', body: JSON.stringify(data) }),
};
