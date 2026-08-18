import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

type Chore = {
  id: string
  family_id: string
  kid_id: string
  title: string
  due_date: string | null
  due_time: string | null
  repeat_kind: 'none' | 'daily' | 'weekly'
  repeat_weekdays: number[]
  reminder_enabled: boolean
  active: boolean
}

type Family = { id: string; timezone: string }
type Kid = { id: string; name: string }

function dateInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

function timeInZone(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date)
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '00'
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '00'
  return `${hour}:${minute}`
}

function weekdayInZone(date: Date, timeZone: string): number {
  const w = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(w)
}

function isScheduledOn(chore: Chore, isoDate: string, weekday: number): boolean {
  if (chore.repeat_kind === 'none') return chore.due_date === isoDate
  if (chore.due_date && isoDate < chore.due_date) return false
  if (chore.repeat_kind === 'daily') return true
  return chore.repeat_weekdays.includes(weekday)
}

function normalizeTime(value: string): string {
  return value.slice(0, 5)
}

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('CRON_SECRET')
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  if (cronSecret && token !== cronSecret && token !== serviceKey) {
    return new Response('Unauthorized', { status: 401 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabase = createClient(supabaseUrl, serviceKey)
  const vapidPublic = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
  const vapidPrivate = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''
  const vapidSubject = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:parent@example.com'
  if (!vapidPublic || !vapidPrivate) {
    return new Response('Missing VAPID keys', { status: 500 })
  }
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate)

  const now = new Date()
  const [{ data: families }, { data: chores }, { data: kids }] = await Promise.all([
    supabase.from('families').select('id, timezone'),
    supabase.from('chores').select('*').eq('active', true).eq('reminder_enabled', true),
    supabase.from('kids').select('id, name'),
  ])

  const familyById = new Map((families as Family[] | null)?.map((f) => [f.id, f]) ?? [])
  const kidById = new Map((kids as Kid[] | null)?.map((k) => [k.id, k]) ?? [])
  const dueChores = (chores as Chore[] | null) ?? []

  let sent = 0
  for (const chore of dueChores) {
    const family = familyById.get(chore.family_id)
    if (!family || !chore.due_time) continue
    const tz = family.timezone || 'UTC'
    const today = dateInZone(now, tz)
    const weekday = weekdayInZone(now, tz)
    if (!isScheduledOn(chore, today, weekday)) continue
    if (timeInZone(now, tz) < normalizeTime(chore.due_time)) continue

    const [{ data: ledger }, { data: skip }, { data: sendRow }] = await Promise.all([
      supabase
        .from('ledger_entries')
        .select('id')
        .eq('chore_id', chore.id)
        .eq('occurrence_date', today)
        .gt('delta', 0)
        .limit(1),
      supabase
        .from('chore_skips')
        .select('id')
        .eq('chore_id', chore.id)
        .eq('occurrence_date', today)
        .limit(1),
      supabase
        .from('reminder_sends')
        .select('id, snooze_until')
        .eq('chore_id', chore.id)
        .eq('occurrence_date', today)
        .maybeSingle(),
    ])
    if ((ledger && ledger.length > 0) || (skip && skip.length > 0)) continue
    if (sendRow && !sendRow.snooze_until) continue
    if (sendRow?.snooze_until && new Date(sendRow.snooze_until) > now) continue

    const { data: subs } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('family_id', chore.family_id)

    const kidName = kidById.get(chore.kid_id)?.name ?? 'your kid'
    const payload = JSON.stringify({
      title: 'RewardJar check-in',
      body: `Time to check if ${kidName} finished “${chore.title}”.`,
      url: `/check-in/${chore.id}`,
    })

    for (const sub of subs ?? []) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        )
        sent += 1
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
      }
    }

    if (sendRow) {
      await supabase
        .from('reminder_sends')
        .update({ sent_at: now.toISOString(), snooze_until: null })
        .eq('id', sendRow.id)
    } else {
      await supabase.from('reminder_sends').insert({
        family_id: chore.family_id,
        chore_id: chore.id,
        occurrence_date: today,
        sent_at: now.toISOString(),
      })
    }
  }

  return new Response(JSON.stringify({ ok: true, sent }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
