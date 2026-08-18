import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/Button'
import { useFamilyBundle, useFamilyMutations } from '../../hooks/useFamilyData'
import { AVATARS, KID_COLORS } from '../../lib/types'

export function KidForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data } = useFamilyBundle()
  const { saveKid } = useFamilyMutations()
  const existing = data?.kids.find((k) => k.id === id)
  const [name, setName] = useState(existing?.name ?? '')
  const [color, setColor] = useState(existing?.color ?? 'coral')
  const [avatar, setAvatar] = useState(existing?.avatar_key ?? '🦊')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!existing) return
    setName(existing.name)
    setColor(existing.color)
    setAvatar(existing.avatar_key)
  }, [existing])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const kidId = await saveKid.mutateAsync({ id: existing?.id, name, color, avatar_key: avatar })
      navigate(`/kids/${kidId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save kid')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl bg-white/90 p-5 shadow-[0_8px_0_#ead9c4]">
      <h1 className="font-display text-3xl">{existing ? 'Edit kid' : 'Add a kid'}</h1>
      <label className="block font-bold">
        Name
        <input
          required
          className="mt-1 w-full rounded-2xl border-2 border-ink/10 bg-cream px-3"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <div>
        <p className="font-bold">Avatar</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              type="button"
              key={a}
              onClick={() => setAvatar(a)}
              className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${avatar === a ? 'bg-gold' : 'bg-cream'}`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="font-bold">Color</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {KID_COLORS.map((c) => (
            <button
              type="button"
              key={c.key}
              onClick={() => setColor(c.key)}
              className={`h-12 w-12 rounded-2xl ${color === c.key ? 'ring-4 ring-ink' : ''}`}
              style={{ background: c.bg }}
              aria-label={c.key}
            />
          ))}
        </div>
      </div>
      {error && <p className="font-bold text-coral">{error}</p>}
      <Button type="submit" className="w-full" disabled={saveKid.isPending}>
        Save
      </Button>
    </form>
  )
}
