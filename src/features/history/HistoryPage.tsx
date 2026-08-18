import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useFamilyBundle } from '../../hooks/useFamilyData'
import {
  buildHistoryEvents,
  filterHistoryEvents,
  historyBadge,
  historyHeadline,
  type HistoryFilter,
} from '../../lib/history'

const FILTERS: { key: HistoryFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'finished', label: 'Finished' },
  { key: 'stamp', label: 'Stamps' },
  { key: 'money', label: 'Money' },
]

export function HistoryPage() {
  const { id } = useParams()
  const { data } = useFamilyBundle()
  const [filter, setFilter] = useState<HistoryFilter>('all')

  const rows = useMemo(() => {
    if (!data || !id) return []
    const events = buildHistoryEvents(id, data.chores, data.ledger, data.claims, data.skips)
    return filterHistoryEvents(events, filter)
  }, [data, id, filter])

  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">History</h1>
      <p className="text-sm font-bold text-ink/60">
        Rewards added or removed, chores finished, stamp cards completed, and skipped days.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {FILTERS.map(({ key, label }) => (
          <Button key={key} variant={filter === key ? 'coral' : 'ghost'} onClick={() => setFilter(key)} className="w-full">
            {label}
          </Button>
        ))}
      </div>
      {rows.length === 0 && <p className="font-bold text-ink/60">Nothing here yet.</p>}
      {rows.map((event) => {
        const badge = historyBadge(event)
        return (
          <article key={event.id} className="rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl">{historyHeadline(event)}</p>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${badge.className}`}>{badge.text}</span>
            </div>
            {event.type === 'reward' && <p className="font-bold text-ink/70">{event.label}</p>}
            <p className="text-sm text-ink/50">{event.detail}</p>
            <p className="text-sm text-ink/50">{new Date(event.at).toLocaleString()}</p>
          </article>
        )
      })}
    </div>
  )
}
