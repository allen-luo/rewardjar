import { useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useFamilyBundle } from '../../hooks/useFamilyData'
import { formatCents } from '../../lib/format'

export function HistoryPage() {
  const { id } = useParams()
  const { data } = useFamilyBundle()
  const [kind, setKind] = useState<'all' | 'stamp' | 'money'>('all')
  const rows = useMemo(() => {
    return (data?.ledger ?? [])
      .filter((row) => row.kid_id === id)
      .filter((row) => (kind === 'all' ? true : row.kind === kind))
  }, [data, id, kind])

  return (
    <div className="space-y-3">
      <h1 className="font-display text-3xl">History</h1>
      <div className="flex gap-2">
        {(['all', 'stamp', 'money'] as const).map((k) => (
          <Button key={k} variant={kind === k ? 'coral' : 'ghost'} onClick={() => setKind(k)} className="flex-1 capitalize">
            {k}
          </Button>
        ))}
      </div>
      {rows.length === 0 && <p className="font-bold text-ink/60">No awards yet.</p>}
      {rows.map((row) => {
        const chore = data?.chores.find((c) => c.id === row.chore_id)
        const added = row.delta > 0
        return (
          <article key={row.id} className="rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
            <div className="flex items-center justify-between gap-2">
              <p className="font-display text-xl">
                {added ? '+' : '−'} {row.kind === 'money' ? formatCents(Math.abs(row.delta)) : `${Math.abs(row.delta)} stamp`}
              </p>
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${added ? 'bg-mint/40' : 'bg-coral/20'}`}>
                {added ? 'added' : 'removed'}
              </span>
            </div>
            <p className="font-bold text-ink/70">{row.note || chore?.title || 'Manual'}</p>
            <p className="text-sm text-ink/50">{new Date(row.created_at).toLocaleString()}</p>
          </article>
        )
      })}
    </div>
  )
}
