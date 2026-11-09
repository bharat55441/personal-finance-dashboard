import { format } from 'date-fns'
import { useState, type FormEvent } from 'react'
import { categoriesFor, type Transaction, type TransactionInput, type TransactionType } from '../types/Transaction'
import { Button, cx, Field, inputClass } from './ui'

interface Props {
  initial?: Transaction
  onSubmit: (t: TransactionInput) => void
  onCancel: () => void
}

export function TransactionForm({ initial, onSubmit, onCancel }: Props) {
  const [type, setType] = useState<TransactionType>(initial?.type ?? 'expense')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [category, setCategory] = useState(initial?.category ?? categoriesFor('expense')[0])
  const [date, setDate] = useState(() => initial?.date ?? format(new Date(), 'yyyy-MM-dd'))
  const [note, setNote] = useState(initial?.note ?? '')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const categories = categoriesFor(type)
  // Keep a legacy/imported category selectable when editing.
  const options = categories.includes(category) ? categories : [category, ...categories]

  const changeType = (t: TransactionType) => {
    setType(t)
    if (!categoriesFor(t).includes(category)) setCategory(categoriesFor(t)[0])
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const value = Number(amount)
    const next: Record<string, string> = {}
    if (!Number.isFinite(value) || value <= 0) next.amount = 'Enter an amount greater than 0'
    if (!date) next.date = 'Pick a date'
    setErrors(next)
    if (Object.keys(next).length) return
    onSubmit({ type, amount: Math.round(value * 100) / 100, category, date, note: note.trim(), recurringId: initial?.recurringId })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div role="radiogroup" aria-label="Type" className="grid grid-cols-2 gap-1 rounded-lg bg-stone-100 p-1 dark:bg-stone-800">
        {(['expense', 'income'] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={type === t}
            onClick={() => changeType(t)}
            className={cx(
              'rounded-md py-1.5 text-sm font-medium capitalize',
              type === t ? 'bg-white shadow-sm dark:bg-stone-950' : 'text-stone-500 dark:text-stone-400',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Amount" error={errors.amount}>
          {(id) => (
            <input
              id={id}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          )}
        </Field>
        <Field label="Date" error={errors.date}>
          {(id) => <input id={id} type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />}
        </Field>
      </div>

      <Field label="Category">
        {(id) => (
          <select id={id} value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {options.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        )}
      </Field>

      <Field label="Note">
        {(id) => (
          <input
            id={id}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="Optional"
            maxLength={120}
          />
        )}
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initial ? 'Save changes' : 'Add transaction'}</Button>
      </div>
    </form>
  )
}
