import { describe, expect, it } from 'vitest'
import type { RecurringRule } from '../types/Transaction'
import { generateDueTransactions, occurrenceDate } from './recurring'

let n = 0
const makeId = () => `id-${++n}`

const rule = (overrides: Partial<RecurringRule> = {}): RecurringRule => ({
  id: 'r1',
  type: 'expense',
  amount: 1000,
  category: 'Housing',
  note: 'Rent',
  dayOfMonth: 5,
  startMonth: '2026-01',
  lastGenerated: null,
  active: true,
  ...overrides,
})

describe('occurrenceDate', () => {
  it('clamps to the last day of short months', () => {
    expect(occurrenceDate({ dayOfMonth: 31 }, '2026-02')).toBe('2026-02-28')
    expect(occurrenceDate({ dayOfMonth: 31 }, '2028-02')).toBe('2028-02-29')
    expect(occurrenceDate({ dayOfMonth: 31 }, '2026-04')).toBe('2026-04-30')
    expect(occurrenceDate({ dayOfMonth: 15 }, '2026-04')).toBe('2026-04-15')
  })
})

describe('generateDueTransactions', () => {
  it('backfills every month from start through today', () => {
    const { transactions, rules } = generateDueTransactions([rule()], new Date(2026, 3, 10), makeId)
    expect(transactions.map((t) => t.date)).toEqual(['2026-01-05', '2026-02-05', '2026-03-05', '2026-04-05'])
    expect(transactions.every((t) => t.recurringId === 'r1' && t.amount === 1000)).toBe(true)
    expect(rules[0].lastGenerated).toBe('2026-04')
  })

  it('does not generate this month before the day arrives', () => {
    const { transactions, rules } = generateDueTransactions([rule()], new Date(2026, 3, 4), makeId)
    expect(transactions.map((t) => t.date)).toEqual(['2026-01-05', '2026-02-05', '2026-03-05'])
    expect(rules[0].lastGenerated).toBe('2026-03')
  })

  it('is idempotent once caught up', () => {
    const today = new Date(2026, 3, 10)
    const first = generateDueTransactions([rule()], today, makeId)
    const second = generateDueTransactions(first.rules, today, makeId)
    expect(second.transactions).toHaveLength(0)
    expect(second.rules[0]).toBe(first.rules[0])
  })

  it('continues after lastGenerated', () => {
    const { transactions } = generateDueTransactions([rule({ lastGenerated: '2026-03' })], new Date(2026, 4, 20), makeId)
    expect(transactions.map((t) => t.date)).toEqual(['2026-04-05', '2026-05-05'])
  })

  it('skips paused rules and future start months', () => {
    const { transactions } = generateDueTransactions(
      [rule({ active: false }), rule({ id: 'r2', startMonth: '2026-09' })],
      new Date(2026, 3, 10),
      makeId,
    )
    expect(transactions).toHaveLength(0)
  })

  it('handles year boundaries', () => {
    const { transactions } = generateDueTransactions([rule({ startMonth: '2025-11', dayOfMonth: 1 })], new Date(2026, 0, 1), makeId)
    expect(transactions.map((t) => t.date)).toEqual(['2025-11-01', '2025-12-01', '2026-01-01'])
  })
})
