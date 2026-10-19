const SESSION_KEY = 'session';
const DEVICE_KEY = 'deviceId';

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!/^[a-f0-9]{32}$/.test(id ?? '')) {
    id = Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}
