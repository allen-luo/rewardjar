import { Link, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { CoinJar } from '../../components/ui/CoinJar'
import { StampCard } from '../../components/ui/StampCard'
import { useFamilyBundle, moneyBalance, stampProgress } from '../../hooks/useFamilyData'
import { kidTheme } from '../../lib/format'
import { CheckInActions, RewardButtons } from '../rewards/CheckInActions'

export function KidDashboard() {
  const { id } = useParams()
  const { data, isLoading } = useFamilyBundle()
  const kid = data?.kids.find((k) => k.id === id)
  if (isLoading) return <p className="font-display text-xl">Loading…</p>
  if (!kid || !data) return <p>Kid not found.</p>

  const theme = kidTheme(kid.color)
  const chores = data.chores.filter((c) => c.kid_id === kid.id && c.active)
  const balance = moneyBalance(data.ledger, kid.id)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-4xl" style={{ color: theme.bg }}>
          {kid.avatar_key} {kid.name}
        </h1>
        <div className="flex gap-3 text-sm font-bold text-ink/70">
          <Link to={`/kids/${kid.id}/edit`} className="min-h-0">
            Edit
          </Link>
          <Link to={`/kids/${kid.id}/kiosk`} className="min-h-0">
            Kid view
          </Link>
        </div>
      </div>

      <CoinJar cents={balance} />

      <div className="flex gap-2">
        <Link to={`/kids/${kid.id}/chores`} className="min-h-0 flex-1">
          <Button variant="sky" className="w-full">
            Chores
          </Button>
        </Link>
        <Link to={`/kids/${kid.id}/history`} className="min-h-0 flex-1">
          <Button variant="ghost" className="w-full">
            History
          </Button>
        </Link>
      </div>

      {chores.length === 0 && (
        <div className="rounded-3xl bg-white/90 p-5 text-center shadow-[0_8px_0_#ead9c4]">
          <p className="font-display text-2xl">No chores yet</p>
          <Link to={`/kids/${kid.id}/chores/new`}>
            <Button className="mt-3">Add a chore</Button>
          </Link>
        </div>
      )}

      {chores.map((chore) => {
        const filled = stampProgress(data.ledger, data.claims, chore.id)
        const prizeReady = chore.reward_kind === 'stamp' && filled >= chore.stamp_goal
        return (
          <section key={chore.id} className="rounded-3xl bg-white/90 p-4 shadow-[0_8px_0_#ead9c4]">
            <div className="mb-2 flex items-start justify-between gap-2">
              <h2 className="font-display text-2xl">
                {chore.icon} {chore.title}
              </h2>
              <Link to={`/kids/${kid.id}/chores/${chore.id}`} className="min-h-0 text-sm font-bold text-ink/50">
                Edit
              </Link>
            </div>
            {chore.reward_kind === 'stamp' ? (
              <StampCard filled={filled} goal={chore.stamp_goal} prize={chore.prize_label} />
            ) : (
              <p className="mb-2 font-bold text-mint">Pays {((chore.money_cents ?? 0) / 100).toFixed(2)} each time</p>
            )}
            {prizeReady && <p className="mt-2 font-display text-xl text-coral">Prize ready: {chore.prize_label ?? 'a treat'}!</p>}
            <div className="mt-3">
              <RewardButtons chore={chore} kidId={kid.id} currentStamps={filled} balance={balance} prizeReady={prizeReady} />
            </div>
            <div className="mt-2">
              <CheckInActions chore={chore} compact />
            </div>
          </section>
        )
      })}

      <Link to={`/kids/${kid.id}/chores/new`}>
        <Button variant="ghost" className="w-full">
          Add chore
        </Button>
      </Link>
    </div>
  )
}
