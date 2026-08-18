import { NavLink, Outlet, useNavigate, useParams } from 'react-router-dom'
import { Bell, Home, Settings, Volume2, VolumeX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../features/auth/AuthProvider'
import { isMuted, setMuted } from '../lib/sounds'
import { kidTheme } from '../lib/format'
import { useFamilyBundle } from '../hooks/useFamilyData'

export function AppLayout() {
  const { family } = useAuth()
  const { data } = useFamilyBundle()
  const { id } = useParams()
  const navigate = useNavigate()
  const [muted, setMutedState] = useState(isMuted())

  useEffect(() => {
    const onMute = () => setMutedState(isMuted())
    window.addEventListener('rewardjar-mute', onMute)
    return () => window.removeEventListener('rewardjar-mute', onMute)
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pb-24 pt-4">
      <header className="mb-4 flex items-center gap-3">
        <NavLink to="/" className="flex min-h-0 items-center gap-2">
          <img src="/pwa-192.png" alt="" className="h-12 w-12 rounded-2xl shadow-md" />
          <div>
            <p className="font-display text-2xl leading-none text-coral">RewardJar</p>
            <p className="text-xs font-bold text-ink/60">{family?.name ?? 'Family jar'}</p>
          </div>
        </NavLink>
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-[0_3px_0_#ead9c4]"
            onClick={() => {
              setMuted(!muted)
              setMutedState(!muted)
            }}
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
          <NavLink to="/settings" className="grid h-12 w-12 place-items-center rounded-2xl bg-white/80 shadow-[0_3px_0_#ead9c4]">
            <Settings size={20} />
          </NavLink>
        </div>
      </header>

      {data && data.kids.length > 0 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
          {data.kids.map((kid) => {
            const theme = kidTheme(kid.color)
            const active = id === kid.id
            return (
              <button
                key={kid.id}
                type="button"
                onClick={() => navigate(`/kids/${kid.id}`)}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 font-display text-base ${
                  active ? 'ring-4 ring-white' : 'opacity-80'
                }`}
                style={{ background: theme.bg, color: theme.text }}
              >
                <span>{kid.avatar_key}</span>
                {kid.name}
              </button>
            )
          })}
        </div>
      )}

      <Outlet />

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-ink/10 bg-cream/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-lg justify-around">
          <NavLink to="/" className="flex flex-col items-center text-sm font-bold">
            <Home size={22} />
            Home
          </NavLink>
          {id && (
            <NavLink to={`/kids/${id}/history`} className="flex flex-col items-center text-sm font-bold">
              <Bell size={22} />
              History
            </NavLink>
          )}
          <NavLink to="/settings" className="flex flex-col items-center text-sm font-bold">
            <Settings size={22} />
            Settings
          </NavLink>
        </div>
      </nav>
    </div>
  )
}
