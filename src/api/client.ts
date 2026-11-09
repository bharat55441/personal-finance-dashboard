export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

/**
 * Base URL of pfd-api, e.g. https://api.example.com. Empty in dev, where
 * Vite proxies /api to the local API on :4000.
 */
const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

/** JSON fetch against the backend. The session is an httpOnly cookie, so no token handling here. */
export async function api<T = unknown>(path: string, method: Method = 'GET', body?: unknown): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method,
      // 'include' so the session cookie is sent when the API is on another origin.
      credentials: 'include',
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running?')
  }

  if (res.status === 204) return undefined as T
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = Array.isArray(data.issues) && data.issues.length ? `: ${data.issues[0].path} ${data.issues[0].message}` : ''
    throw new ApiError(res.status, (data.error ?? `Request failed (${res.status})`) + detail)
  }
  return data as T
}
