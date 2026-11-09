import { formatCurrency } from '../../utils/formatCurrency'

interface Entry {
  name?: string | number
  value?: number | string | (number | string)[]
  color?: string
  payload?: { fill?: string }
}

interface Props {
  active?: boolean
  payload?: readonly Entry[]
  label?: string | number
  currency: string
  labelFormatter?: (label: string) => string
}

/** Shared tooltip: label in primary ink, a color swatch carries series identity, values in text tokens. */
export function ChartTooltip({ active, payload, label, currency, labelFormatter }: Props) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-36 rounded-lg border border-stone-200 bg-white/95 px-3 py-2 text-sm shadow-lg backdrop-blur dark:border-stone-700 dark:bg-stone-900/95">
      {label !== undefined && label !== '' && (
        <p className="mb-1 font-medium">{labelFormatter ? labelFormatter(String(label)) : label}</p>
      )}
      <ul className="space-y-0.5">
        {payload.map((p) => (
          <li key={String(p.name)} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-2 text-stone-600 dark:text-stone-300">
              <span className="size-2.5 rounded-sm" style={{ background: p.color ?? p.payload?.fill }} />
              {p.name}
            </span>
            <span className="font-medium tabular-nums">{formatCurrency(Number(p.value), currency)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
