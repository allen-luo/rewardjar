import { Link, useParams } from 'react-router-dom'
import { CoinJar } from '../../components/ui/CoinJar'
import { StampCard } from '../../components/ui/StampCard'
import { useFamilyBundle, moneyBalance, stampProgress } from '../../hooks/useFamilyData'
import { kidTheme } from '../../lib/format'

export function KidKiosk() {
  const { id } = useParams()
  const { data } = useFamilyBundle()
  const kid = data?.kids.find((k) => k.id === id)
  if (!kid || !data) return <p>Kid not found.</p>
  const theme = kidTheme(kid.color)
  const chores = data.chores.filter((c) => c.kid_id === kid.id && c.active)
  const balance = moneyBalance(data.ledger, kid.id)

  return (
    <div className="min-h-[70vh] rounded-[2rem] p-5 text-center" style={{ background: theme.bg, color: theme.text }}>
      <p className="text-7xl">{kid.avatar_key}</p>
      <h1 className="font-display text-5xl">{kid.name}</h1>
      <div className="mt-6 space-y-4 text-left text-ink">
        <CoinJar cents={balance} />
        {chores
          .filter((c) => c.reward_kind === 'stamp')
          .map((chore) => (
            <div key={chore.id}>
              <p className="mb-2 font-display text-2xl" style={{ color: theme.text }}>
                {chore.icon} {chore.title}
              </p>
              <StampCard filled={stampProgress(data.ledger, data.claims, chore.id)} goal={chore.stamp_goal} prize={chore.prize_label} />
            </div>
          ))}
      </div>
      <Link to={`/kids/${kid.id}`} className="mt-8 inline-flex min-h-0 rounded-full bg-white/90 px-5 py-3 font-display text-ink">
        Parent controls
      </Link>
    </div>
  )
}
