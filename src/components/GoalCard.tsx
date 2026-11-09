import { differenceInCalendarMonths, format, parseISO } from 'date-fns'
import { useState } from 'react'
import type { SavingsGoal } from '../types/Budget'
import { formatCurrency } from '../utils/formatCurrency'
import { Button, Card, Icon, inputClass, ProgressBar, StatusBadge } from './ui'

interface Props {
  goal: SavingsGoal
  currency: string
  onContribute?: (amount: number) => void
  onEdit?: () => void
  onDelete?: () => void
}

export function GoalCard({ goal, currency, onContribute, onEdit, onDelete }: Props) {
  const [amount, setAmount] = useState('')
  const progress = goal.target > 0 ? goal.saved / goal.target : 0
  const done = goal.saved >= goal.target
  const remaining = Math.max(0, goal.target - goal.saved)
  const monthsLeft = goal.deadline ? differenceInCalendarMonths(parseISO(goal.deadline), new Date()) : null
  const perMonth = monthsLeft && monthsLeft > 0 ? remaining / monthsLeft : null

  const add = (sign: 1 | -1) => {
    const v = Number(amount)
    if (!Number.isFinite(v) || v <= 0) return
    onContribute?.(sign * v)
    setAmount('')
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{goal.name}</h3>
          {goal.deadline && (
            <p className="text-xs text-stone-500 dark:text-stone-400">By {format(parseISO(goal.deadline), 'MMM d, yyyy')}</p>
          )}
        </div>
        <div className="flex gap-1">
          {onEdit && (
            <button type="button" onClick={onEdit} aria-label={`Edit ${goal.name}`} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
              <Icon name="edit" />
            </button>
          )}
          {onDelete && (
            <button type="button" onClick={onDelete} aria-label={`Delete ${goal.name}`} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800">
              <Icon name="trash" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="font-semibold tabular-nums">{formatCurrency(goal.saved, currency)}</span>
        <span className="text-stone-500 tabular-nums dark:text-stone-400">of {formatCurrency(goal.target, currency)}</span>
      </div>
      <div className="mt-2">
        <ProgressBar value={progress} status={done ? 'good' : undefined} label={`${goal.name} progress`} />
      </div>
      <div className="mt-2 flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
        <span className="tabular-nums">{Math.round(progress * 100)}% saved</span>
        {done ? (
          <StatusBadge status="good" label="Goal reached" />
        ) : perMonth ? (
          <span className="tabular-nums">{formatCurrency(perMonth, currency)}/mo to hit deadline</span>
        ) : monthsLeft !== null && monthsLeft <= 0 ? (
          <StatusBadge status="warning" label="Deadline passed" />
        ) : null}
      </div>

      {onContribute && (
        <div className="mt-3 flex gap-2">
          <input
            type="number"
            min="0"
            step="0.01"
            aria-label={`Amount for ${goal.name}`}
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add(1)}
            className={inputClass}
          />
          <Button size="sm" onClick={() => add(1)}>
            Add
          </Button>
          <Button size="sm" variant="secondary" onClick={() => add(-1)}>
            Withdraw
          </Button>
        </div>
      )}
    </Card>
  )
}
