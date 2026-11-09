import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { PageHeader } from '../components/Layout'
import { Button, Card, cx, EmptyState, Field, Icon, inputClass, Modal } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import { categoriesFor, type RecurringInput, type RecurringRule, type TransactionType } from '../types/Transaction'
import { monthLabel } from '../utils/finance'
import { formatCurrency } from '../utils/formatCurrency'

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function Recurring() {
  const rules = useFinanceStore((s) => s.recurring)
  const currency = useFinanceStore((s) => s.currency)
  const addRecurring = useFinanceStore((s) => s.addRecurring)
  const updateRecurring = useFinanceStore((s) => s.updateRecurring)
  const deleteRecurring = useFinanceStore((s) => s.deleteRecurring)
  const [editing, setEditing] = useState<RecurringRule | null>(null)
  const [creating, setCreating] = useState(false)

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  const monthlyNet = rules
    .filter((r) => r.active)
    .reduce((s, r) => s + (r.type === 'income' ? r.amount : -r.amount), 0)

  return (
    <>
      <PageHeader
        title="Recurring"
        subtitle={`Auto-generated every month · net ${formatCurrency(monthlyNet, currency)}/month`}
        actions={
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" /> Add recurring
          </Button>
        }
      />

      {rules.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.map((r) => (
            <Card key={r.id} className={cx('p-4', !r.active && 'opacity-60')}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-medium">{r.note || r.category}</h3>
                  <p className="text-sm text-stone-500 dark:text-stone-400">
                    {r.category} · {ordinal(r.dayOfMonth)} of each month
                  </p>
                </div>
                <p className={cx('font-semibold tabular-nums', r.type === 'income' && 'text-[#006300] dark:text-[#0ca30c]')}>
                  {r.type === 'income' ? '+' : '−'}
                  {formatCurrency(r.amount, currency)}
                </p>
              </div>
              <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                Since {monthLabel(r.startMonth)}
                {r.lastGenerated && ` · last generated ${monthLabel(r.lastGenerated)}`}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => updateRecurring(r.id, { active: !r.active })}>
                  {r.active ? 'Pause' : 'Resume'}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                  <Icon name="edit" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm('Delete this recurring rule? Already generated transactions are kept.')) deleteRecurring(r.id)
                  }}
                >
                  <Icon name="trash" /> Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState title="No recurring transactions">Add rent, salary or subscriptions and they'll be created automatically each month.</EmptyState>
      )}

      <Modal open={creating || editing !== null} title={editing ? 'Edit recurring' : 'New recurring transaction'} onClose={close}>
        <RecurringForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onCancel={close}
          onSubmit={(r) => {
            if (editing) updateRecurring(editing.id, r)
            else addRecurring(r)
            close()
          }}
        />
      </Modal>
    </>
  )
}

function RecurringForm({ initial, onSubmit, onCancel }: { initial?: RecurringRule; onSubmit: (r: RecurringInput) => void; onCancel: () => void }) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? categoriesFor('expense')[0])
  const [note, setNote] = useState(initial?.note ?? '')
  const [day, setDay] = useState(String(initial?.dayOfMonth ?? 1))
  const [startMonth, setStartMonth] = useState(() => initial?.startMonth ?? format(new Date(), 'yyyy-MM'))
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    const d = Number(day)
    if (!Number.isFinite(value) || value <= 0) return setError('Enter an amount greater than 0')
    if (!Number.isInteger(d) || d < 1 || d > 31) return setError('Day must be between 1 and 31')
    if (!startMonth) return setError('Pick a start month')
    onSubmit({ type, amount: value, category, note: note.trim(), dayOfMonth: d, startMonth, active: initial?.active ?? true })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Type">
          {(id) => (
            <select
              id={id}
              value={type}
              onChange={(e) => {
                const t = e.target.value as TransactionType
                setType(t)
                setCategory(categoriesFor(t)[0])
              }}
              className={inputClass}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
            </select>
          )}
        </Field>
        <Field label="Amount">
          {(id) => <input id={id} type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Category">
          {(id) => (
            <select id={id} value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
              {categoriesFor(type).map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Name / note">
          {(id) => <input id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Rent" className={inputClass} />}
        </Field>
        <Field label="Day of month">
          {(id) => <input id={id} type="number" min="1" max="31" value={day} onChange={(e) => setDay(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Starting month">
          {(id) => (
            <input
              id={id}
              type="month"
              value={startMonth}
              disabled={Boolean(initial?.lastGenerated)}
              onChange={(e) => setStartMonth(e.target.value)}
              className={inputClass}
            />
          )}
        </Field>
      </div>
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Past months back to the start month are generated immediately. Days past the end of a short month fall on its last day.
      </p>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save' : 'Add'}</Button>
      </div>
    </form>
  )
}
