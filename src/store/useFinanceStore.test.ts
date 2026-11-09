import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFinanceStore } from './useFinanceStore'

const store = () => useFinanceStore.getState()

const user = { id: 'u1', name: 'Ana', email: 'ana@example.com', settings: { currency: 'EUR' } }

type Handler = (method: string, body: unknown) => { status: number; body?: unknown }
let routes: Record<string, Handler>
const calls: { method: string; path: string; body: unknown }[] = []

function json(status: number, body?: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(body ?? {}), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  calls.length = 0
  routes = {
    '/api/auth/me': () => ({ status: 200, body: { user } }),
  }
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit = {}) => {
      const path = url.split('?')[0]
      const method = init.method ?? 'GET'
      const body = init.body ? JSON.parse(String(init.body)) : undefined
      calls.push({ method, path, body })
      const handler = routes[path]
      if (!handler) return json(404, { error: 'Not found' })
      const res = handler(method, body)
      return json(res.status, res.body)
    }),
  )
  useFinanceStore.setState({ status: 'loading', user: null, error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFinanceStore', () => {
  it('loads the signed-in user and their currency on init', async () => {
    await store().init()
    expect(store().status).toBe('ready')
    expect(store().user).toEqual(user)
    expect(store().currency).toBe('EUR')
  })

  it('shows the login screen when not signed in', async () => {
    routes['/api/auth/me'] = () => ({ status: 401, body: { error: 'Not signed in' } })
    await store().init()
    expect(store().status).toBe('anonymous')
    expect(store().error).toBeNull()
  })

  it('throws login errors so the form can show them', async () => {
    routes['/api/auth/login'] = () => ({ status: 401, body: { error: 'Incorrect email or password' } })
    await expect(store().login('ana@example.com', 'wrong')).rejects.toThrow('Incorrect email or password')
  })

  it('signs out', async () => {
    await store().init()
    routes['/api/auth/logout'] = () => ({ status: 204 })
    await store().logout()
    expect(store().status).toBe('anonymous')
    expect(store().user).toBeNull()
    expect(calls.at(-1)).toMatchObject({ method: 'POST', path: '/api/auth/logout' })
  })

  it('only persists the theme locally', async () => {
    await store().init()
    store().toggleTheme()
    const saved = JSON.parse(localStorage.getItem('pfd-ui')!).state
    expect(Object.keys(saved)).toEqual(['theme'])
  })
})
