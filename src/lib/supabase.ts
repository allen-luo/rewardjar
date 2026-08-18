import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const isSupabaseConfigured = Boolean(url && anon && !url.includes('YOUR_PROJECT'))

export const supabase = createClient(url || 'https://example.supabase.co', anon || 'public-anon-key')
