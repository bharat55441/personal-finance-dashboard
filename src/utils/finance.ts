import { format, parse, subMonths } from 'date-fns'
import type { Transaction, TransactionType } from '../types/Transaction'

export const monthKey = (date: string) => date.slice(0, 7)

export function currentMonth(today: Date = new Date()): string {
  return format(today, 'yyyy-MM')
}

export function monthLabel(month: string, pattern = 'MMMM yyyy'): string {
  return format(parse(month, 'yyyy-MM', new Date(2000, 0, 1)), pattern)
}

export function balance(transactions: Transaction[]): number {
  return transactions.reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0)
}

export interface MonthTotals {
  month: string
  income: number
  expense: number
  net: number
}

export function totalsForMonth(transactions: Transaction[], month: string): MonthTotals {
  let income = 0
  let expense = 0
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue
    if (t.type === 'income') income += t.amount
    else expense += t.amount
  }
  return { month, income, expense, net: income - expense }
}

/** Totals for the `count` months ending at `endMonth`, oldest first. */
export function monthlySeries(transactions: Transaction[], count: number, endMonth = currentMonth()): MonthTotals[] {
  const end = parse(endMonth, 'yyyy-MM', new Date(2000, 0, 1))
  const months = Array.from({ length: count }, (_, i) => format(subMonths(end, count - 1 - i), 'yyyy-MM'))
  const byMonth = new Map(months.map((m) => [m, { month: m, income: 0, expense: 0, net: 0 }]))
  for (const t of transactions) {
    const row = byMonth.get(monthKey(t.date))
    if (!row) continue
    if (t.type === 'income') row.income += t.amount
    else row.expense += t.amount
  }
  return months.map((m) => {
    const row = byMonth.get(m)!
    return { ...row, net: row.income - row.expense }
  })
}

/** Spend (or income) per category in a month, largest first. */
export function categoryBreakdown(
  transactions: Transaction[],
  month: string,
  type: TransactionType = 'expense',
): { category: string; value: number }[] {
  const totals = new Map<string, number>()
  for (const t of transactions) {
    if (t.type !== type || monthKey(t.date) !== month) continue
    totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount)
  }
  return [...totals]
    .map(([category, value]) => ({ category, value }))
    .sort((a, b) => b.value - a.value)
}

export interface TransactionFilters {
  month: string | 'all'
  category: string | 'all'
  type: TransactionType | 'all'
  search: string
}

export function filterTransactions(transactions: Transaction[], f: TransactionFilters): Transaction[] {
  const q = f.search.trim().toLowerCase()
  return transactions.filter(
    (t) =>
      (f.month === 'all' || monthKey(t.date) === f.month) &&
      (f.category === 'all' || t.category === f.category) &&
      (f.type === 'all' || t.type === f.type) &&
      (!q || t.note.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)),
  )
}

export type BudgetStatus = 'good' | 'warning' | 'critical'

/** >= 80% of the limit warns; anything over the limit is critical. */
export function budgetStatus(spent: number, limit: number): BudgetStatus {
  if (limit <= 0) return spent > 0 ? 'critical' : 'good'
  const ratio = spent / limit
  if (ratio > 1) return 'critical'
  if (ratio >= 0.8) return 'warning'
  return 'good'
}

/** Months (yyyy-MM) that have transactions, plus the current month, newest first. */
export function availableMonths(transactions: Transaction[], today: Date = new Date()): string[] {
  const set = new Set(transactions.map((t) => monthKey(t.date)))
  set.add(currentMonth(today))
  return [...set].sort().reverse()
}
