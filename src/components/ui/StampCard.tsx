export function StampCard({ filled, goal, prize }: { filled: number; goal: number; prize?: string | null }) {
  const slots = Math.max(goal, 1)
  const current = Math.max(0, Math.min(filled, slots))
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-[0_8px_0_#ead9c4]">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="font-display text-lg">Stamp card</p>
        <p className="text-sm font-bold text-ink/70">
          {current}/{slots}
        </p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: slots }, (_, i) => (
          <div
            key={i}
            className={`flex aspect-square items-center justify-center rounded-full border-2 text-lg ${
              i < current ? 'border-coral bg-gold' : 'border-dashed border-ink/20 bg-cream'
            }`}
          >
            {i < current ? '⭐' : ''}
          </div>
        ))}
      </div>
      {prize && <p className="mt-3 text-sm font-bold text-ink/70">Prize: {prize}</p>}
    </div>
  )
}
