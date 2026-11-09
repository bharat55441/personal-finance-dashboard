import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'
import { formatCurrency } from '../../utils/formatCurrency'
import { ChartTooltip } from './ChartTooltip'

interface Props {
  data: { category: string; value: number }[]
  currency: string
}

/** Donut + a legend table that doubles as the accessible data view. */
export function CategoryPieChart({ data, currency }: Props) {
  const c = useChartColors()
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="category"
              innerRadius="62%"
              outerRadius="92%"
              stroke={c.surface}
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.category} fill={c.categoryColor(d.category)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltip currency={currency} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-xs text-stone-500 dark:text-stone-400">Total</p>
            <p className="text-lg font-semibold tabular-nums">{formatCurrency(total, currency, total >= 100000)}</p>
          </div>
        </div>
      </div>

      <table className="w-full text-sm">
        <caption className="sr-only">Spending by category</caption>
        <tbody>
          {data.map((d) => (
            <tr key={d.category} className="border-b border-stone-100 last:border-0 dark:border-stone-800">
              {/* w-full + max-w-0 lets the name column absorb the squeeze and truncate. */}
              <th scope="row" className="w-full max-w-0 py-1.5 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span className="size-2.5 shrink-0 rounded-sm" style={{ background: c.categoryColor(d.category) }} />
                  <span className="truncate">{d.category}</span>
                </span>
              </th>
              <td className="whitespace-nowrap py-1.5 pl-3 text-right tabular-nums">{formatCurrency(d.value, currency)}</td>
              <td className="whitespace-nowrap py-1.5 pl-3 text-right text-stone-500 tabular-nums dark:text-stone-400">
                {Math.round((d.value / total) * 100)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
