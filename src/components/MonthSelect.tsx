import { useMemo } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'
import { availableMonths, monthLabel } from '../utils/finance'
import { cx, inputBase } from './ui'

interface Props {
  value: string
  onChange: (month: string) => void
  allowAll?: boolean
  className?: string
  label?: string
}

export function MonthSelect({ value, onChange, allowAll, className, label = 'Month' }: Props) {
  const transactions = useFinanceStore((s) => s.transactions)
  const months = useMemo(() => availableMonths(transactions), [transactions])

  return (
    <select aria-label={label} value={value} onChange={(e) => onChange(e.target.value)} className={cx(inputBase, className)}>
      {allowAll && <option value="all">All months</option>}
      {months.map((m) => (
        <option key={m} value={m}>
          {monthLabel(m)}
        </option>
      ))}
    </select>
  )
}
