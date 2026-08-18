import { formatCents } from '../../lib/format'

export function CoinJar({ cents }: { cents: number }) {
  const coins = Math.min(8, Math.max(0, Math.ceil(cents / 25)))
  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-[0_8px_0_#ead9c4]">
      <p className="font-display text-lg">Money jar</p>
      <p className="mt-1 font-display text-4xl text-mint">{formatCents(cents)}</p>
      <div className="mt-3 flex h-16 items-end justify-center gap-1">
        {Array.from({ length: coins }, (_, i) => (
          <div
            key={i}
            className="w-6 rounded-full bg-gold shadow-inner"
            style={{ height: `${28 + (i % 3) * 10}px` }}
          />
        ))}
        {coins === 0 && <p className="text-sm text-ink/50">Empty for now</p>}
      </div>
    </div>
  )
}
