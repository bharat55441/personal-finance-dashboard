import { Suspense, useState } from 'react'
import { NavLink, Outlet } from 'react-router'
import { useFinanceStore } from '../store/useFinanceStore'
import { cx, Icon, type IconName } from './ui'

const NAV: { to: string; label: string; icon: IconName }[] = [
  { to: '/transactions', label: 'Transactions', icon: 'list' },
  { to: '/recurring', label: 'Recurring', icon: 'repeat' },
  { to: '/budgets', label: 'Budgets', icon: 'pie' },
  { to: '/goals', label: 'Savings Goals', icon: 'target' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen md:flex">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-stone-200 bg-white/90 px-4 py-3 backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-900/90">
        <Brand />
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <button
            type="button"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="rounded-lg p-2 hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Icon name="menu" className="size-5" />
          </button>
        </div>
      </header>

      <aside
        className={cx(
          'border-stone-200 bg-white md:sticky md:top-0 md:flex md:h-screen md:w-60 md:flex-col md:border-r dark:border-stone-800 dark:bg-stone-900',
          menuOpen ? 'block border-b' : 'hidden',
        )}
      >
        <div className="hidden px-5 py-5 md:block">
          <Brand />
        </div>
        <nav className="flex flex-col gap-1 p-3 md:flex-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800',
                )
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-stone-200 p-3 dark:border-stone-800">
          <div className="hidden md:block">
            <ThemeToggle withLabel />
          </div>
          <UserMenu />
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">
          <Suspense fallback={<p className="text-sm text-stone-500">Loading…</p>}>
            <Outlet />
          </Suspense>
        </div>
      </main>
    </div>
  )
}

function Brand() {
  return (
    <div className="flex items-center gap-2 font-semibold">
      <span className="grid size-8 place-items-center rounded-lg bg-blue-600 text-white">
        <Icon name="wallet" />
      </span>
      Finance
    </div>
  )
}

function UserMenu() {
  const user = useFinanceStore((s) => s.user)
  const logout = useFinanceStore((s) => s.logout)
  if (!user) return null
  return (
    <div className="mt-1 flex items-center gap-2 px-3 py-2">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-stone-200 text-xs font-semibold uppercase dark:bg-stone-700">
        {user.name.slice(0, 1)}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-stone-500 dark:text-stone-400">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        className="rounded-md px-2 py-1 text-xs font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
      >
        Sign out
      </button>
    </div>
  )
}

function ThemeToggle({ withLabel = false }: { withLabel?: boolean }) {
  const theme = useFinanceStore((s) => s.theme)
  const toggleTheme = useFinanceStore((s) => s.toggleTheme)
  const next = theme === 'dark' ? 'light' : 'dark'
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${next} mode`}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800"
    >
      <Icon name={theme === 'dark' ? 'sun' : 'moon'} />
      {withLabel && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
    </button>
  )
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}
