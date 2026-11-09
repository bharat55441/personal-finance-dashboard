import { useState } from 'react'
import { useFinanceStore, type ImportPayload } from '../store/useFinanceStore'
import { Button, Icon } from './ui'

/** Key used by the localStorage-only version of the app. */
const LEGACY_KEY = 'pfd-finance'

function readLegacy(): ImportPayload | null {
  try {
    const state = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? 'null')?.state
    if (!state) return null
    const data: ImportPayload = {
      transactions: state.transactions ?? [],
      budgets: state.budgets ?? [],
      recurring: state.recurring ?? [],
      goals: state.goals ?? [],
    }
    const count = data.transactions.length + data.budgets.length + data.recurring.length + data.goals.length
    return count ? data : null
  } catch {
    return null
  }
}

/** Offers to upload data saved by the earlier, browser-only version of the app. */
export function LocalDataBanner() {
  const importData = useFinanceStore((s) => s.importData)
  const [legacy, setLegacy] = useState(readLegacy)
  const [busy, setBusy] = useState(false)

  if (!legacy) return null

  const forget = () => {
    try {
      localStorage.removeItem(LEGACY_KEY)
    } catch {
      // ignore
    }
    setLegacy(null)
  }

  const upload = async () => {
    setBusy(true)
    await importData(legacy, false)
    setBusy(false)
    // Only forget the local copy once the server has it.
    if (!useFinanceStore.getState().error) forget()
  }

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-100">
      <Icon name="upload" className="size-4" />
      <p className="flex-1">
        Found <strong>{legacy.transactions.length} transactions</strong>, {legacy.budgets.length} budgets and {legacy.goals.length} goals
        saved in this browser. Upload them to your account?
      </p>
      <div className="flex gap-2">
        <Button size="sm" onClick={upload} disabled={busy}>
          {busy ? 'Uploading…' : 'Upload'}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => confirm('Discard the data saved in this browser?') && forget()}>
          Discard
        </Button>
      </div>
    </div>
  )
}
