import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../auth/AuthProvider'
import { useFamilyMutations } from '../../hooks/useFamilyData'
import { canUsePush, isStandalone, subscribeToPush, unsubscribeFromPush } from '../reminders/push'
import { isMuted, setMuted } from '../../lib/sounds'

export function SettingsPage() {
  const { family, profile, session, signOut, refreshFamily } = useAuth()
  const { updateFamily } = useFamilyMutations()
  const [name, setName] = useState(family?.name ?? '')
  const [timezone, setTimezone] = useState(family?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
  const [pushMsg, setPushMsg] = useState<string | null>(null)
  const [installHint, setInstallHint] = useState(!isStandalone())
  const [muted, setMutedState] = useState(isMuted())
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault()
      setDeferred(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function save() {
    await updateFamily.mutateAsync({ name, timezone })
    await refreshFamily()
  }

  async function enablePush() {
    if (!profile || !session) return
    const err = await subscribeToPush(profile.family_id, session.user.id)
    setPushMsg(err ?? 'Reminders are on for this device.')
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Settings</h1>

      {installHint && (
        <section className="rounded-3xl bg-gold p-4 shadow-[0_6px_0_#e0b12e]">
          <h2 className="font-display text-2xl">Add to Home Screen</h2>
          <p className="mb-3 font-bold text-ink/80">
            On iPhone, open Share → Add to Home Screen. Push reminders only work after RewardJar is installed.
          </p>
          {deferred && (
            <Button
              onClick={async () => {
                await deferred.prompt()
                setDeferred(null)
                setInstallHint(false)
              }}
            >
              Install app
            </Button>
          )}
        </section>
      )}

      <section className="space-y-3 rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
        <label className="block font-bold">
          Family name
          <input className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="block font-bold">
          Timezone
          <input className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
        </label>
        <Button onClick={() => void save()} disabled={updateFamily.isPending}>
          Save family
        </Button>
      </section>

      <section className="space-y-3 rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
        <h2 className="font-display text-2xl">Sounds</h2>
        <Button
          variant="ghost"
          onClick={() => {
            setMuted(!muted)
            setMutedState(!muted)
          }}
        >
          {muted ? 'Sounds are off' : 'Sounds are on'}
        </Button>
      </section>

      <section className="space-y-3 rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
        <h2 className="font-display text-2xl">Check-in notifications</h2>
        {!canUsePush() && <p className="font-bold text-ink/70">This browser does not support web push.</p>}
        {canUsePush() && !isStandalone() && (
          <p className="font-bold text-ink/70">Install the app first on iOS, then enable notifications.</p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void enablePush()}>Enable push</Button>
          <Button variant="ghost" onClick={() => void unsubscribeFromPush()}>
            Disable
          </Button>
        </div>
        {pushMsg && <p className="font-bold">{pushMsg}</p>}
      </section>

      <Button variant="danger" className="w-full" onClick={() => void signOut()}>
        Sign out
      </Button>
    </div>
  )
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
}
