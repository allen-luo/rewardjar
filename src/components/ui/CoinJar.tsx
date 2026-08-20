import { AnimatePresence, motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { formatCents, prefersReducedMotion } from '../../lib/format'
import { playCoin } from '../../lib/sounds'
import { useJarShake } from '../../hooks/useJarShake'

const MAX_COINS = 36
const COIN_CENTS = 5

const PALETTE = [
  { fill: '#C47A3A', stroke: '#8B5420', shine: '#E8B07A' },
  { fill: '#C5CDD6', stroke: '#7A8490', shine: '#F4F7FA' },
  { fill: '#FFD54F', stroke: '#C9A227', shine: '#FFF3C4' },
  { fill: '#2ECC8A', stroke: '#1EA36C', shine: '#A8F0D0' },
  { fill: '#FF8A65', stroke: '#E06A48', shine: '#FFD0C2' },
] as const

type CoinSpec = {
  id: number
  x: number
  y: number
  r: number
  rot: number
  fill: string
  stroke: string
  shine: string
}

function coinCount(cents: number): number {
  if (cents <= 0) return 0
  return Math.min(MAX_COINS, Math.ceil(cents / COIN_CENTS))
}

function layoutCoin(index: number): CoinSpec {
  const rowSizes = [6, 5, 6, 5, 6, 5, 3]
  let remaining = index
  let row = 0
  let col = index
  for (const size of rowSizes) {
    if (remaining < size) {
      col = remaining
      break
    }
    remaining -= size
    row += 1
    col = remaining
  }
  const size = rowSizes[Math.min(row, rowSizes.length - 1)]
  const r = 11 + (index % 3)
  const gap = 22
  const rowWidth = (size - 1) * gap
  const x = 80 - rowWidth / 2 + col * gap + (row % 2 === 1 ? 6 : 0)
  const y = 168 - row * 17
  const palette = PALETTE[index % PALETTE.length]
  return {
    id: index,
    x,
    y,
    r,
    rot: ((index * 23) % 50) - 25,
    ...palette,
  }
}

export function CoinJar({ cents }: { cents: number }) {
  const count = coinCount(cents)
  const coins = useMemo(() => Array.from({ length: count }, (_, i) => layoutCoin(i)), [count])
  const reduced = prefersReducedMotion()
  const [shake, setShake] = useState(0)
  const full = cents > 0 && count >= MAX_COINS

  const rattle = () => {
    if (reduced || count === 0) return
    setShake((n) => n + 1)
    void playCoin()
  }

  const { permissionPending, requestPermission } = useJarShake(rattle, !reduced)

  async function onJarActivate() {
    if (permissionPending) await requestPermission()
    rattle()
  }

  return (
    <div className="rounded-3xl bg-white/90 p-4 shadow-[0_8px_0_#ead9c4]">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-lg">Money jar</p>
          <p className="font-display text-4xl text-mint">{formatCents(cents)}</p>
        </div>
        {full && <p className="font-display text-2xl">✨</p>}
      </div>

      <button
        type="button"
        onClick={() => void onJarActivate()}
        className="relative mx-auto mt-3 block h-[200px] w-[160px] min-h-0"
        aria-label="Shake the money jar"
      >
        <JarOutline />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            clipPath: 'path("M48 42 L112 42 L120 56 L120 160 C120 176 102 184 80 184 C58 184 40 176 40 160 L40 56 Z")',
          }}
        >
          <AnimatePresence>
            {coins.map((coin, i) => {
              const jitter = shake === 0 || reduced
                ? { x: 0, y: 0, rotate: coin.rot }
                : {
                    x: ((i * 17 + shake * 13) % 17) - 8,
                    y: -(((i * 11 + shake * 7) % 14) + 4),
                    rotate: coin.rot + ((i * 29 + shake * 19) % 40) - 20,
                  }
              return (
                <motion.div
                  key={coin.id}
                  className="absolute"
                  style={{ left: coin.x - coin.r, top: coin.y - coin.r, width: coin.r * 2, height: coin.r * 2 }}
                  initial={reduced ? false : { y: -90, opacity: 0, scale: 0.6 }}
                  animate={{
                    y: jitter.y,
                    x: jitter.x,
                    rotate: jitter.rotate,
                    opacity: 1,
                    scale: 1,
                  }}
                  exit={reduced ? { opacity: 0 } : { y: -40, x: (i % 2 === 0 ? -30 : 30), opacity: 0, scale: 0.4 }}
                  transition={{ type: 'spring', stiffness: 420, damping: shake ? 12 : 18, delay: reduced ? 0 : i * 0.012 }}
                >
                  <motion.div
                    className="h-full w-full rounded-full border-2 shadow-md"
                    style={{ background: `radial-gradient(circle at 30% 30%, ${coin.shine}, ${coin.fill} 55%)`, borderColor: coin.stroke }}
                    animate={reduced || shake ? undefined : { y: [0, -1.5, 0] }}
                    transition={{ duration: 2.4 + (i % 5) * 0.15, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
        {count === 0 && (
          <p className="absolute bottom-8 left-0 right-0 text-center text-sm font-bold text-ink/50">Empty for now</p>
        )}
      </button>

      <p className="mt-2 text-center text-sm font-bold text-ink/50">
        {permissionPending ? 'Tap the jar, then shake your phone' : 'Tap or shake the jar'}
      </p>
    </div>
  )
}

function JarOutline() {
  return (
    <svg viewBox="0 0 160 200" className="absolute inset-0 h-full w-full" aria-hidden>
      <path d="M48 28h64l8 14v118c0 16-18 24-40 24s-40-8-40-24V42z" fill="#81D4FA" fillOpacity="0.35" stroke="#3D2B1F" strokeWidth="3" />
      <path d="M52 36h56" stroke="#fff" strokeOpacity="0.5" strokeWidth="4" strokeLinecap="round" />
      <rect x="42" y="10" width="76" height="20" rx="6" fill="#FF6B4A" stroke="#3D2B1F" strokeWidth="3" />
      <rect x="50" y="6" width="60" height="10" rx="4" fill="#FF8A65" stroke="#3D2B1F" strokeWidth="2" />
    </svg>
  )
}
