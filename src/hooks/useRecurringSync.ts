import { useEffect } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'

/**
 * The server generates due recurring transactions when data is loaded; this
 * catches up when a tab left open overnight regains focus.
 */
export function useRecurringSync() {
  const syncRecurring = useFinanceStore((s) => s.syncRecurring)
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') syncRecurring()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [syncRecurring])
}
