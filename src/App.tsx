import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout, PageHeader } from './components/Layout'
import { EmptyState } from './components/ui'
import { useApplyTheme } from './hooks/useTheme'

function Home() {
  return (
    <>
      <PageHeader title="Personal Finance Dashboard" />
      <EmptyState title="Nothing here yet">Transactions, budgets and savings goals will appear here.</EmptyState>
    </>
  )
}

function App() {
  useApplyTheme()

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
