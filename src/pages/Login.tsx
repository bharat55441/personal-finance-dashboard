import { useState, type FormEvent } from 'react'
import { Button, Field, Icon, inputClass } from '../components/ui'
import { useFinanceStore } from '../store/useFinanceStore'

export function Login() {
  const login = useFinanceStore((s) => s.login)
  const register = useFinanceStore((s) => s.register)
  const sessionError = useFinanceStore((s) => s.error)
  const dismissError = useFinanceStore((s) => s.dismissError)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const isRegister = mode === 'register'

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    dismissError()
    if (isRegister && password.length < 8) return setError('Password must be at least 8 characters')
    setBusy(true)
    try {
      if (isRegister) await register(name.trim(), email.trim(), password)
      else await login(email.trim(), password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <span className="grid size-11 place-items-center rounded-xl bg-blue-600 text-white">
            <Icon name="wallet" className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">{isRegister ? 'Create your account' : 'Welcome back'}</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">Personal Finance Dashboard</p>
          </div>
        </div>

        <form
          onSubmit={submit}
          noValidate
          className="space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-xs dark:border-stone-800 dark:bg-stone-900"
        >
          {isRegister && (
            <Field label="Name">
              {(id) => <input id={id} autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />}
            </Field>
          )}
          <Field label="Email">
            {(id) => (
              <input id={id} type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            )}
          </Field>
          <Field label="Password">
            {(id) => (
              <input
                id={id}
                type="password"
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={isRegister ? 8 : undefined}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            )}
          </Field>

          {(error || sessionError) && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error || sessionError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400">
          {isRegister ? 'Already have an account?' : 'New here?'}{' '}
          <button
            type="button"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setError('')
            }}
            className="font-medium text-blue-600 hover:underline dark:text-blue-400"
          >
            {isRegister ? 'Sign in' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  )
}
