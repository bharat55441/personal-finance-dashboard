import { useState, type FormEvent } from 'react'
import { GoalCard } from '../components/GoalCard'
import { PageHeader } from '../components/Layout'
import { Button, Card, EmptyState, Field, Icon, inputClass, Modal, ProgressBar } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'
import type { SavingsGoal } from '../types/Budget'
import { formatCurrency } from '../utils/formatCurrency'

export function Goals() {
  const goals = useFinanceStore((s) => s.goals)
  const currency = useFinanceStore((s) => s.currency)
  const addGoal = useFinanceStore((s) => s.addGoal)
  const updateGoal = useFinanceStore((s) => s.updateGoal)
  const contributeToGoal = useFinanceStore((s) => s.contributeToGoal)
  const deleteGoal = useFinanceStore((s) => s.deleteGoal)
  const [editing, setEditing] = useState<SavingsGoal | null>(null)
  const [creating, setCreating] = useState(false)

  const saved = goals.reduce((s, g) => s + g.saved, 0)
  const target = goals.reduce((s, g) => s + g.target, 0)

  const close = () => {
    setCreating(false)
    setEditing(null)
  }

  return (
    <>
      <PageHeader
        title="Savings goals"
        subtitle="Track progress toward the things you're saving for"
        actions={
          <Button onClick={() => setCreating(true)}>
            <Icon name="plus" /> New goal
          </Button>
        }
      />

      {goals.length ? (
        <>
          <Card className="mb-6">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">All goals</h2>
              <p className="text-sm tabular-nums">
                <span className="font-semibold">{formatCurrency(saved, currency)}</span>
                <span className="text-stone-500 dark:text-stone-400"> of {formatCurrency(target, currency)}</span>
              </p>
            </div>
            <div className="mt-3">
              <ProgressBar value={target ? saved / target : 0} label="Total savings progress" />
            </div>
          </Card>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((g) => (
              <GoalCard
                key={g.id}
                goal={g}
                currency={currency}
                onContribute={(amount) => contributeToGoal(g.id, amount)}
                onEdit={() => setEditing(g)}
                onDelete={() => confirm(`Delete "${g.name}"?`) && deleteGoal(g.id)}
              />
            ))}
          </div>
        </>
      ) : (
        <EmptyState title="No savings goals yet">Create a goal like an emergency fund or a vacation.</EmptyState>
      )}

      <Modal open={creating || editing !== null} title={editing ? 'Edit goal' : 'New savings goal'} onClose={close}>
        <GoalForm
          key={editing?.id ?? 'new'}
          initial={editing ?? undefined}
          onCancel={close}
          onSubmit={(g) => {
            if (editing) updateGoal(editing.id, g)
            else addGoal(g)
            close()
          }}
        />
      </Modal>
    </>
  )
}

function GoalForm({ initial, onSubmit, onCancel }: { initial?: SavingsGoal; onSubmit: (g: Omit<SavingsGoal, 'id'>) => void; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [target, setTarget] = useState(initial ? String(initial.target) : '')
  const [saved, setSaved] = useState(initial ? String(initial.saved) : '0')
  const [deadline, setDeadline] = useState(initial?.deadline ?? '')
  const [error, setError] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const t = Number(target)
    const s = Number(saved || 0)
    if (!name.trim()) return setError('Give the goal a name')
    if (!Number.isFinite(t) || t <= 0) return setError('Target must be greater than 0')
    if (!Number.isFinite(s) || s < 0) return setError('Saved amount can’t be negative')
    onSubmit({ name: name.trim(), target: t, saved: s, deadline: deadline || undefined })
  }

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <Field label="Name">
        {(id) => <input id={id} autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emergency fund" className={inputClass} />}
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Target amount">
          {(id) => <input id={id} type="number" min="0" value={target} onChange={(e) => setTarget(e.target.value)} className={inputClass} />}
        </Field>
        <Field label="Already saved">
          {(id) => <input id={id} type="number" min="0" value={saved} onChange={(e) => setSaved(e.target.value)} className={inputClass} />}
        </Field>
      </div>
      <Field label="Target date (optional)">
        {(id) => <input id={id} type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className={inputClass} />}
      </Field>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Save goal</Button>
      </div>
    </form>
  )
}
