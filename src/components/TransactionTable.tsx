import { format, parseISO } from 'date-fns'
import type { Transaction } from '../types/Transaction'
import { useChartColors } from '../hooks/useChartColors'
import { formatCurrency } from '../utils/formatCurrency'
import { cx, Icon } from './ui'

interface Props {
  transactions: Transaction[]
  currency: string
  onEdit?: (t: Transaction) => void
  onDelete?: (t: Transaction) => void
}

export function TransactionTable({ transactions, currency, onEdit, onDelete }: Props) {
  const { categoryColor } = useChartColors()
  const showActions = Boolean(onEdit || onDelete)

  return (
    <div className="-mx-5 overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500 dark:border-stone-800 dark:text-stone-400">
            <th className="px-5 py-2 font-medium">Date</th>
            <th className="px-2 py-2 font-medium">Category</th>
            <th className="px-2 py-2 font-medium">Note</th>
            <th className="px-2 py-2 text-right font-medium">Amount</th>
            {showActions && <th className="px-5 py-2"><span className="sr-only">Actions</span></th>}
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr key={t.id} className="group border-b border-stone-100 last:border-0 hover:bg-stone-50 dark:border-stone-800/70 dark:hover:bg-stone-800/40">
              <td className="whitespace-nowrap px-5 py-2.5 text-stone-500 tabular-nums dark:text-stone-400">
                {format(parseISO(t.date), 'MMM d, yyyy')}
              </td>
              <td className="px-2 py-2.5">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: categoryColor(t.category) }} />
                  {t.category}
                  {t.recurringId && (
                    <span title="Recurring" className="text-stone-400">
                      <Icon name="repeat" className="size-3.5" />
                      <span className="sr-only">(recurring)</span>
                    </span>
                  )}
                </span>
              </td>
              <td className="max-w-56 truncate px-2 py-2.5 text-stone-600 dark:text-stone-300">{t.note || '—'}</td>
              <td
                className={cx(
                  'whitespace-nowrap px-2 py-2.5 text-right font-medium tabular-nums',
                  t.type === 'income' && 'text-[#006300] dark:text-[#0ca30c]',
                )}
              >
                {t.type === 'income' ? '+' : '−'}
                {formatCurrency(t.amount, currency)}
              </td>
              {showActions && (
                <td className="whitespace-nowrap px-5 py-2.5 text-right">
                  <div className="inline-flex gap-1 opacity-70 group-hover:opacity-100">
                    {onEdit && (
                      <button type="button" onClick={() => onEdit(t)} aria-label="Edit transaction" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200 dark:hover:bg-stone-700">
                        <Icon name="edit" />
                      </button>
                    )}
                    {onDelete && (
                      <button type="button" onClick={() => onDelete(t)} aria-label="Delete transaction" className="rounded-md p-1.5 text-stone-500 hover:bg-stone-200 hover:text-red-600 dark:hover:bg-stone-700">
                        <Icon name="trash" />
                      </button>
                    )}
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
