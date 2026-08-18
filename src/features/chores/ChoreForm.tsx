import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useFamilyBundle, useFamilyMutations } from '../../hooks/useFamilyData'
import { WEEKDAYS } from '../../lib/schedule'
import { CHORE_ICONS, type RepeatKind, type RewardKind } from '../../lib/types'

export function ChoresPage() {
  const { id } = useParams()
  const { data } = useFamilyBundle()
  const chores = data?.chores.filter((c) => c.kid_id === id) ?? []
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl">Chores</h1>
        <Link to={`/kids/${id}/chores/new`}>
          <Button>Add</Button>
        </Link>
      </div>
      {chores.map((chore) => (
        <Link key={chore.id} to={`/kids/${id}/chores/${chore.id}`} className="block min-h-0 rounded-3xl bg-white/90 p-4 shadow-[0_6px_0_#ead9c4]">
          <p className="font-display text-xl">
            {chore.icon} {chore.title}
          </p>
          <p className="text-sm font-bold text-ink/60">
            {chore.reward_kind === 'stamp' ? `${chore.stamp_goal} stamps → ${chore.prize_label ?? 'prize'}` : `$${(chore.money_cents / 100).toFixed(2)}`}
            {chore.repeat_kind !== 'none' ? ` · ${chore.repeat_kind}` : chore.due_date ? ` · due ${chore.due_date}` : ''}
            {!chore.active ? ' · paused' : ''}
          </p>
        </Link>
      ))}
    </div>
  )
}

export function ChoreForm() {
  const { id, choreId } = useParams()
  const navigate = useNavigate()
  const { data } = useFamilyBundle()
  const { saveChore } = useFamilyMutations()
  const existing = data?.chores.find((c) => c.id === choreId)

  const [title, setTitle] = useState('')
  const [icon, setIcon] = useState('⭐')
  const [rewardKind, setRewardKind] = useState<RewardKind>('stamp')
  const [stampGoal, setStampGoal] = useState(7)
  const [prizeLabel, setPrizeLabel] = useState('')
  const [money, setMoney] = useState('0.01')
  const [dueDate, setDueDate] = useState('')
  const [dueTime, setDueTime] = useState('')
  const [repeatKind, setRepeatKind] = useState<RepeatKind>('none')
  const [weekdays, setWeekdays] = useState<number[]>([1, 2, 3, 4, 5])
  const [reminder, setReminder] = useState(false)
  const [active, setActive] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!existing) return
    setTitle(existing.title)
    setIcon(existing.icon)
    setRewardKind(existing.reward_kind)
    setStampGoal(existing.stamp_goal)
    setPrizeLabel(existing.prize_label ?? '')
    setMoney((existing.money_cents / 100).toFixed(2))
    setDueDate(existing.due_date ?? '')
    setDueTime(existing.due_time?.slice(0, 5) ?? '')
    setRepeatKind(existing.repeat_kind)
    setWeekdays(existing.repeat_weekdays ?? [])
    setReminder(existing.reminder_enabled)
    setActive(existing.active)
  }, [existing])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!id) return
    const moneyCents = Math.round(Number(money) * 100)
    if (rewardKind === 'money' && (!Number.isFinite(moneyCents) || moneyCents < 0)) {
      setError('Enter a valid dollar amount')
      return
    }
    try {
      await saveChore.mutateAsync({
        id: existing?.id,
        kid_id: id,
        title,
        icon,
        reward_kind: rewardKind,
        stamp_goal: stampGoal,
        prize_label: prizeLabel || null,
        money_cents: moneyCents,
        due_date: dueDate || null,
        due_time: dueTime || null,
        repeat_kind: repeatKind,
        repeat_weekdays: repeatKind === 'weekly' ? weekdays : [],
        reminder_enabled: reminder && Boolean(dueTime),
        active,
      })
      navigate(`/kids/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save chore')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white/90 p-5 shadow-[0_8px_0_#ead9c4]">
      <h1 className="font-display text-3xl">{existing ? 'Edit chore' : 'New chore'}</h1>
      <label className="block font-bold">
        Title
        <input required className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={title} onChange={(e) => setTitle(e.target.value)} />
      </label>
      <div>
        <p className="font-bold">Icon</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {CHORE_ICONS.map((item) => (
            <button type="button" key={item} className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${icon === item ? 'bg-gold' : 'bg-cream'}`} onClick={() => setIcon(item)}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button type="button" variant={rewardKind === 'stamp' ? 'gold' : 'ghost'} onClick={() => setRewardKind('stamp')}>
          Stamps
        </Button>
        <Button type="button" variant={rewardKind === 'money' ? 'mint' : 'ghost'} onClick={() => setRewardKind('money')}>
          Money
        </Button>
      </div>
      {rewardKind === 'stamp' ? (
        <>
          <label className="block font-bold">
            Stamps for a prize
            <input type="number" min={1} className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={stampGoal} onChange={(e) => setStampGoal(Number(e.target.value))} />
          </label>
          <label className="block font-bold">
            Prize
            <input className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={prizeLabel} onChange={(e) => setPrizeLabel(e.target.value)} placeholder="Ice cream" />
          </label>
        </>
      ) : (
        <label className="block font-bold">
          Amount each time
          <input type="number" step="0.01" min="0" className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={money} onChange={(e) => setMoney(e.target.value)} />
        </label>
      )}

      <label className="block font-bold">
        Repeat
        <select className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={repeatKind} onChange={(e) => setRepeatKind(e.target.value as RepeatKind)}>
          <option value="none">One-time / anytime</option>
          <option value="daily">Every day</option>
          <option value="weekly">Selected weekdays</option>
        </select>
      </label>
      {repeatKind === 'weekly' && (
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((day) => {
            const on = weekdays.includes(day.value)
            return (
              <button
                type="button"
                key={day.value}
                className={`rounded-full px-3 py-2 font-bold ${on ? 'bg-sky' : 'bg-cream'}`}
                onClick={() => setWeekdays(on ? weekdays.filter((d) => d !== day.value) : [...weekdays, day.value])}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      )}
      <label className="block font-bold">
        Due date {repeatKind === 'none' ? '(optional one-time)' : '(optional start date)'}
        <input type="date" className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <label className="block font-bold">
        Check-in time
        <input type="time" className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3" value={dueTime} onChange={(e) => setDueTime(e.target.value)} />
      </label>
      <label className="flex items-center gap-3 font-bold">
        <input type="checkbox" checked={reminder} onChange={(e) => setReminder(e.target.checked)} />
        Remind me to check in (needs a time)
      </label>
      <label className="flex items-center gap-3 font-bold">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active
      </label>
      {error && <p className="font-bold text-coral">{error}</p>}
      <Button type="submit" className="w-full" disabled={saveChore.isPending}>
        Save chore
      </Button>
    </form>
  )
}
