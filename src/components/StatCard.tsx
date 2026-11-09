import type { ReactNode } from 'react'
import { Card, cx } from './ui'

export function StatCard({ label, value, hint, tone }: { label: string; value: string; hint?: ReactNode; tone?: 'positive' | 'negative' }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-stone-500 dark:text-stone-400">{label}</p>
      <p
        className={cx(
          'mt-1 text-2xl font-semibold tracking-tight tabular-nums',
          tone === 'negative' && 'text-[#d03b3b] dark:text-[#e66767]',
        )}
      >
        {value}
      </p>
      {hint && <div className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</div>}
    </Card>
  )
}
