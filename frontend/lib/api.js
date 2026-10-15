const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Request failed');
  }

  return response.status === 204 ? null : response.json();
}

export async function apiUpload(path, formData) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || 'Upload failed');
  }

  return response.json();
}

export const api = {
  health: () => apiFetch('/api/health'),
  getDashboard: () => apiFetch('/api/materials'),
  getMaterials: (category) => apiFetch(`/api/materials${category ? `?category=${encodeURIComponent(category)}` : ''}`),
  createMaterial: (payload) => apiFetch('/api/materials', { method: 'POST', body: JSON.stringify(payload) }),
  patchMaterial: (id, payload) => apiFetch(`/api/materials/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  detectWaste: (formData) => apiUpload('/api/detect', formData),
  twinSummary: () => apiFetch('/api/twin/summary'),
  twinFlow: () => apiFetch('/api/twin/flow'),
  twinEvents: () => apiFetch('/api/twin/events'),
  moveMaterial: (payload) => apiFetch('/api/twin/move', { method: 'POST', body: JSON.stringify(payload) }),
  aiChat: (payload) => apiFetch('/api/ai/chat', { method: 'POST', body: JSON.stringify(payload) }),
  analytics: () => apiFetch('/api/analytics'),
  exportCsv: () => `${API_URL}/api/export`,
};
