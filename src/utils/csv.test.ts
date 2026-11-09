import { describe, expect, it } from 'vitest'
import type { Transaction } from '../types/Transaction'
import { parseTransactionsCSV, transactionsToCSV } from './csv'

let n = 0
const makeId = () => `id-${++n}`

const sample: Transaction[] = [
  { id: 'a', type: 'expense', amount: 12.5, category: 'Food', date: '2026-03-02', note: 'Lunch, with "friends"' },
  { id: 'b', type: 'income', amount: 3000, category: 'Salary', date: '2026-03-01', note: '' },
]

describe('csv', () => {
  it('round-trips transactions, including quotes and commas', () => {
    const csv = transactionsToCSV(sample)
    expect(csv.split(/\r?\n/)[0]).toBe('date,type,category,amount,note')
    const { transactions, errors } = parseTransactionsCSV(csv, makeId)
    expect(errors).toEqual([])
    const strip = ({ id: _id, ...rest }: Transaction) => rest
    // Export sorts by date.
    expect(transactions.map(strip)).toEqual([strip(sample[1]), strip(sample[0])])
  })

  it('accepts header case/whitespace, currency symbols and negative amounts', () => {
    const csv = ' Date ,TYPE,Category,Amount\n2026-01-05,Expense,Food,"-$1,234.50"'
    const { transactions, errors } = parseTransactionsCSV(csv, makeId)
    expect(errors).toEqual([])
    expect(transactions[0]).toMatchObject({ type: 'expense', amount: 1234.5, category: 'Food', note: '' })
  })

  it('reports bad rows and keeps good ones', () => {
    const csv = [
      'date,type,category,amount,note',
      '2026-01-05,expense,Food,10,ok',
      'not-a-date,expense,Food,10,',
      '2026-01-06,transfer,Food,10,',
      '2026-01-07,income,Salary,abc,',
    ].join('\n')
    const { transactions, errors } = parseTransactionsCSV(csv, makeId)
    expect(transactions).toHaveLength(1)
    expect(errors).toHaveLength(3)
    expect(errors[0]).toMatch(/Row 3: invalid date/)
  })

  it('rejects files missing required columns', () => {
    const { transactions, errors } = parseTransactionsCSV('date,amount\n2026-01-01,5', makeId)
    expect(transactions).toEqual([])
    expect(errors[0]).toMatch(/Missing column\(s\): type, category/)
  })
})
