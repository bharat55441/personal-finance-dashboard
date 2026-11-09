import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Transaction } from '../types/Transaction'
import { useFinanceStore } from './useFinanceStore'

const store = () => useFinanceStore.getState()

const user = { id: 'u1', name: 'Ana', email: 'ana@example.com', settings: { currency: 'EUR' } }
const tx: Transaction = { id: 't1', type: 'expense', amount: 10, category: 'Food', date: '2026-03-01', note: '' }

type Handler = (method: string, body: unknown) => { status: number; body?: unknown }
let routes: Record<string, Handler>
const calls: { method: string; path: string; body: unknown }[] = []

function json(status: number, body?: unknown) {
  return new Response(status === 204 ? null : JSON.stringify(body ?? {}), { status, headers: { 'Content-Type': 'application/json' } })
}

beforeEach(() => {
  calls.length = 0
  routes = {
    '/api/data': () => ({ status: 200, body: { user, transactions: [tx], budgets: [], recurring: [], goals: [] } }),
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
  useFinanceStore.setState({ status: 'loading', user: null, transactions: [], error: null })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useFinanceStore', () => {
  it('loads data and currency from the server on init', async () => {
    await store().init()
    expect(store().status).toBe('ready')
    expect(store().transactions).toEqual([tx])
    expect(store().currency).toBe('EUR')
    expect(calls[0].path).toBe('/api/data')
  })

  it('shows the login screen when not signed in', async () => {
    routes['/api/data'] = () => ({ status: 401, body: { error: 'Not signed in' } })
    await store().init()
    expect(store().status).toBe('anonymous')
    expect(store().error).toBeNull()
  })

  it('adds the server-created transaction', async () => {
    await store().init()
    const created = { ...tx, id: 't2', amount: 99 }
    routes['/api/transactions'] = () => ({ status: 201, body: { transaction: created } })
    await store().addTransaction({ type: 'expense', amount: 99, category: 'Food', date: '2026-03-01', note: '' })
    expect(store().transactions.map((t) => t.id)).toEqual(['t2', 't1'])
  })

  it('rolls back an optimistic delete when the request fails', async () => {
    await store().init()
    routes['/api/transactions/t1'] = () => ({ status: 500, body: { error: 'Database down' } })
    await store().deleteTransaction('t1')
    expect(store().transactions).toEqual([tx])
    expect(store().error).toBe('Database down')
  })

  it('signs out when a request returns 401', async () => {
    await store().init()
    routes['/api/transactions'] = () => ({ status: 401, body: { error: 'Session expired' } })
    await store().addTransaction({ type: 'expense', amount: 5, category: 'Food', date: '2026-03-02', note: '' })
    expect(store().status).toBe('anonymous')
    expect(store().transactions).toEqual([])
  })

  it('only persists the theme locally', async () => {
    await store().init()
    store().toggleTheme()
    const saved = JSON.parse(localStorage.getItem('pfd-ui')!).state
    expect(Object.keys(saved)).toEqual(['theme'])
  })
})
