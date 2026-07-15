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

export async function createProject(project: Record<string, any>) {
  return request('/projects', { method: 'POST', body: JSON.stringify(project) }, true);
}

export async function updateProject(id: string, project: Record<string, any>) {
  return request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(project) }, true);
}

export async function deleteProject(id: string) {
  return request(`/projects/${id}`, { method: 'DELETE' }, true);
}
