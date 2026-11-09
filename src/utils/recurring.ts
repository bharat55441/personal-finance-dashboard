import { addMonths, format, getDaysInMonth, parse } from 'date-fns'
import type { RecurringRule, Transaction } from '../types/Transaction'
import { newId } from './id'

// Keep in sync with pfd-api's src/lib/recurring.ts (same date rules).

const MONTH = 'yyyy-MM'

function monthDate(month: string): Date {
  return parse(month, MONTH, new Date(2000, 0, 1))
}

/** The transaction date for a rule in a given month, clamping e.g. day 31 to Feb 28. */
export function occurrenceDate(rule: Pick<RecurringRule, 'dayOfMonth'>, month: string): string {
  const d = monthDate(month)
  const day = Math.min(rule.dayOfMonth, getDaysInMonth(d))
  return format(new Date(d.getFullYear(), d.getMonth(), day), 'yyyy-MM-dd')
}

/**
 * Generate every occurrence that is due up to and including `today` and hasn't
 * been generated yet. Pure: returns new transactions plus the rules with
 * `lastGenerated` advanced.
 */
export function generateDueTransactions(
  rules: RecurringRule[],
  today: Date = new Date(),
  makeId: () => string = newId,
): { transactions: Transaction[]; rules: RecurringRule[] } {
  const todayStr = format(today, 'yyyy-MM-dd')
  const currentMonth = format(today, MONTH)
  const transactions: Transaction[] = []

  const updated = rules.map((rule) => {
    if (!rule.active) return rule

    let month = rule.lastGenerated
      ? format(addMonths(monthDate(rule.lastGenerated), 1), MONTH)
      : rule.startMonth
    let lastGenerated = rule.lastGenerated

    while (month <= currentMonth) {
      const date = occurrenceDate(rule, month)
      if (date > todayStr) break
      transactions.push({
        id: makeId(),
        type: rule.type,
        amount: rule.amount,
        category: rule.category,
        date,
        note: rule.note,
        recurringId: rule.id,
      })
      lastGenerated = month
      month = format(addMonths(monthDate(month), 1), MONTH)
    }

    return lastGenerated === rule.lastGenerated ? rule : { ...rule, lastGenerated }
  })

  return { transactions, rules: updated }
}
