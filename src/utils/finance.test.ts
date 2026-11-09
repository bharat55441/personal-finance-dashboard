import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types/Transaction'
import {
  availableMonths,
  balance,
  budgetStatus,
  categoryBreakdown,
  filterTransactions,
  monthlySeries,
  totalsForMonth,
} from './finance'

const t = (type: Transaction['type'], amount: number, category: string, date: string, note = ''): Transaction => ({
  id: `${type}-${amount}-${date}`,
  type,
  amount,
  category,
  date,
  note,
})

const data = [
  t('income', 3000, 'Salary', '2026-03-01'),
  t('expense', 1200, 'Housing', '2026-03-03', 'Rent'),
  t('expense', 80, 'Food', '2026-03-10', 'Groceries'),
  t('expense', 20, 'Food', '2026-03-12', 'Coffee'),
  t('expense', 50, 'Transport', '2026-02-20'),
  t('income', 500, 'Freelance', '2025-12-15'),
]

describe('finance', () => {
  it('computes balance across all time', () => {
    expect(balance(data)).toBe(3000 + 500 - 1200 - 80 - 20 - 50)
  })

  it('totals a single month', () => {
    expect(totalsForMonth(data, '2026-03')).toEqual({ month: '2026-03', income: 3000, expense: 1300, net: 1700 })
  })

  it('builds a contiguous monthly series, zero-filling gaps', () => {
    const series = monthlySeries(data, 4, '2026-03')
    expect(series.map((s) => s.month)).toEqual(['2025-12', '2026-01', '2026-02', '2026-03'])
    expect(series[1]).toEqual({ month: '2026-01', income: 0, expense: 0, net: 0 })
    expect(series[2].expense).toBe(50)
  })

  it('breaks spending down by category, largest first', () => {
    expect(categoryBreakdown(data, '2026-03')).toEqual([
      { category: 'Housing', value: 1200 },
      { category: 'Food', value: 100 },
    ])
  })

  it('filters by month, category, type and note text', () => {
    const base = { month: 'all', category: 'all', type: 'all', search: '' } as const
    expect(filterTransactions(data, { ...base, month: '2026-03' })).toHaveLength(4)
    expect(filterTransactions(data, { ...base, category: 'Food' })).toHaveLength(2)
    expect(filterTransactions(data, { ...base, type: 'income' })).toHaveLength(2)
    expect(filterTransactions(data, { ...base, search: 'coff' })).toHaveLength(1)
  })

  it('classifies budget status', () => {
    expect(budgetStatus(50, 100)).toBe('good')
    expect(budgetStatus(80, 100)).toBe('warning')
    expect(budgetStatus(100, 100)).toBe('warning')
    expect(budgetStatus(101, 100)).toBe('critical')
  })

  it('lists months with data plus the current month, newest first', () => {
    expect(availableMonths(data, new Date(2026, 5, 1))).toEqual(['2026-06', '2026-03', '2026-02', '2025-12'])
  })
})
