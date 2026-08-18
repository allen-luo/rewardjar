export type RepeatKind = 'none' | 'daily' | 'weekly'
export type RewardKind = 'stamp' | 'money'

export type Family = {
  id: string
  name: string
  timezone: string
}

export type Profile = {
  id: string
  family_id: string
  display_name: string
}

export type Kid = {
  id: string
  family_id: string
  name: string
  color: string
  avatar_key: string
}

export type Chore = {
  id: string
  family_id: string
  kid_id: string
  title: string
  icon: string
  reward_kind: RewardKind
  stamp_goal: number
  prize_label: string | null
  money_cents: number
  active: boolean
  due_date: string | null
  due_time: string | null
  repeat_kind: RepeatKind
  repeat_weekdays: number[]
  reminder_enabled: boolean
}

export type LedgerEntry = {
  id: string
  family_id: string
  kid_id: string
  chore_id: string | null
  kind: RewardKind
  delta: number
  note: string | null
  occurrence_date: string | null
  created_at: string
}

export type PrizeClaim = {
  id: string
  family_id: string
  kid_id: string
  chore_id: string
  prize_label: string | null
  claimed_at: string
}

export type ChoreSkip = {
  id: string
  family_id: string
  chore_id: string
  occurrence_date: string
}

export type FamilyBundle = {
  family: Family
  kids: Kid[]
  chores: Chore[]
  ledger: LedgerEntry[]
  skips: ChoreSkip[]
  claims: PrizeClaim[]
}

export const KID_COLORS: { key: string; bg: string; text: string }[] = [
  { key: 'coral', bg: '#FF6B4A', text: '#fff' },
  { key: 'sky', bg: '#4FC3F7', text: '#073B4C' },
  { key: 'mint', bg: '#2ECC8A', text: '#073B4C' },
  { key: 'gold', bg: '#FFD54F', text: '#3D2B1F' },
  { key: 'grape', bg: '#9B59B6', text: '#fff' },
  { key: 'peach', bg: '#FF8A65', text: '#3D2B1F' },
]

export const AVATARS = ['🦊', '🐻', '🦄', '🐸', '🐼', '🦁', '🐙', '🐰', '🦖', '🐨']
export const CHORE_ICONS = ['🪥', '🛏️', '🍽️', '🧹', '📚', '🐶', '🚮', '👕', '🌱', '✏️', '🧸', '🚿', '⭐']
