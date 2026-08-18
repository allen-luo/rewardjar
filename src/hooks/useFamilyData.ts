import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../features/auth/AuthProvider'
import { supabase } from '../lib/supabase'
import type { Chore, ChoreSkip, FamilyBundle, Kid, LedgerEntry, PrizeClaim } from '../lib/types'

export function useFamilyBundle() {
  const { profile, family } = useAuth()
  const familyId = profile?.family_id

  return useQuery({
    queryKey: ['family-bundle', familyId],
    enabled: Boolean(familyId),
    queryFn: async (): Promise<FamilyBundle> => {
      const [kids, chores, ledger, skips, claims] = await Promise.all([
        supabase.from('kids').select('*').eq('family_id', familyId!).order('created_at'),
        supabase.from('chores').select('*').eq('family_id', familyId!).order('created_at'),
        supabase.from('ledger_entries').select('*').eq('family_id', familyId!).order('created_at', { ascending: false }),
        supabase.from('chore_skips').select('*').eq('family_id', familyId!),
        supabase.from('prize_claims').select('*').eq('family_id', familyId!).order('claimed_at', { ascending: false }),
      ])
      for (const res of [kids, chores, ledger, skips, claims]) {
        if (res.error) throw res.error
      }
      return {
        family: family!,
        kids: (kids.data ?? []) as Kid[],
        chores: (chores.data ?? []) as Chore[],
        ledger: (ledger.data ?? []) as LedgerEntry[],
        skips: (skips.data ?? []) as ChoreSkip[],
        claims: (claims.data ?? []) as PrizeClaim[],
      }
    },
  })
}

export function useFamilyMutations() {
  const { profile, session } = useAuth()
  const queryClient = useQueryClient()
  const familyId = profile?.family_id

  function invalidate() {
    return queryClient.invalidateQueries({ queryKey: ['family-bundle', familyId] })
  }

  const saveKid = useMutation({
    mutationFn: async (input: { id?: string; name: string; color: string; avatar_key: string }) => {
      if (!familyId) throw new Error('No family')
      if (input.id) {
        const { error } = await supabase
          .from('kids')
          .update({ name: input.name, color: input.color, avatar_key: input.avatar_key })
          .eq('id', input.id)
        if (error) throw error
        return input.id
      }
      const { data, error } = await supabase
        .from('kids')
        .insert({ family_id: familyId, name: input.name, color: input.color, avatar_key: input.avatar_key })
        .select('id')
        .single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: invalidate,
  })

  const saveChore = useMutation({
    mutationFn: async (input: Partial<Chore> & { kid_id: string; title: string; reward_kind: 'stamp' | 'money' }) => {
      if (!familyId) throw new Error('No family')
      const payload = {
        family_id: familyId,
        kid_id: input.kid_id,
        title: input.title,
        icon: input.icon ?? '⭐',
        reward_kind: input.reward_kind,
        stamp_goal: input.stamp_goal ?? 7,
        prize_label: input.prize_label ?? null,
        money_cents: input.money_cents ?? 0,
        active: input.active ?? true,
        due_date: input.due_date || null,
        due_time: input.due_time || null,
        repeat_kind: input.repeat_kind ?? 'none',
        repeat_weekdays: input.repeat_weekdays ?? [],
        reminder_enabled: input.reminder_enabled ?? false,
      }
      if (input.id) {
        const { error } = await supabase.from('chores').update(payload).eq('id', input.id)
        if (error) throw error
        return input.id
      }
      const { data, error } = await supabase.from('chores').insert(payload).select('id').single()
      if (error) throw error
      return data.id as string
    },
    onSuccess: invalidate,
  })

  const addLedger = useMutation({
    mutationFn: async (input: {
      kid_id: string
      chore_id?: string | null
      kind: 'stamp' | 'money'
      delta: number
      note?: string
      occurrence_date?: string | null
    }) => {
      if (!familyId) throw new Error('No family')
      const { error } = await supabase.from('ledger_entries').insert({
        family_id: familyId,
        kid_id: input.kid_id,
        chore_id: input.chore_id ?? null,
        kind: input.kind,
        delta: input.delta,
        note: input.note ?? null,
        occurrence_date: input.occurrence_date ?? null,
        created_by: session?.user.id ?? null,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const skipChore = useMutation({
    mutationFn: async (input: { chore_id: string; occurrence_date: string }) => {
      if (!familyId) throw new Error('No family')
      const { error } = await supabase.from('chore_skips').upsert({
        family_id: familyId,
        chore_id: input.chore_id,
        occurrence_date: input.occurrence_date,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const snoozeReminder = useMutation({
    mutationFn: async (input: { chore_id: string; occurrence_date: string; minutes?: number }) => {
      if (!familyId) throw new Error('No family')
      const until = new Date(Date.now() + (input.minutes ?? 30) * 60_000).toISOString()
      const { data: existing } = await supabase
        .from('reminder_sends')
        .select('id')
        .eq('chore_id', input.chore_id)
        .eq('occurrence_date', input.occurrence_date)
        .maybeSingle()
      if (existing) {
        const { error } = await supabase.from('reminder_sends').update({ snooze_until: until }).eq('id', existing.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('reminder_sends').insert({
          family_id: familyId,
          chore_id: input.chore_id,
          occurrence_date: input.occurrence_date,
          snooze_until: until,
        })
        if (error) throw error
      }
    },
    onSuccess: invalidate,
  })

  const claimPrize = useMutation({
    mutationFn: async (input: { kid_id: string; chore_id: string; prize_label: string | null }) => {
      if (!familyId) throw new Error('No family')
      const { error } = await supabase.from('prize_claims').insert({
        family_id: familyId,
        kid_id: input.kid_id,
        chore_id: input.chore_id,
        prize_label: input.prize_label,
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  const updateFamily = useMutation({
    mutationFn: async (input: { name?: string; timezone?: string }) => {
      if (!familyId) throw new Error('No family')
      const { error } = await supabase.from('families').update(input).eq('id', familyId)
      if (error) throw error
    },
    onSuccess: invalidate,
  })

  return { saveKid, saveChore, addLedger, skipChore, snoozeReminder, claimPrize, updateFamily }
}

export function moneyBalance(ledger: LedgerEntry[], kidId: string): number {
  return ledger.filter((row) => row.kid_id === kidId && row.kind === 'money').reduce((sum, row) => sum + row.delta, 0)
}

export function stampProgress(ledger: LedgerEntry[], claims: PrizeClaim[], choreId: string): number {
  const lastClaim = claims.find((c) => c.chore_id === choreId)?.claimed_at
  return ledger
    .filter((row) => row.chore_id === choreId && row.kind === 'stamp' && (!lastClaim || row.created_at > lastClaim))
    .reduce((sum, row) => sum + row.delta, 0)
}
