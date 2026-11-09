import { useMemo, useState, type FormEvent } from 'react'
import { BudgetCard } from '../components/BudgetCard'
import { PageHeader } from '../components/Layout'
import { MonthSelect } from '../components/MonthSelect'
import { Button, Card, EmptyState, Field, Icon, inputClass, Modal, ProgressBar } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import type { Budget } from '../types/Budget'
import { EXPENSE_CATEGORIES } from '../types/Transaction'
import { budgetStatus, categoryBreakdown, currentMonth, monthLabel } from '../utils/finance'
import { formatCurrency } from '../utils/formatCurrency'

export function Budgets() {
  const budgets = useFinanceStore((s) => s.budgets)
  const transactions = useFinanceStore((s) => s.transactions)
  const currency = useFinanceStore((s) => s.currency)
  const setBudget = useFinanceStore((s) => s.setBudget)
  const deleteBudget = useFinanceStore((s) => s.deleteBudget)

  const [month, setMonth] = useState(currentMonth())
  const [editing, setEditing] = useState<Budget | null>(null)
  const [creating, setCreating] = useState(false)

  const spent = useMemo(
    () => new Map(categoryBreakdown(transactions, month).map((d) => [d.category, d.value])),
    [transactions, month],
  )
  const totalLimit = budgets.reduce((s, b) => s + b.limit, 0)
  const totalSpent = budgets.reduce((s, b) => s + (spent.get(b.category) ?? 0), 0)
  const unbudgeted = EXPENSE_CATEGORIES.filter((c) => !budgets.some((b) => b.category === c))

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Monthly spending limits per category"
        actions={
          <>
            <MonthSelect value={month} onChange={setMonth} />
            <Button onClick={() => setCreating(true)} disabled={!unbudgeted.length}>
              <Icon name="plus" /> Add budget
            </Button>
          </>
        }
      />

      {budgets.length ? (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">Total for {monthLabel(month)}</h2>
              <p className="text-sm tabular-nums">
                <span className="font-semibold">{formatCurrency(totalSpent, currency)}</span>
                <span className="text-stone-500 dark:text-stone-400"> of {formatCurrency(totalLimit, currency)}</span>
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar value={totalLimit ? totalSpent / totalLimit : 0} status={budgetStatus(totalSpent, totalLimit)} label="Total budget used" />
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {budgets.map((b) => (
              <BudgetCard
                key={b.id}
                budget={b}
                spent={spent.get(b.category) ?? 0}
                currency={currency}
                onEdit={() => setEditing(b)}
                onDelete={() => confirm(`Delete the ${b.category} budget?`) && deleteBudget(b.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No budgets yet">Set a monthly limit for a category to track it here.</EmptyState>
      )}

      <Modal open={creating || editing !== null} title={editing ? `Edit ${editing.category} budget` : 'New budget'} onClose={close}>
        <BudgetForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          categories={editing ? [editing.category] : unbudgeted}
          onCancel={close}
          onSubmit={(category, limit) => {
            setBudget(category, limit)
            close()
          }}
        />
      </Modal>
    </>
  )
}

function BudgetForm({
  initial,
  categories,
  onSubmit,
  onCancel,
}: {
  initial?: Budget
  categories: readonly string[]
  onSubmit: (category: string, limit: number) => void
  onCancel: () => void
}) {
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? '')
  const [limit, setLimit] = useState(initial ? String(initial.limit) : '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(limit)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter a limit greater than 0')
    onSubmit(category, value)
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Category">
        {(id) => (
          <select id={id} value={category} onChange={(e) => setCategory(e.target.value)} disabled={Boolean(initial)} className={inputClass}>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </Field>
      <Field label="Monthly limit" error={error}>
        {(id) => <input id={id} type="number" min="0" step="1" autoFocus value={limit} onChange={(e) => setLimit(e.target.value)} className={inputClass} />}
      </Field>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save budget</Button>
      </div>
    </form>
  )
}
