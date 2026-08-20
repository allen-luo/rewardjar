import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { requestPersistentStorage, setRememberMe, shouldRememberSession } from '../../lib/authStorage'
import { isStandalone } from '../../lib/pwa'
import { isSupabaseConfigured, supabase } from '../../lib/supabase'
import type { Family, Profile } from '../../lib/types'

type AuthState = {
  ready: boolean
  session: Session | null
  profile: Profile | null
  family: Family | null
  configured: boolean
  signIn: (email: string, password: string, remember?: boolean) => Promise<string | null>
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>
  signOut: () => Promise<void>
  refreshFamily: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

async function loadProfile(userId: string): Promise<{ profile: Profile; family: Family } | null> {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (!profile) return null
  const { data: family } = await supabase.from('families').select('*').eq('id', profile.family_id).maybeSingle()
  if (!family) return null
  return { profile: profile as Profile, family: family as Family }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [family, setFamily] = useState<Family | null>(null)

  async function hydrate(next: Session | null) {
    setSession(next)
    if (!next) {
      setProfile(null)
      setFamily(null)
      setReady(true)
      return
    }
    void requestPersistentStorage()
    const loaded = await loadProfile(next.user.id)
    if (loaded) {
      setProfile(loaded.profile)
      setFamily(loaded.family)
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
      if (tz && !localStorage.getItem('rewardjar-tz-init')) {
        await supabase.from('families').update({ timezone: tz }).eq('id', loaded.family.id)
        setFamily({ ...loaded.family, timezone: tz })
        localStorage.setItem('rewardjar-tz-init', '1')
      }
    }
    setReady(true)
  }

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setReady(true)
      return
    }

    void supabase.auth.getSession().then(({ data }) => {
      void hydrate(data.session)
      void supabase.auth.startAutoRefresh()
    })

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      void hydrate(next)
    })

    const onVisible = () => {
      void supabase.auth.startAutoRefresh()
      void supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    }
    const onHidden = () => {
      void supabase.auth.stopAutoRefresh()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'visible') onVisible()
      else onHidden()
    }
    const onPageHide = () => {
      if (!shouldRememberSession()) void supabase.auth.signOut()
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', onVisible)
    window.addEventListener('pageshow', onVisible)
    window.addEventListener('pagehide', onPageHide)

    return () => {
      sub.subscription.unsubscribe()
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', onVisible)
      window.removeEventListener('pageshow', onVisible)
      window.removeEventListener('pagehide', onPageHide)
    }
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      ready,
      session,
      profile,
      family,
      configured: isSupabaseConfigured,
      signIn: async (email, password, remember = true) => {
        setRememberMe(isStandalone() || remember)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (!error) void requestPersistentStorage()
        return error?.message ?? null
      },
      signUp: async (email, password, displayName) => {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: displayName } },
        })
        return error?.message ?? null
      },
      signOut: async () => {
        await supabase.auth.signOut()
      },
      refreshFamily: async () => {
        if (!session) return
        const loaded = await loadProfile(session.user.id)
        if (loaded) {
          setProfile(loaded.profile)
          setFamily(loaded.family)
        }
      },
    }),
    [ready, session, profile, family],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
