export const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'CAD', 'AUD'] as const

const formatters = new Map<string, Intl.NumberFormat>()

export function formatCurrency(amount: number, currency = 'USD', compact = false): string {
  const key = `${currency}:${compact}`
  let fmt = formatters.get(key)
  if (!fmt) {
    fmt = new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 2,
    })
    formatters.set(key, fmt)
  }
  return fmt.format(amount)
}
