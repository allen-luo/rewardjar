import type { Chore, ChoreSkip, LedgerEntry } from './types'

export function dateStringInZone(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function weekdayInZone(date: Date, timeZone: string): number {
  const w = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(w)
}

export function timeStringInZone(date: Date, timeZone: string): string {
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

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

export function normalizeTime(value: string | null): string | null {
  if (!value) return null
  return value.slice(0, 5)
}

export function isScheduledOn(chore: Chore, isoDate: string, weekday: number): boolean {
  if (chore.repeat_kind === 'none') {
    return Boolean(chore.due_date && chore.due_date === isoDate)
  }
  if (chore.due_date && isoDate < chore.due_date) return false
  if (chore.repeat_kind === 'daily') return true
  return chore.repeat_weekdays.includes(weekday)
}

export function hasOccurrence(chore: Chore): boolean {
  return Boolean(chore.due_date) || chore.repeat_kind !== 'none'
}

export function isDoneOn(
  choreId: string,
  isoDate: string,
  ledger: LedgerEntry[],
  skips: ChoreSkip[],
): boolean {
  const rewarded = ledger.some(
    (row) => row.chore_id === choreId && row.occurrence_date === isoDate && row.delta > 0,
  )
  const skipped = skips.some((row) => row.chore_id === choreId && row.occurrence_date === isoDate)
  return rewarded || skipped
}

export function isOverdue(
  chore: Chore,
  today: string,
  yesterday: string,
  yesterdayWeekday: number,
  ledger: LedgerEntry[],
  skips: ChoreSkip[],
): boolean {
  if (!chore.active) return false
  if (chore.repeat_kind === 'none' && chore.due_date) {
    return chore.due_date < today && !isDoneOn(chore.id, chore.due_date, ledger, skips)
  }
  if (chore.repeat_kind !== 'none' && isScheduledOn(chore, yesterday, yesterdayWeekday)) {
    return !isDoneOn(chore.id, yesterday, ledger, skips)
  }
  return false
}

export function needsCheckIn(
  chore: Chore,
  today: string,
  weekday: number,
  nowHm: string,
  ledger: LedgerEntry[],
  skips: ChoreSkip[],
): boolean {
  if (!chore.active || !chore.reminder_enabled || !hasOccurrence(chore)) return false
  if (!isScheduledOn(chore, today, weekday)) return false
  const due = normalizeTime(chore.due_time)
  if (due && nowHm < due) return false
  return !isDoneOn(chore.id, today, ledger, skips)
}

export function isDueToday(chore: Chore, today: string, weekday: number): boolean {
  return chore.active && hasOccurrence(chore) && isScheduledOn(chore, today, weekday)
}

export function occurrenceDateForAction(
  chore: Chore,
  today: string,
  weekday: number,
  yesterday: string,
  yesterdayWeekday: number,
  ledger: LedgerEntry[],
  skips: ChoreSkip[],
): string {
  if (chore.repeat_kind === 'none' && chore.due_date) return chore.due_date
  if (isScheduledOn(chore, today, weekday) && !isDoneOn(chore.id, today, ledger, skips)) return today
  if (isScheduledOn(chore, yesterday, yesterdayWeekday) && !isDoneOn(chore.id, yesterday, ledger, skips)) {
    return yesterday
  }
  return today
}

export const WEEKDAYS = [
  { value: 0, label: 'Sun' },
  { value: 1, label: 'Mon' },
  { value: 2, label: 'Tue' },
  { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' },
  { value: 5, label: 'Fri' },
  { value: 6, label: 'Sat' },
]
