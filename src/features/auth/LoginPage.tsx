import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { isStandalone } from '../../lib/pwa'
import { useAuth } from './AuthProvider'

export function LoginPage() {
  const { configured, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'in' | 'up'>('in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const standalone = typeof window !== 'undefined' && isStandalone()

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setNotice(null)
    setBusy(true)
    const message =
      mode === 'in' ? await signIn(email, password, remember) : await signUp(email, password, name || 'Parent')
    setBusy(false)
    if (message) setError(message)
    else if (mode === 'up') setNotice('Check your email if confirmation is required, then sign in.')
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <img src="/pwa-192.png" alt="" className="mx-auto mb-4 h-24 w-24 rounded-3xl shadow-lg" />
      <h1 className="text-center font-display text-5xl text-coral">RewardJar</h1>
      <p className="mb-8 text-center font-bold text-ink/70">Stamps, coins, and high-fives.</p>

      {!configured && (
        <div className="mb-4 rounded-2xl bg-gold/80 p-4 text-sm font-bold">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to <code>.env</code> to
          connect your family jar.
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-2">
        <Button variant={mode === 'in' ? 'coral' : 'ghost'} onClick={() => setMode('in')}>
          Sign in
        </Button>
        <Button variant={mode === 'up' ? 'coral' : 'ghost'} onClick={() => setMode('up')}>
          Sign up
        </Button>
      </div>

      <form onSubmit={onSubmit} className="space-y-3 rounded-3xl bg-white/80 p-5 shadow-[0_8px_0_#ead9c4]">
        {mode === 'up' && (
          <label className="block text-sm font-bold">
            Your name
            <input
              className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>
        )}
        <label className="block text-sm font-bold">
          Email
          <input
            type="email"
            required
            className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-bold">
          Password
          <input
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {mode === 'in' && (
          <label className="flex items-center gap-3 font-bold">
            <input
              type="checkbox"
              checked={standalone || remember}
              disabled={standalone}
              onChange={(e) => setRemember(e.target.checked)}
            />
            Stay signed in
          </label>
        )}
        {standalone && (
          <p className="text-sm font-bold text-ink/70">This home-screen app keeps you signed in on this phone. Sign in here (not only in the browser) so the session stays on this icon.</p>
        )}
        {error && <p className="text-sm font-bold text-coral">{error}</p>}
        {notice && <p className="text-sm font-bold text-mint">{notice}</p>}
        <Button type="submit" className="w-full" disabled={busy || !configured}>
          {mode === 'in' ? 'Open the jar' : 'Create family'}
        </Button>
      </form>
    </div>
  )
}
