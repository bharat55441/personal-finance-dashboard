import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { useChartColors } from '../../hooks/useChartColors'
import { formatCurrency } from '../../utils/formatCurrency'
import { monthLabel, type MonthTotals } from '../../utils/finance'
import { ChartTooltip } from './ChartTooltip'

export function IncomeExpenseChart({ data, currency }: { data: MonthTotals[]; currency: string }) {
  const c = useChartColors()
  return (
    <div className="h-72" role="img" aria-label="Monthly income versus expenses bar chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barGap={2} barCategoryGap="28%" margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis
            dataKey="month"
            tickFormatter={(m: string) => monthLabel(m, 'MMM')}
            tick={{ fill: c.muted, fontSize: 12 }}
            axisLine={{ stroke: c.axis }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(v: number) => formatCurrency(v, currency, true)}
            tick={{ fill: c.muted, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={64}
          />
          <Tooltip
            cursor={{ fill: c.grid, opacity: 0.5 }}
            content={<ChartTooltip currency={currency} labelFormatter={(m) => monthLabel(m)} />}
          />
          <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 13, color: c.muted }} />
          <Bar dataKey="income" name="Income" fill={c.income} radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expenses" fill={c.expense} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
