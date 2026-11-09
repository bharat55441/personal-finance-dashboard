import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { ErrorToast } from './components/ErrorToast'
import { Layout, PageHeader } from './components/Layout'
import { EmptyState } from './components/ui'
import { useApplyTheme } from './hooks/useTheme'
import { Login } from './pages/Login'
import { useFinanceStore } from './store/useFinanceStore'

function Home() {
  const user = useFinanceStore((s) => s.user)
  return (
    <>
      <PageHeader title={`Welcome, ${user?.name ?? ''}`} />
      <EmptyState title="Nothing here yet">Transactions, budgets and savings goals will appear here.</EmptyState>
    </>
  )
}

function App() {
  useApplyTheme()
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
          <Route index element={<Home />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
      <ErrorToast />
    </BrowserRouter>
  )
}

export default App
