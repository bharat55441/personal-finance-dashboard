import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { BudgetCard } from '../components/BudgetCard'
import { CategoryPieChart } from '../components/charts/CategoryPieChart'
import { IncomeExpenseChart } from '../components/charts/IncomeExpenseChart'
import { TrendLineChart } from '../components/charts/TrendLineChart'
import { GoalCard } from '../components/GoalCard'
import { PageHeader } from '../components/Layout'
import { LocalDataBanner } from '../components/LocalDataBanner'
import { MonthSelect } from '../components/MonthSelect'
import { StatCard } from '../components/StatCard'
import { TransactionTable } from '../components/TransactionTable'
import { Card, CardHeader, cx, EmptyState } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type TransactionType } from '../types/Transaction'
import { balance, categoryBreakdown, currentMonth, monthLabel, monthlySeries, totalsForMonth } from '../utils/finance'
import { formatCurrency } from '../utils/formatCurrency'

const KNOWN = new Set<string>([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])

export function Dashboard() {
  const transactions = useFinanceStore((s) => s.transactions)
  const budgets = useFinanceStore((s) => s.budgets)
  const goals = useFinanceStore((s) => s.goals)
  const currency = useFinanceStore((s) => s.currency)

  const [month, setMonth] = useState(currentMonth())
  const [breakdownType, setBreakdownType] = useState<TransactionType>('expense')
  const [trendMonths, setTrendMonths] = useState<6 | 12>(12)

  const total = useMemo(() => balance(transactions), [transactions])
  const totals = useMemo(() => totalsForMonth(transactions, month), [transactions, month])
  const bars = useMemo(() => monthlySeries(transactions, 6, month), [transactions, month])
  const trend = useMemo(() => monthlySeries(transactions, trendMonths, month), [transactions, trendMonths, month])
  const breakdown = useMemo(() => {
    // Imported categories outside the fixed list fold into "Other" so colors stay stable.
    const other = breakdownType === 'income' ? 'Other Income' : 'Other'
    const folded = new Map<string, number>()
    for (const d of categoryBreakdown(transactions, month, breakdownType)) {
      const key = KNOWN.has(d.category) ? d.category : other
      folded.set(key, (folded.get(key) ?? 0) + d.value)
    }
    return [...folded].map(([category, value]) => ({ category, value })).sort((a, b) => b.value - a.value)
  }, [transactions, month, breakdownType])
  const recent = useMemo(
    () => [...transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6),
    [transactions],
  )
  const spentByCategory = useMemo(
    () => new Map(categoryBreakdown(transactions, month).map((d) => [d.category, d.value])),
    [transactions, month],
  )

  const savingsRate = totals.income > 0 ? Math.round((totals.net / totals.income) * 100) : null
  const overBudget = budgets.filter((b) => (spentByCategory.get(b.category) ?? 0) > b.limit)

  if (!transactions.length) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <LocalDataBanner />
        <EmptyState title="No transactions yet">
          <p>
            <Link to="/transactions" className="text-blue-600 hover:underline dark:text-blue-400">Add your first transaction</Link>,{' '}
            <Link to="/settings" className="text-blue-600 hover:underline dark:text-blue-400">import a CSV, or load sample data</Link>.
          </p>
        </EmptyState>
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Overview for ${monthLabel(month)}`}
        actions={<MonthSelect value={month} onChange={setMonth} />}
      />
      <LocalDataBanner />

      {overBudget.length > 0 && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
          <svg viewBox="0 0 24 24" className="mt-0.5 size-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path d="M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z" />
          </svg>
          <p>
            <strong>Over budget:</strong> {overBudget.map((b) => b.category).join(', ')}.{' '}
            <Link to="/budgets" className="underline">Review budgets</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total balance" value={formatCurrency(total, currency)} tone={total < 0 ? 'negative' : undefined} hint="All time" />
        <StatCard label="Income" value={formatCurrency(totals.income, currency)} hint={monthLabel(month, 'MMMM')} />
        <StatCard label="Expenses" value={formatCurrency(totals.expense, currency)} hint={monthLabel(month, 'MMMM')} />
        <StatCard
          label="Net savings"
          value={formatCurrency(totals.net, currency)}
          tone={totals.net < 0 ? 'negative' : undefined}
          hint={savingsRate !== null ? `${savingsRate}% savings rate` : 'No income this month'}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Income vs. expenses" subtitle="Last 6 months" />
          <IncomeExpenseChart data={bars} currency={currency} />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title="By category"
            subtitle={monthLabel(month)}
            action={<Segmented value={breakdownType} onChange={setBreakdownType} options={[['expense', 'Expenses'], ['income', 'Income']]} />}
          />
          {breakdown.length ? (
            <CategoryPieChart data={breakdown} currency={currency} />
          ) : (
            <EmptyState title={`No ${breakdownType === 'income' ? 'income' : 'expenses'} this month`} />
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader
          title="Spending trend"
          subtitle={`${trendMonths} months ending ${monthLabel(month)}`}
          action={<Segmented value={trendMonths} onChange={setTrendMonths} options={[[6, '6M'], [12, '12M']]} />}
        />
        <TrendLineChart data={trend} currency={currency} />
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Budgets" subtitle={monthLabel(month)} action={<Link to="/budgets" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Manage</Link>} />
          {budgets.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {budgets.slice(0, 4).map((b) => (
                <BudgetCard key={b.id} budget={b} spent={spentByCategory.get(b.category) ?? 0} currency={currency} />
              ))}
            </div>
          ) : (
            <EmptyState title="No budgets set"><Link to="/budgets" className="text-blue-600 hover:underline dark:text-blue-400">Create one</Link></EmptyState>
          )}
        </Card>
        <Card>
          <CardHeader title="Savings goals" action={<Link to="/goals" className="text-sm text-blue-600 hover:underline dark:text-blue-400">Manage</Link>} />
          {goals.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {goals.slice(0, 4).map((g) => (
                <GoalCard key={g.id} goal={g} currency={currency} />
              ))}
            </div>
          ) : (
            <EmptyState title="No savings goals"><Link to="/goals" className="text-blue-600 hover:underline dark:text-blue-400">Set a goal</Link></EmptyState>
          )}
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader title="Recent transactions" action={<Link to="/transactions" className="text-sm text-blue-600 hover:underline dark:text-blue-400">View all</Link>} />
        <TransactionTable transactions={recent} currency={currency} />
      </Card>
    </>
  )
}

function Segmented<T extends string | number>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string][] }) {
  return (
    <div className="inline-flex rounded-lg bg-stone-100 p-0.5 text-xs font-medium dark:bg-stone-800">
      {options.map(([v, label]) => (
        <button
          key={String(v)}
          type="button"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
          className={cx('rounded-md px-2.5 py-1', value === v ? 'bg-white shadow-sm dark:bg-stone-950' : 'text-stone-500 dark:text-stone-400')}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
