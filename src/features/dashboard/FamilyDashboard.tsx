import { Link } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { CoinJar } from '../../components/ui/CoinJar'
import { StampCard } from '../../components/ui/StampCard'
import { useFamilyBundle, moneyBalance, stampProgress } from '../../hooks/useFamilyData'
import { kidTheme } from '../../lib/format'
import { addDaysIso, dateStringInZone, isDueToday, isOverdue, needsCheckIn, weekdayInZone, timeStringInZone } from '../../lib/schedule'
import { CheckInActions } from '../rewards/CheckInActions'

export function FamilyDashboard() {
  const { data, isLoading, error } = useFamilyBundle()
  if (isLoading) return <p className="font-display text-xl">Loading the jar…</p>
  if (error || !data) return <p className="font-bold text-coral">Could not load family data.</p>

  const tz = data.family.timezone
  const now = new Date()
  const today = dateStringInZone(now, tz)
  const yesterday = addDaysIso(today, -1)
  const weekday = weekdayInZone(now, tz)
  const yWeekday = (weekday + 6) % 7
  const nowHm = timeStringInZone(now, tz)

  const checkIns = data.chores.filter((c) => needsCheckIn(c, today, weekday, nowHm, data.ledger, data.skips))
  const due = data.chores.filter((c) => isDueToday(c, today, weekday) && !checkIns.some((x) => x.id === c.id))
  const overdue = data.chores.filter((c) => isOverdue(c, today, yesterday, yWeekday, data.ledger, data.skips))
  const seen = new Set<string>()
  const checkInList = [...overdue, ...checkIns, ...due].filter((chore) => {
    if (seen.has(chore.id)) return false
    seen.add(chore.id)
    return true
  })

  return (
    <div className="space-y-5">
      {(checkInList.length > 0) && (
        <section className="rounded-3xl bg-coral p-4 text-white shadow-[0_8px_0_#d45538]">
          <h2 className="font-display text-2xl">Check in</h2>
          <p className="mb-3 text-sm font-bold text-white/80">Due, overdue, and reminder time.</p>
          <div className="space-y-3">
            {checkInList.map((chore) => {
              const kid = data.kids.find((k) => k.id === chore.kid_id)
              const overdueItem = overdue.some((c) => c.id === chore.id)
              return (
                <div key={chore.id} className="rounded-2xl bg-white/15 p-3">
                  <p className="font-display text-lg">
                    {chore.icon} {chore.title}
                    {overdueItem ? ' · missed' : ''}
                  </p>
                  <p className="text-sm font-bold text-white/80">{kid?.name}</p>
                  <CheckInActions chore={chore} compact />
                </div>
              )
            })}
          </div>
        </section>
      )}

      {data.kids.length === 0 && (
        <div className="rounded-3xl bg-white/90 p-6 text-center shadow-[0_8px_0_#ead9c4]">
          <p className="font-display text-3xl">Your jar is empty</p>
          <p className="mb-4 font-bold text-ink/70">Add a kid to start handing out stamps and coins.</p>
          <Link to="/kids/new">
            <Button>Add a kid</Button>
          </Link>
        </div>
      )}

      {data.kids.map((kid) => {
        const theme = kidTheme(kid.color)
        const chores = data.chores.filter((c) => c.kid_id === kid.id && c.active)
        const balance = moneyBalance(data.ledger, kid.id)
        const stampChore = chores.find((c) => c.reward_kind === 'stamp')
        return (
          <Link key={kid.id} to={`/kids/${kid.id}`} className="block min-h-0">
            <article className="rounded-3xl p-4 text-white shadow-[0_8px_0_rgba(0,0,0,0.12)]" style={{ background: theme.bg, color: theme.text }}>
              <div className="flex items-center gap-3">
                <span className="text-4xl">{kid.avatar_key}</span>
                <div>
                  <h2 className="font-display text-3xl">{kid.name}</h2>
                  <p className="font-bold opacity-80">{chores.length} chores</p>
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {stampChore && (
                  <div className="text-ink">
                    <StampCard
                      filled={stampProgress(data.ledger, data.claims, stampChore.id)}
                      goal={stampChore.stamp_goal}
                      prize={stampChore.prize_label}
                    />
                  </div>
                )}
                <div className="text-ink">
                  <CoinJar cents={balance} />
                </div>
              </div>
            </article>
          </Link>
        )
      })}

      <Link to="/kids/new">
        <Button variant="ghost" className="w-full">
          Add another kid
        </Button>
      </Link>
    </div>
  )
}
