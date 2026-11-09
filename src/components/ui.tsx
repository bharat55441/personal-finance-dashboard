import { useEffect, useId, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cx(
        'rounded-xl border border-stone-200 bg-white p-5 shadow-xs dark:border-stone-800 dark:bg-stone-900',
        className,
      )}
    >
      {children}
    </section>
  )
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-600/50',
  secondary:
    'border border-stone-300 bg-white hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:hover:bg-stone-800',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  ghost: 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      className={cx(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed',
        size === 'sm' ? 'px-2.5 py-1 text-sm' : 'px-4 py-2 text-sm',
        variants[variant],
        className,
      )}
      {...props}
    />
  )
}

/** Input styling without a width, for controls that size to content. */
export const inputBase =
  'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 dark:border-stone-700 dark:bg-stone-950 dark:text-stone-100'
export const inputClass = `w-full ${inputBase}`

export function Field({
  label,
  error,
  children,
  className,
}: {
  label: string
  error?: string
  children: (id: string) => ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-700 dark:text-stone-300">
        {label}
      </label>
      {children(id)}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-stone-200 bg-white p-0 text-stone-900 shadow-xl backdrop:bg-black/40 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100"
    >
      {open && (
        <div className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-md p-1 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              <Icon name="x" />
            </button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  )
}

export type Status = 'good' | 'warning' | 'critical'
const statusStyle: Record<Status, { bar: string; text: string; icon: IconName; label: string }> = {
  good: { bar: 'bg-[#0ca30c]', text: 'text-[#006300] dark:text-[#0ca30c]', icon: 'check', label: 'On track' },
  warning: { bar: 'bg-[#fab219]', text: 'text-amber-700 dark:text-[#fab219]', icon: 'alert', label: 'Nearly there' },
  critical: { bar: 'bg-[#d03b3b]', text: 'text-[#d03b3b] dark:text-[#e66767]', icon: 'alert', label: 'Over budget' },
}

export function ProgressBar({ value, status, label }: { value: number; status?: Status; label: string }) {
  const pct = Math.max(0, Math.min(100, value * 100))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="h-2 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-800"
    >
      <div
        className={cx('h-full rounded-full transition-[width]', status ? statusStyle[status].bar : 'bg-blue-600')}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

/** Status is always shown with icon + label, never color alone. */
export function StatusBadge({ status, label }: { status: Status; label?: string }) {
  const s = statusStyle[status]
  return (
    <span className={cx('inline-flex items-center gap-1 text-xs font-medium', s.text)}>
      <Icon name={s.icon} className="size-3.5" />
      {label ?? s.label}
    </span>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-stone-300 px-6 py-10 text-center dark:border-stone-700">
      <p className="font-medium">{title}</p>
      {children && <div className="text-sm text-stone-500 dark:text-stone-400">{children}</div>}
    </div>
  )
}

const paths = {
  dashboard: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  list: 'M4 6h16M4 12h16M4 18h10',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 013-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 01-3 3H3',
  pie: 'M21.21 15.89A10 10 0 118 2.83M22 12A10 10 0 0012 2v10z',
  target: 'M12 22a10 10 0 100-20 10 10 0 000 20zm0-4a6 6 0 100-12 6 6 0 000 12zm0-4a2 2 0 100-4 2 2 0 000 4z',
  settings:
    'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z',
  sun: 'M12 17a5 5 0 100-10 5 5 0 000 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z',
  plus: 'M12 5v14M5 12h14',
  edit: 'M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.1 2.1 0 013 3L12 15l-4 1 1-4 9.5-9.5z',
  trash: 'M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6',
  x: 'M18 6L6 18M6 6l12 12',
  check: 'M20 6L9 17l-5-5',
  alert: 'M12 9v4M12 17h.01M10.3 3.9L1.8 18a2 2 0 001.7 3h17a2 2 0 001.7-3L13.7 3.9a2 2 0 00-3.4 0z',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
  menu: 'M3 12h18M3 6h18M3 18h18',
  wallet: 'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 14h.01M2 9V6a2 2 0 012-2h14',
} as const

export type IconName = keyof typeof paths

export function Icon({ name, className = 'size-4' }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cx('shrink-0', className)}
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  )
}
