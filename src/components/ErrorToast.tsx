import { useFinanceStore } from '../store/useFinanceStore'
import { Icon } from './ui'

export function ErrorToast() {
  const error = useFinanceStore((s) => s.error)
  const dismissError = useFinanceStore((s) => s.dismissError)
  if (!error) return null

  return (
    <div
      role="alert"
      className="fixed right-4 bottom-4 left-4 z-50 mx-auto flex max-w-md items-start gap-3 rounded-xl border border-red-200 bg-white px-4 py-3 text-sm shadow-lg sm:left-auto dark:border-red-900/60 dark:bg-stone-900"
    >
      <span className="text-red-600 dark:text-red-400">
        <Icon name="alert" />
      </span>
      <p className="flex-1">{error}</p>
      <button type="button" onClick={dismissError} aria-label="Dismiss" className="text-stone-500 hover:text-stone-900 dark:hover:text-stone-100">
        <Icon name="x" />
      </button>
    </div>
  )
}
