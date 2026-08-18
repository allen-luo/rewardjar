import { formatCents } from './format'
import type { Chore, ChoreSkip, LedgerEntry, PrizeClaim, RewardKind } from './types'

export type HistoryFilter = 'all' | 'stamp' | 'money' | 'finished'

export type HistoryEvent =
  | {
      type: 'reward'
      id: string
      at: string
      kidId: string
      kind: RewardKind
      delta: number
      label: string
      detail: string
    }
  | {
      type: 'completion'
      id: string
      at: string
      kidId: string
      choreId: string
      kind: RewardKind
      occurrenceDate: string
      label: string
      detail: string
    }
  | {
      type: 'prize'
      id: string
      at: string
      kidId: string
      choreId: string
      label: string
      detail: string
    }
  | {
      type: 'skip'
      id: string
      at: string
      kidId: string
      choreId: string
      occurrenceDate: string
      label: string
      detail: string
    }

function rewardDetail(kind: RewardKind, delta: number): string {
  if (kind === 'money') return formatCents(Math.abs(delta))
  return `${Math.abs(delta)} stamp${Math.abs(delta) === 1 ? '' : 's'}`
}

export function buildHistoryEvents(
  kidId: string,
  chores: Chore[],
  ledger: LedgerEntry[],
  claims: PrizeClaim[],
  skips: ChoreSkip[],
): HistoryEvent[] {
  const choreById = new Map(chores.map((c) => [c.id, c]))
  const events: HistoryEvent[] = []

  for (const row of ledger.filter((r) => r.kid_id === kidId)) {
    const chore = row.chore_id ? choreById.get(row.chore_id) : undefined
    const title = chore?.title ?? row.note ?? 'Manual adjustment'
    const isCompletion = Boolean(row.occurrence_date && row.delta > 0 && row.chore_id)

    if (isCompletion) {
      events.push({
        type: 'completion',
        id: `completion-${row.id}`,
        at: row.created_at,
        kidId: row.kid_id,
        choreId: row.chore_id!,
        kind: row.kind,
        occurrenceDate: row.occurrence_date!,
        label: `${chore?.icon ?? '✅'} Finished ${title}`,
        detail: `Earned ${rewardDetail(row.kind, row.delta)} · ${row.occurrence_date}`,
      })
    }

    events.push({
      type: 'reward',
      id: `reward-${row.id}`,
      at: row.created_at,
      kidId: row.kid_id,
      kind: row.kind,
      delta: row.delta,
      label: title,
      detail: row.note ?? (row.delta > 0 ? 'Reward added' : 'Reward removed'),
    })
  }

  for (const claim of claims.filter((c) => c.kid_id === kidId)) {
    const chore = choreById.get(claim.chore_id)
    events.push({
      type: 'prize',
      id: `prize-${claim.id}`,
      at: claim.claimed_at,
      kidId: claim.kid_id,
      choreId: claim.chore_id,
      label: `${chore?.icon ?? '🏆'} Stamp card complete`,
      detail: claim.prize_label ? `Prize: ${claim.prize_label}` : chore?.title ?? 'Prize given',
    })
  }

  for (const skip of skips) {
    const chore = choreById.get(skip.chore_id)
    if (!chore || chore.kid_id !== kidId) continue
    events.push({
      type: 'skip',
      id: `skip-${skip.id}`,
      at: skip.created_at ?? `${skip.occurrence_date}T12:00:00.000Z`,
      kidId: chore.kid_id,
      choreId: skip.chore_id,
      occurrenceDate: skip.occurrence_date,
      label: `${chore.icon} Skipped ${chore.title}`,
      detail: skip.occurrence_date,
    })
  }

  return events.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function filterHistoryEvents(events: HistoryEvent[], filter: HistoryFilter): HistoryEvent[] {
  if (filter === 'all') return events
  if (filter === 'finished') {
    return events.filter((e) => e.type === 'completion' || e.type === 'prize' || e.type === 'skip')
  }
  return events.filter((e) => {
    if (e.type === 'reward' || e.type === 'completion') return e.kind === filter
    if (e.type === 'prize') return filter === 'stamp'
    return false
  })
}

export function historyBadge(event: HistoryEvent): { text: string; className: string } {
  switch (event.type) {
    case 'completion':
      return { text: 'finished', className: 'bg-sky/40' }
    case 'prize':
      return { text: 'prize', className: 'bg-gold/60' }
    case 'skip':
      return { text: 'skipped', className: 'bg-ink/10' }
    case 'reward':
      return event.delta > 0
        ? { text: 'added', className: 'bg-mint/40' }
        : { text: 'removed', className: 'bg-coral/20' }
  }
}

export function historyHeadline(event: HistoryEvent): string {
  if (event.type === 'reward') {
    const sign = event.delta > 0 ? '+' : '−'
    const amount = event.kind === 'money' ? formatCents(Math.abs(event.delta)) : `${Math.abs(event.delta)} stamp`
    return `${sign} ${amount}`
  }
  return event.label
}
