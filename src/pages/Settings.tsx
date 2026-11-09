import { format } from 'date-fns'
import { useRef, useState, type ChangeEvent } from 'react'
import { PageHeader } from '../components/Layout'
import { Button, Card, CardHeader, Icon, inputBase } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import { downloadFile, parseTransactionsCSV, transactionsToCSV } from '../utils/csv'
import { CURRENCIES } from '../utils/formatCurrency'
import { buildSampleData } from '../utils/sampleData'

export function Settings() {
  const transactions = useFinanceStore((s) => s.transactions)
  const theme = useFinanceStore((s) => s.theme)
  const currency = useFinanceStore((s) => s.currency)
  const toggleTheme = useFinanceStore((s) => s.toggleTheme)
  const setCurrency = useFinanceStore((s) => s.setCurrency)
  const importTransactions = useFinanceStore((s) => s.importTransactions)
  const importData = useFinanceStore((s) => s.importData)
  const clearAll = useFinanceStore((s) => s.clearAll)
  const user = useFinanceStore((s) => s.user)

  const fileRef = useRef<HTMLInputElement>(null)
  const [importMsg, setImportMsg] = useState<{ ok: string; errors: string[] } | null>(null)
  const [busy, setBusy] = useState(false)

  const exportCSV = () => {
    downloadFile(`transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`, transactionsToCSV(transactions))
  }

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const { transactions: parsed, errors } = parseTransactionsCSV(await file.text())
    setBusy(true)
    const imported = parsed.length ? await importTransactions(parsed.map(({ id: _id, ...t }) => t)) : 0
    setBusy(false)
    setImportMsg({ ok: `Imported ${imported} transaction${imported === 1 ? '' : 's'} from ${file.name}.`, errors })
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    await fn()
    setBusy(false)
  }

  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Appearance & currency" />
          <div className="space-y-4">
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Dark mode</span>
              <button
                type="button"
                role="switch"
                aria-checked={theme === 'dark'}
                onClick={toggleTheme}
                className="relative h-6 w-11 rounded-full bg-stone-300 transition-colors aria-checked:bg-blue-600 dark:bg-stone-700"
              >
                <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${theme === 'dark' ? 'translate-x-5' : ''}`} />
              </button>
            </label>
            <label className="flex items-center justify-between gap-4">
              <span className="text-sm font-medium">Currency</span>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className={inputBase}>
                {CURRENCIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <CardHeader title="CSV import / export" subtitle="Columns: date, type, category, amount, note" />
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={exportCSV} disabled={!transactions.length}>
              <Icon name="download" /> Export {transactions.length} transactions
            </Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()} disabled={busy}>
              <Icon name="upload" /> Import CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onFile} />
          </div>
          <p className="mt-3 text-xs text-stone-500 dark:text-stone-400">
            Dates as yyyy-MM-dd, type as <code>income</code> or <code>expense</code>. Imported rows are added to your existing data.
          </p>
          {importMsg && (
            <div className="mt-3 rounded-lg bg-stone-100 p-3 text-sm dark:bg-stone-800" role="status">
              <p>{importMsg.ok}</p>
              {importMsg.errors.length > 0 && (
                <details className="mt-1 text-red-700 dark:text-red-300">
                  <summary>{importMsg.errors.length} row(s) skipped</summary>
                  <ul className="mt-1 list-disc pl-5 text-xs">
                    {importMsg.errors.slice(0, 20).map((err) => (
                      <li key={err}>{err}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Data" subtitle={`Stored on the server in ${user?.email ?? 'your'} account.`} />
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (!transactions.length || confirm('Replace all current data with sample data?')) run(() => importData(buildSampleData(), true))
              }}
            >
              Load sample data
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                confirm('Delete all transactions, budgets, recurring rules and goals? This cannot be undone.') && run(clearAll)
              }
            >
              <Icon name="trash" /> Clear all data
            </Button>
          </div>
        </Card>
      </div>
    </>
  )
}
