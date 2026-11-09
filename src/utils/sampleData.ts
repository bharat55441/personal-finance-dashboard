import { format, subMonths } from 'date-fns'
import type { Budget, SavingsGoal } from '../types/Budget'
import type { RecurringRule, Transaction } from '../types/Transaction'
import { newId } from './id'
import { generateDueTransactions } from './recurring'

/** Demo data covering the last 12 months, so every chart has something to show. */
export function buildSampleData(today: Date = new Date()) {
  const startMonth = format(subMonths(today, 11), 'yyyy-MM')
  const recurring: RecurringRule[] = [
    { id: newId(), type: 'income', amount: 5200, category: 'Salary', note: 'Monthly salary', dayOfMonth: 1, startMonth, lastGenerated: null, active: true },
    { id: newId(), type: 'expense', amount: 1650, category: 'Housing', note: 'Rent', dayOfMonth: 3, startMonth, lastGenerated: null, active: true },
    { id: newId(), type: 'expense', amount: 45, category: 'Utilities', note: 'Internet', dayOfMonth: 12, startMonth, lastGenerated: null, active: true },
  ]
  const generated = generateDueTransactions(recurring, today)

  // Deterministic pseudo-random so the demo looks the same each time.
  let seed = 7
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646

  const variable: [string, string, number, number][] = [
    ['Food', 'Groceries', 4, 90],
    ['Food', 'Eating out', 3, 40],
    ['Transport', 'Fuel / transit', 3, 55],
    ['Utilities', 'Electricity', 1, 110],
    ['Entertainment', 'Movies & games', 2, 35],
    ['Shopping', 'Shopping', 2, 80],
    ['Health', 'Pharmacy', 1, 40],
  ]
  const extra: Transaction[] = []
  for (let m = 11; m >= 0; m--) {
    const month = subMonths(today, m)
    const maxDay = m === 0 ? today.getDate() : 28
    for (const [category, note, count, base] of variable) {
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(rand() * maxDay)
        extra.push({
          id: newId(),
          type: 'expense',
          amount: Math.round(base * (0.6 + rand() * 0.9) * 100) / 100,
          category,
          note,
          date: format(new Date(month.getFullYear(), month.getMonth(), day), 'yyyy-MM-dd'),
        })
      }
    }
    if (rand() > 0.55) {
      extra.push({
        id: newId(),
        type: 'income',
        amount: Math.round(300 + rand() * 900),
        category: 'Freelance',
        note: 'Side project',
        date: format(new Date(month.getFullYear(), month.getMonth(), Math.min(15, maxDay)), 'yyyy-MM-dd'),
      })
    }
  }

  const budgets: Budget[] = [
    { id: newId(), category: 'Food', limit: 600 },
    { id: newId(), category: 'Transport', limit: 200 },
    { id: newId(), category: 'Entertainment', limit: 60 },
    { id: newId(), category: 'Shopping', limit: 150 },
  ]
  const goals: SavingsGoal[] = [
    { id: newId(), name: 'Emergency fund', target: 10000, saved: 6200 },
    { id: newId(), name: 'Vacation', target: 3000, saved: 850, deadline: format(subMonths(today, -6), 'yyyy-MM-dd') },
  ]

  return { transactions: [...generated.transactions, ...extra], recurring: generated.rules, budgets, goals }
}
