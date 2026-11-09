import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type Theme = 'light' | 'dark'

interface FinanceState {
  theme: Theme
  toggleTheme: () => void
}

const prefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set) => ({
      theme: prefersDark() ? 'dark' : 'light',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      // Only UI preferences live in the browser; finance data comes from the API.
      name: 'pfd-ui',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
)
