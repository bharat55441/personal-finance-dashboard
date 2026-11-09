import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { api, ApiError } from '../api/client'
import type { User } from '../types/User'

export type Theme = 'light' | 'dark'
export type Status = 'loading' | 'anonymous' | 'ready'

interface FinanceState {
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

  toggleTheme: () => void
  dismissError: () => void
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => {
      /** Run a request; on failure record the error (and sign out on 401) instead of throwing. */
      async function run<T>(fn: () => Promise<T>, rollback?: () => void): Promise<T | undefined> {
        try {
          return await fn()
        } catch (err) {
          rollback?.()
          if (err instanceof ApiError && err.status === 401) {
            set({ status: 'anonymous', user: null, error: 'Your session expired. Please sign in again.' })
          } else {
            set({ error: err instanceof Error ? err.message : 'Something went wrong' })
          }
          return undefined
        }
      }

      async function load() {
        const { user } = await api<{ user: User }>('/auth/me')
        set({ user, currency: user.settings.currency, status: 'ready', error: null })
      }

      return {
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
          set({ status: 'anonymous', user: null })
        },

        toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
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
