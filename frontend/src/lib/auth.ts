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

export async function loginUser(payload: { email: string; password: string; remember_me?: boolean }) {
  const data = await request('/login', { method: 'POST', body: JSON.stringify(payload) });
  if (typeof window !== 'undefined' && data.token) {
    localStorage.setItem('auth_token', data.token);
  }
  return data;
}

export async function requestRegistrationOtp(payload: Record<string, unknown>) {
  return request('/register/request-otp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function verifyRegistrationOtp(payload: Record<string, unknown>) {
  return request('/register/verify-otp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function registerUser(payload: Record<string, unknown>) {
  return request('/register', { method: 'POST', body: JSON.stringify(payload) });
}

export async function logoutUser() {
  return request('/logout', { method: 'POST' }, true);
}

export async function getMe() {
  return request('/me', { method: 'GET' }, true);
}

export async function requestForgotOtp(payload: Record<string, unknown>) {
  return request('/forgot-password/request-otp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function verifyForgotOtp(payload: Record<string, unknown>) {
  return request('/forgot-password/verify-otp', { method: 'POST', body: JSON.stringify(payload) });
}

export async function resetPassword(payload: Record<string, unknown>) {
  return request('/forgot-password/reset', { method: 'POST', body: JSON.stringify(payload) });
}
