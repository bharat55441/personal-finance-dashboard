export interface Budget {
  id: string
  /** Expense category this budget caps. One budget per category. */
  category: string
  /** Monthly limit */
  limit: number
}
