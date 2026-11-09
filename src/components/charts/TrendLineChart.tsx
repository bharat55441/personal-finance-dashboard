import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'
import { formatCurrency } from '../../utils/formatCurrency'
import { monthLabel, type MonthTotals } from '../../utils/finance'
import { ChartTooltip } from './ChartTooltip'

export function TrendLineChart({ data, currency }: { data: MonthTotals[]; currency: string }) {
  const c = useChartColors()
  const dot = (color: string) => ({ r: 5, fill: color, stroke: c.surface, strokeWidth: 2 })

  return (
    <div className="h-72" role="img" aria-label="Income and spending trend line chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => monthLabel(m, data.length > 6 ? 'MMM' : 'MMM yy')}
            tick={{ fill: c.muted, fontSize: 12 }}
            axisLine={{ stroke: c.axis }}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v, currency, true)}
            tick={{ fill: c.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ stroke: c.axis, strokeWidth: 1 }}
            content={<ChartTooltip currency={currency} labelFormatter={(m) => monthLabel(m)} />}
          />
          <Legend iconType="plainline" iconSize={14} wrapperStyle={{ fontSize: 13, color: c.muted }} />
          <Line type="monotone" dataKey="income" name="Income" stroke={c.income} strokeWidth={2} dot={false} activeDot={dot(c.income)} />
          <Line type="monotone" dataKey="expense" name="Spending" stroke={c.expense} strokeWidth={2} dot={false} activeDot={dot(c.expense)} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
