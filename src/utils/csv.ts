import Papa from 'papaparse'
import { isValid, parseISO } from 'date-fns'
import type { Transaction } from '../types/Transaction'
import { newId } from './id'

const COLUMNS = ['date', 'type', 'category', 'amount', 'note'] as const

export function transactionsToCSV(transactions: Transaction[]): string {
  const rows = [...transactions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => ({ date: t.date, type: t.type, category: t.category, amount: t.amount, note: t.note }))
  return Papa.unparse(rows, { columns: [...COLUMNS] })
}

export interface CSVImportResult {
  transactions: Transaction[]
  errors: string[]
}

export function parseTransactionsCSV(text: string, makeId: () => string = newId): CSVImportResult {
  const parsed = Papa.parse<Record<string, string>>(text.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })

  const errors = parsed.errors.map((e) => `Row ${(e.row ?? 0) + 2}: ${e.message}`)
  const missing = COLUMNS.filter((c) => c !== 'note' && !parsed.meta.fields?.includes(c))
  if (missing.length) {
    return { transactions: [], errors: [`Missing column(s): ${missing.join(', ')}`] }
  }

  const transactions: Transaction[] = []
  parsed.data.forEach((row, i) => {
    const line = i + 2 // header is line 1
    const type = row.type?.trim().toLowerCase()
    const raw = Number(String(row.amount ?? '').replace(/[^0-9.-]/g, ''))
    const date = row.date?.trim()

    if (type !== 'income' && type !== 'expense') {
      errors.push(`Row ${line}: type must be "income" or "expense"`)
      return
    }
    if (!Number.isFinite(raw) || raw === 0) {
      errors.push(`Row ${line}: invalid amount "${row.amount}"`)
      return
    }
    if (!date || !isValid(parseISO(date))) {
      errors.push(`Row ${line}: invalid date "${row.date}" (expected yyyy-MM-dd)`)
      return
    }

    transactions.push({
      id: makeId(),
      type,
      amount: Math.abs(raw),
      category: row.category?.trim() || (type === 'income' ? 'Other Income' : 'Other'),
      date: date.slice(0, 10),
      note: row.note?.trim() ?? '',
    })
  })

  return { transactions, errors }
}

export function downloadFile(filename: string, content: string, mime = 'text/csv') {
  const url = URL.createObjectURL(new Blob([content], { type: mime }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
