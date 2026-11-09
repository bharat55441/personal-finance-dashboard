import { useMemo, useState } from 'react'
import { PageHeader } from '../components/Layout'
import { MonthSelect } from '../components/MonthSelect'
import { TransactionForm } from '../components/TransactionForm'
import { TransactionTable } from '../components/TransactionTable'
import { Button, Card, EmptyState, Icon, inputClass, Modal } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type Transaction } from '../types/Transaction'
import { currentMonth, filterTransactions, type TransactionFilters } from '../utils/finance'
import { formatCurrency } from '../utils/formatCurrency'

export function Transactions() {
  const transactions = useFinanceStore((s) => s.transactions)
  const currency = useFinanceStore((s) => s.currency)
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const updateTransaction = useFinanceStore((s) => s.updateTransaction)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)

  const [filters, setFilters] = useState<TransactionFilters>({ month: currentMonth(), category: 'all', type: 'all', search: '' })
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [creating, setCreating] = useState(false)

  const setFilter = <K extends keyof TransactionFilters>(k: K, v: TransactionFilters[K]) => setFilters((f) => ({ ...f, [k]: v }))

  const categories = useMemo(() => {
    const known = filters.type === 'income' ? INCOME_CATEGORIES : filters.type === 'expense' ? EXPENSE_CATEGORIES : [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES]
    const extra = transactions.filter((t) => filters.type === 'all' || t.type === filters.type).map((t) => t.category)
    return [...new Set([...known, ...extra])]
  }, [transactions, filters.type])

  const rows = useMemo(
    () => filterTransactions(transactions, filters).sort((a, b) => b.date.localeCompare(a.date)),
    [transactions, filters],
  )
  const income = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={`${rows.length} shown · ${formatCurrency(income, currency)} in · ${formatCurrency(expense, currency)} out`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" /> Add transaction
          </Button>
        }
      />

      <Card>
        <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <MonthSelect value={filters.month} onChange={(m) => setFilter('month', m)} allowAll className="w-full" />
          <select
            aria-label="Type"
            value={filters.type}
            onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value as TransactionFilters['type'], category: 'all' }))}
            className={inputClass}
          >
            <option value="all">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select aria-label="Category" value={filters.category} onChange={(e) => setFilter('category', e.target.value)} className={inputClass}>
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            type="search"
            aria-label="Search notes"
            placeholder="Search notes…"
            value={filters.search}
            onChange={(e) => setFilter('search', e.target.value)}
            className={inputClass}
          />
        </div>

        {rows.length ? (
          <TransactionTable
            transactions={rows}
            currency={currency}
            onEdit={setEditing}
            onDelete={(t) => {
              if (confirm(`Delete this ${t.type} of ${formatCurrency(t.amount, currency)}?`)) deleteTransaction(t.id)
            }}
          />
        ) : (
          <EmptyState title="No matching transactions">Try a different month or clear the filters.</EmptyState>
        )}
      </Card>

      <Modal open={creating || editing !== null} title={editing ? 'Edit transaction' : 'New transaction'} onClose={close}>
        <TransactionForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onCancel={close}
          onSubmit={(t) => {
            if (editing) updateTransaction(editing.id, t)
            else addTransaction(t)
            close()
          }}
        />
      </Modal>
    </>
  )
}
