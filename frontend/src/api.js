import { clearSession, getSession } from './session';

export const API_URL = import.meta.env.VITE_API_URL ?? '';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers.Authorization = `Bearer ${getSession()?.token}`;

  let res;
  try {
    res = await fetch(API_URL + path, { method, headers, body: body && JSON.stringify(body) });
  } catch {
    throw new ApiError('Nu se poate contacta serverul. Verifică conexiunea la internet.', 0);
  }

  const data = await res.json().catch(() => ({}));

  if (auth && res.status === 401) {
    clearSession();
    window.location.assign('/login');
  }
  if (!res.ok) throw new ApiError(data.error || 'A apărut o eroare. Încearcă din nou.', res.status);

  return data;
}
