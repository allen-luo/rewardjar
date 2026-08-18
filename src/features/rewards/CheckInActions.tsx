import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { moneyBalance, stampProgress, useFamilyBundle, useFamilyMutations } from '../../hooks/useFamilyData'
import { formatCents } from '../../lib/format'
import { addDaysIso, dateStringInZone, occurrenceDateForAction, weekdayInZone } from '../../lib/schedule'
import type { Chore } from '../../lib/types'
import { useFx } from '../../components/RewardFX'
import { useAuth } from '../auth/AuthProvider'

export function RewardButtons({
  chore,
  kidId,
  currentStamps,
  balance,
  prizeReady,
}: {
  chore: Chore
  kidId: string
  currentStamps: number
  balance: number
  prizeReady: boolean
}) {
  const { family } = useAuth()
  const { data } = useFamilyBundle()
  const { addLedger, claimPrize } = useFamilyMutations()
  const fx = useFx()
  const [busy, setBusy] = useState(false)
  const tz = family?.timezone ?? 'UTC'
  const today = dateStringInZone(new Date(), tz)
  const weekday = weekdayInZone(new Date(), tz)
  const yesterday = addDaysIso(today, -1)
  const occurrenceDate = occurrenceDateForAction(
    chore,
    today,
    weekday,
    yesterday,
    (weekday + 6) % 7,
    data?.ledger ?? [],
    data?.skips ?? [],
  )

  async function give() {
    setBusy(true)
    const delta = chore.reward_kind === 'stamp' ? 1 : chore.money_cents
    await addLedger.mutateAsync({
      kid_id: kidId,
      chore_id: chore.id,
      kind: chore.reward_kind,
      delta,
      occurrence_date: occurrenceDate,
      note: `Completed ${chore.title}`,
    })
    const nextStamps = currentStamps + (chore.reward_kind === 'stamp' ? 1 : 0)
    if (chore.reward_kind === 'stamp' && nextStamps >= chore.stamp_goal) fx.play('prize')
    else fx.play(chore.reward_kind === 'stamp' ? 'stamp-add' : 'coin-add')
    setBusy(false)
  }

  async function take() {
    const delta = chore.reward_kind === 'stamp' ? -1 : -chore.money_cents
    if (chore.reward_kind === 'stamp' && currentStamps <= 0) return
    if (chore.reward_kind === 'money' && balance + delta < 0) return
    if (chore.reward_kind === 'money' && chore.money_cents >= 100) {
      const ok = window.confirm(`Remove ${formatCents(chore.money_cents)}?`)
      if (!ok) return
    }
    setBusy(true)
    await addLedger.mutateAsync({
      kid_id: kidId,
      chore_id: chore.id,
      kind: chore.reward_kind,
      delta,
      note: `Removed for ${chore.title}`,
    })
    fx.play(chore.reward_kind === 'stamp' ? 'stamp-remove' : 'coin-remove')
    setBusy(false)
  }

  async function claim() {
    setBusy(true)
    await claimPrize.mutateAsync({ kid_id: kidId, chore_id: chore.id, prize_label: chore.prize_label })
    fx.play('prize')
    setBusy(false)
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => void give()} disabled={busy} variant="mint">
        {chore.reward_kind === 'stamp' ? 'Give stamp' : `Give ${formatCents(chore.money_cents)}`}
      </Button>
      <Button onClick={() => void take()} disabled={busy} variant="danger">
        {chore.reward_kind === 'stamp' ? 'Take stamp' : `Take ${formatCents(chore.money_cents)}`}
      </Button>
      {prizeReady && (
        <Button onClick={() => void claim()} disabled={busy} variant="gold">
          Prize given
        </Button>
      )}
    </div>
  )
}

export function CheckInActions({ chore, compact = false }: { chore: Chore; compact?: boolean }) {
  const { family } = useAuth()
  const { data } = useFamilyBundle()
  const { skipChore, snoozeReminder } = useFamilyMutations()
  const tz = family?.timezone ?? 'UTC'
  const today = dateStringInZone(new Date(), tz)
  const weekday = weekdayInZone(new Date(), tz)
  const yesterday = addDaysIso(today, -1)
  const occurrenceDate = occurrenceDateForAction(
    chore,
    today,
    weekday,
    yesterday,
    (weekday + 6) % 7,
    data?.ledger ?? [],
    data?.skips ?? [],
  )
  if (!chore.reminder_enabled && chore.repeat_kind === 'none' && !chore.due_date) return null

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? 'mt-2' : ''}`}>
      <Button
        variant="ghost"
        className="text-base"
        onClick={() => void skipChore.mutateAsync({ chore_id: chore.id, occurrence_date: occurrenceDate })}
      >
        Skip
      </Button>
      {chore.reminder_enabled && (
        <Button
          variant="gold"
          className="text-base"
          onClick={() => void snoozeReminder.mutateAsync({ chore_id: chore.id, occurrence_date: occurrenceDate })}
        >
          Snooze 30m
        </Button>
      )}
    </div>
  )
}

export function CheckInPage() {
  const { choreId } = useParams()
  const navigate = useNavigate()
  const { data } = useFamilyBundle()
  const chore = data?.chores.find((c) => c.id === choreId)
  const kid = data?.kids.find((k) => k.id === chore?.kid_id)
  if (!data) return <p>Loading…</p>
  if (!chore || !kid) return <p>Chore not found.</p>
  const filled = stampProgress(data.ledger, data.claims, chore.id)
  const balance = moneyBalance(data.ledger, kid.id)
  const prizeReady = chore.reward_kind === 'stamp' && filled >= chore.stamp_goal

  return (
    <div className="space-y-4">
      <h1 className="font-display text-4xl">Check in</h1>
      <p className="font-display text-2xl">
        {kid.avatar_key} {kid.name}
      </p>
      <p className="font-display text-3xl">
        {chore.icon} {chore.title}
      </p>
      <RewardButtons chore={chore} kidId={kid.id} currentStamps={filled} balance={balance} prizeReady={prizeReady} />
      <CheckInActions chore={chore} />
      <Button variant="ghost" onClick={() => navigate(`/kids/${kid.id}`)}>
        Back
      </Button>
    </div>
  )
}
