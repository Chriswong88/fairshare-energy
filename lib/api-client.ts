const apiOrigin = process.env.NEXT_PUBLIC_FAIRSHARE_API_ORIGIN?.replace(/\/$/, '') ?? '';
const accessKey = 'fairshare.accessToken';
const refreshKey = 'fairshare.refreshToken';

type AuthPayload = {session?: {access_token?: string; refresh_token?: string}};

function saveSession(payload: AuthPayload) {
  if (payload.session?.access_token) localStorage.setItem(accessKey, payload.session.access_token);
  if (payload.session?.refresh_token) localStorage.setItem(refreshKey, payload.session.refresh_token);
}

function clearSession() {
  localStorage.removeItem(accessKey);
  localStorage.removeItem(refreshKey);
}

function apiUrl(path: string) {
  return path.startsWith('/api/') ? `${apiOrigin}${path}` : path;
}

async function refreshSession() {
  const refreshToken = localStorage.getItem(refreshKey);
  if (!refreshToken) return false;
  const response = await fetch(apiUrl('/api/auth/refresh'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({refreshToken}),
    credentials: apiOrigin ? 'omit' : 'same-origin',
  });
  if (!response.ok) {
    clearSession();
    return false;
  }
  saveSession((await response.json()) as AuthPayload);
  return true;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = localStorage.getItem(accessKey);
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const request = () => fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: apiOrigin ? 'omit' : (init.credentials ?? 'same-origin'),
  });
  let response = await request();
  if (response.status === 401 && !path.startsWith('/api/auth/') && await refreshSession()) {
    headers.set('Authorization', `Bearer ${localStorage.getItem(accessKey)}`);
    response = await request();
  }

  if (response.ok && (path === '/api/auth/login' || path === '/api/auth/signup')) {
    saveSession((await response.clone().json()) as AuthPayload);
  }
  if (path === '/api/auth/logout') clearSession();
  return response;
}
