export interface Budget {
  id: string
  /** Expense category this budget caps. One budget per category. */
  category: string
  /** Monthly limit */
  limit: number
}

export interface SavingsGoal {
  id: string
  name: string
  target: number
  saved: number
  /** Optional ISO date, yyyy-MM-dd */
  deadline?: string
}
