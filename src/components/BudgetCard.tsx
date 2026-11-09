import type { Budget } from '../types/Budget'
import { budgetStatus } from '../utils/finance'
import { formatCurrency } from '../utils/formatCurrency'
import { Card, Icon, ProgressBar, StatusBadge } from './ui'

interface Props {
  budget: Budget
  spent: number
  currency: string
  onEdit?: () => void
  onDelete?: () => void
}

export function BudgetCard({ budget, spent, currency, onEdit, onDelete }: Props) {
  const status = budgetStatus(spent, budget.limit)
  const remaining = budget.limit - spent

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-medium">{budget.category}</h3>
          <StatusBadge status={status} />
        </div>
        {(onEdit || onDelete) && (
          <div className="flex gap-1">
            {onEdit && (
              <button type="button" onClick={onEdit} aria-label={`Edit ${budget.category} budget`} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800">
                <Icon name="edit" />
              </button>
            )}
            {onDelete && (
              <button type="button" onClick={onDelete} aria-label={`Delete ${budget.category} budget`} className="rounded-md p-1.5 text-stone-500 hover:bg-stone-100 hover:text-red-600 dark:hover:bg-stone-800">
                <Icon name="trash" />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline justify-between text-sm">
        <span className="font-semibold tabular-nums">{formatCurrency(spent, currency)}</span>
        <span className="text-stone-500 tabular-nums dark:text-stone-400">of {formatCurrency(budget.limit, currency)}</span>
      </div>
      <div className="mt-2">
        <ProgressBar value={budget.limit ? spent / budget.limit : 1} status={status} label={`${budget.category} budget used`} />
      </div>
      <p className="mt-2 text-xs text-stone-500 tabular-nums dark:text-stone-400">
        {remaining >= 0
          ? `${formatCurrency(remaining, currency)} left`
          : `${formatCurrency(-remaining, currency)} over budget`}
      </p>
    </Card>
  )
}
