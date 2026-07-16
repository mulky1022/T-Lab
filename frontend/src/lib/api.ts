const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

async function request(path: string, options: RequestInit = {}, auth = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (auth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}/api${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed.');
  }

  return data;
}

export async function getProjects(params: { search?: string; status?: string; perPage?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  query.set('perPage', String(params.perPage ?? 100));
  const path = `/projects?${query.toString()}`;
  return request(path, { method: 'GET' }, true);
}

export async function getProject(id: string) {
  return request(`/projects/${id}`, { method: 'GET' }, true);
}

export async function getUsers(params: { perPage?: number } = {}) {
  const q = new URLSearchParams();
  q.set('perPage', String(params.perPage ?? 1000));
  return request(`/users?${q.toString()}`, { method: 'GET' }, true);
}

export async function getTasks(params: { search?: string; status?: string; project_id?: string; perPage?: number } = {}) {
  const query = new URLSearchParams();
  if (params.search) query.set('search', params.search);
  if (params.status) query.set('status', params.status);
  if (params.project_id) query.set('project_id', params.project_id);
  query.set('perPage', String(params.perPage ?? 100));
  const path = `/tasks?${query.toString()}`;
  return request(path, { method: 'GET' }, true);
}

export async function createProject(project: Record<string, any>) {
  return request('/projects', { method: 'POST', body: JSON.stringify(project) }, true);
}

export async function updateProject(id: string, project: Record<string, any>) {
  return request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(project) }, true);
}

export async function deleteProject(id: string) {
  return request(`/projects/${id}`, { method: 'DELETE' }, true);
}

export async function getTask(id: string) {
  return request(`/tasks/${id}`, { method: 'GET' }, true);
}

export async function createTask(data: Record<string, any>) {
  return request('/tasks', { method: 'POST', body: JSON.stringify(data) }, true);
}

export async function updateTask(id: string, data: Record<string, any>) {
  return request(`/tasks/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true);
}

export async function deleteTask(id: string) {
  return request(`/tasks/${id}`, { method: 'DELETE' }, true);
}

export async function createComment(data: Record<string, any>) {
  return request('/comments', { method: 'POST', body: JSON.stringify(data) }, true);
}

export async function updateComment(id: string, data: Record<string, any>) {
  return request(`/comments/${id}`, { method: 'PUT', body: JSON.stringify(data) }, true);
}

export async function deleteComment(id: string) {
  return request(`/comments/${id}`, { method: 'DELETE' }, true);
}

export async function getNotifications(params: { perPage?: number } = {}) {
  const q = new URLSearchParams();
  q.set('perPage', String(params.perPage ?? 50));
  return request(`/notifications?${q.toString()}`, { method: 'GET' }, true);
}

export async function markNotificationRead(id: string) {
  return request(`/notifications/${id}/read`, { method: 'POST' }, true);
}

export async function markAllNotificationsRead() {
  return request('/notifications/read-all', { method: 'POST' }, true);
}

export async function getAuditLogs(params: { search?: string; perPage?: number } = {}) {
  const q = new URLSearchParams();
  if (params.search) q.set('search', params.search);
  q.set('perPage', String(params.perPage ?? 50));
  return request(`/audit-logs?${q.toString()}`, { method: 'GET' }, true);
}
