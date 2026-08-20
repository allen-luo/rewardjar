import { createClient } from '@supabase/supabase-js'
import { authStorage } from './authStorage'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))

export const supabase = createClient(url || 'https://example.supabase.co', anon || 'public-anon-key', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: authStorage,
    storageKey: 'rewardjar-auth',
  },
})
