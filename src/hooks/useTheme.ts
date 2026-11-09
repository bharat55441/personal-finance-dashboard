import { useEffect } from 'react'
import { useFinanceStore } from '../store/useFinanceStore'

/** Mirrors the stored theme onto <html class="dark">. */
export function useApplyTheme() {
  const theme = useFinanceStore((s) => s.theme)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    document.documentElement.style.colorScheme = theme
  }, [theme])
}
