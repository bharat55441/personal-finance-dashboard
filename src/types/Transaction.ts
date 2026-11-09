export type TransactionType = 'income' | 'expense'

export interface Transaction {
  id: string
  type: TransactionType
  /** Always positive; `type` decides the sign. */
  amount: number
  category: string
  /** ISO date, yyyy-MM-dd */
  date: string
  note: string
  /** Set when generated from a recurring rule. */
  recurringId?: string
}

export type TransactionInput = Omit<Transaction, 'id'>

export interface RecurringRule {
  id: string
  type: TransactionType
  amount: number
  category: string
  note: string
  /** 1-31; clamped to the last day of shorter months. */
  dayOfMonth: number
  /** First month to generate, yyyy-MM */
  startMonth: string
  /** Last month already generated, yyyy-MM */
  lastGenerated: string | null
  active: boolean
}

export type RecurringInput = Omit<RecurringRule, 'id' | 'lastGenerated'>

export const EXPENSE_CATEGORIES = [
  'Housing',
  'Food',
  'Transport',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Other',
] as const

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investments',
  'Gifts',
  'Other Income',
] as const

export function categoriesFor(type: TransactionType): readonly string[] {
  return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
}
