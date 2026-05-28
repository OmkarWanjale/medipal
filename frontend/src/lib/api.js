const BASE = '/api';

function getToken() {
  return localStorage.getItem('medipal_token');
}

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export const api = {
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),

  createSession: () => request('/chat/session', { method: 'POST' }),
  getMessages: (sessionId) => request(`/chat/session/${sessionId}/messages`),
  sendMessage: (sessionId, content) =>
    request(`/chat/session/${sessionId}/message`, { method: 'POST', body: JSON.stringify({ content }) }),

  getPatients: () => request('/patients'),
  getStats: () => request('/patients/stats'),
  saveDoctorNotes: (summaryId, doctor_notes) =>
    request(`/patients/${summaryId}/notes`, { method: 'PATCH', body: JSON.stringify({ doctor_notes }) }),
  getMySessions: () => request('/patients/my-sessions'),
};
