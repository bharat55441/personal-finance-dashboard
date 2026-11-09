import { format } from 'date-fns'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { api, ApiError } from '../api/client'
import type { Budget } from '../types/Budget'
import type { RecurringInput, RecurringRule, Transaction, TransactionInput } from '../types/Transaction'
import type { User } from '../types/User'

export type Theme = 'light' | 'dark'
export type Status = 'loading' | 'anonymous' | 'ready'

interface FinanceData {
  transactions: Transaction[]
  budgets: Budget[]
  recurring: RecurringRule[]
}

interface FinanceState extends FinanceData {
  status: Status
  user: User | null
  currency: string
  theme: Theme
  /** Last failed request, shown as a dismissible toast. */
  error: string | null

  init: () => Promise<void>
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>

  addTransaction: (t: TransactionInput) => Promise<void>
  updateTransaction: (id: string, t: TransactionInput) => Promise<void>
  deleteTransaction: (id: string) => Promise<void>
  importTransactions: (ts: TransactionInput[]) => Promise<number>

  setBudget: (category: string, limit: number) => Promise<void>
  deleteBudget: (id: string) => Promise<void>

  addRecurring: (r: RecurringInput) => Promise<void>
  updateRecurring: (id: string, r: Partial<RecurringInput>) => Promise<void>
  deleteRecurring: (id: string) => Promise<void>
  /** Ask the server to generate any recurring transactions that have come due. */
  syncRecurring: () => Promise<number>

  toggleTheme: () => void
  setCurrency: (c: string) => Promise<void>
  clearAll: () => Promise<void>
  dismissError: () => void
}

const empty: FinanceData = { transactions: [], budgets: [], recurring: [] }

/** The user's local date, so the server generates recurring items in the right month. */
const today = () => format(new Date(), 'yyyy-MM-dd')

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

const byId = <T extends { id: string }>(list: T[], item: T) => list.map((x) => (x.id === item.id ? item : x))

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => {
      /** Run a request; on failure record the error (and sign out on 401) instead of throwing. */
      async function run<T>(fn: () => Promise<T>, rollback?: () => void): Promise<T | undefined> {
        try {
          return await fn()
        } catch (err) {
          rollback?.()
          if (err instanceof ApiError && err.status === 401) {
            set({ ...empty, status: 'anonymous', user: null, error: 'Your session expired. Please sign in again.' })
          } else {
            set({ error: err instanceof Error ? err.message : 'Something went wrong' })
          }
          return undefined
        }
      }

      async function load() {
        const data = await api<FinanceData & { user: User }>(`/data?today=${today()}`)
        set({ ...data, currency: data.user.settings.currency, status: 'ready', error: null })
      }

      return {
        ...empty,
        status: 'loading',
        user: null,
        currency: 'USD',
        theme: prefersDark() ? 'dark' : 'light',
        error: null,

        init: async () => {
          try {
            await load()
          } catch (err) {
            set({
              status: 'anonymous',
              error: err instanceof ApiError && err.status === 401 ? null : (err as Error).message,
            })
          }
        },
        // login/register surface errors to the form, so they throw.
        login: async (email, password) => {
          await api('/auth/login', 'POST', { email, password })
          await load()
        },
        register: async (name, email, password) => {
          await api('/auth/register', 'POST', { name, email, password })
          await load()
        },
        logout: async () => {
          await run(() => api('/auth/logout', 'POST'))
          set({ ...empty, status: 'anonymous', user: null })
        },

        addTransaction: async (t) => {
          const res = await run(() => api<{ transaction: Transaction }>('/transactions', 'POST', t))
          if (res) set((s) => ({ transactions: [res.transaction, ...s.transactions] }))
        },
        updateTransaction: async (id, t) => {
          const res = await run(() => api<{ transaction: Transaction }>(`/transactions/${id}`, 'PUT', t))
          if (res) set((s) => ({ transactions: byId(s.transactions, res.transaction) }))
        },
        deleteTransaction: async (id) => {
          const prev = get().transactions
          set({ transactions: prev.filter((x) => x.id !== id) })
          await run(() => api(`/transactions/${id}`, 'DELETE'), () => set({ transactions: prev }))
        },
        importTransactions: async (ts) => {
          const res = await run(() => api<{ transactions: Transaction[] }>('/transactions/bulk', 'POST', { transactions: ts }))
          if (!res) return 0
          set((s) => ({ transactions: [...res.transactions, ...s.transactions] }))
          return res.transactions.length
        },

        setBudget: async (category, limit) => {
          const res = await run(() => api<{ budget: Budget }>(`/budgets/${encodeURIComponent(category)}`, 'PUT', { limit }))
          if (!res) return
          set((s) => ({
            budgets: s.budgets.some((b) => b.id === res.budget.id) ? byId(s.budgets, res.budget) : [...s.budgets, res.budget],
          }))
        },
        deleteBudget: async (id) => {
          const prev = get().budgets
          set({ budgets: prev.filter((b) => b.id !== id) })
          await run(() => api(`/budgets/${id}`, 'DELETE'), () => set({ budgets: prev }))
        },

        addRecurring: async (r) => {
          const res = await run(() =>
            api<{ recurring: RecurringRule[]; transactions: Transaction[] }>('/recurring', 'POST', { ...r, today: today() }),
          )
          if (res) set((s) => ({ recurring: res.recurring, transactions: [...res.transactions, ...s.transactions] }))
        },
        updateRecurring: async (id, r) => {
          const res = await run(() =>
            api<{ recurring: RecurringRule[]; transactions: Transaction[] }>(`/recurring/${id}`, 'PATCH', { ...r, today: today() }),
          )
          if (res) set((s) => ({ recurring: res.recurring, transactions: [...res.transactions, ...s.transactions] }))
        },
        deleteRecurring: async (id) => {
          const prev = get().recurring
          set({ recurring: prev.filter((r) => r.id !== id) })
          await run(() => api(`/recurring/${id}`, 'DELETE'), () => set({ recurring: prev }))
        },
        syncRecurring: async () => {
          if (get().status !== 'ready') return 0
          const res = await run(() =>
            api<{ transactions: Transaction[]; recurring?: RecurringRule[] }>('/recurring/sync', 'POST', { today: today() }),
          )
          if (!res?.transactions.length) return 0
          set((s) => ({ transactions: [...res.transactions, ...s.transactions], recurring: res.recurring ?? s.recurring }))
          return res.transactions.length
        },

        toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
        setCurrency: async (currency) => {
          const prev = get().currency
          set({ currency })
          const res = await run(() => api<{ user: User }>('/settings', 'PATCH', { currency }), () => set({ currency: prev }))
          if (res) set({ user: res.user })
        },
        clearAll: async () => {
          const res = await run(() => api('/data', 'DELETE').then(() => true))
          if (res) set(empty)
        },
        dismissError: () => set({ error: null }),
      }
    },
    {
      // Only UI preferences live in the browser; finance data comes from the API.
      name: 'pfd-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)
