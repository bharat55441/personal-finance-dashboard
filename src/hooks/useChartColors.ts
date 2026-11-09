import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../types/Transaction'
import { useFinanceStore } from '../store/useFinanceStore'

// Categorical palette, fixed slot order (validated for adjacent-pair CVD separation).
const SERIES = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
}

const CHROME = {
  light: { grid: '#e1e0d9', axis: '#c3c2b7', muted: '#898781', surface: '#fcfcfb', text: '#0b0b0b', other: '#a3a29b' },
  dark: { grid: '#2c2c2a', axis: '#383835', muted: '#898781', surface: '#1a1a19', text: '#f0efec', other: '#6b6a64' },
}

/** Chart colors for the active theme. Colors follow the category, never its rank. */
export function useChartColors() {
  const theme = useFinanceStore((s) => s.theme)
  const series = SERIES[theme]
  const chrome = CHROME[theme]

  const categoryColor = (category: string) => {
    let i = (EXPENSE_CATEGORIES as readonly string[]).indexOf(category)
    if (i === -1) i = (INCOME_CATEGORIES as readonly string[]).indexOf(category)
    return i === -1 ? chrome.other : series[i]
  }

  return { ...chrome, income: series[0], expense: series[1], net: series[2], categoryColor }
}
