import { lazy, useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { ErrorToast } from './components/ErrorToast'
import { Layout } from './components/Layout'
import { useRecurringSync } from './hooks/useRecurringSync'
import { useApplyTheme } from './hooks/useTheme'
import { Login } from './pages/Login'
import { useFinanceStore } from './store/useFinanceStore'

// Route-level code splitting: each page is loaded on demand.
const Transactions = lazy(() => import('./pages/Transactions').then((m) => ({ default: m.Transactions })))
const Recurring = lazy(() => import('./pages/Recurring').then((m) => ({ default: m.Recurring })))
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))

function App() {
  useApplyTheme()
  useRecurringSync()
  const status = useFinanceStore((s) => s.status)
  const init = useFinanceStore((s) => s.init)

  useEffect(() => {
    init()
  }, [init])

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-sm text-stone-500">Loading…</div>
  }
  if (status === 'anonymous') return <Login />

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/transactions" replace />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="recurring" element={<Recurring />} />
          <Route path="budgets" element={<Budgets />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/transactions" replace />} />
        </Route>
      </Routes>
      <ErrorToast />
    </BrowserRouter>
  )
}

export default App
