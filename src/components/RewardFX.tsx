import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { prefersReducedMotion } from '../lib/format'
import { playCoin, playCoinOut, playFanfare, playStamp, playWhoosh } from '../lib/sounds'

export type FxKind = 'stamp-add' | 'stamp-remove' | 'coin-add' | 'coin-remove' | 'prize'

type FxState = { id: number; kind: FxKind }

type FxApi = {
  play: (kind: FxKind) => void
}

const FxContext = createContext<FxApi | null>(null)

export function useFx() {
  const ctx = useContext(FxContext)
  if (!ctx) throw new Error('useFx must be used inside FxProvider')
  return ctx
}

export function FxProvider({ children }: { children: ReactNode }) {
  const [fx, setFx] = useState<FxState | null>(null)

  const api = useMemo<FxApi>(
    () => ({
      play: (kind) => {
        if (kind === 'stamp-add') void playStamp()
        if (kind === 'stamp-remove') void playWhoosh()
        if (kind === 'coin-add') void playCoin()
        if (kind === 'coin-remove') void playCoinOut()
        if (kind === 'prize') void playFanfare()
        if (prefersReducedMotion()) return
        setFx({ id: Date.now(), kind })
        window.setTimeout(() => setFx(null), kind === 'prize' ? 2200 : 900)
      },
    }),
    [],
  )

  return (
    <FxContext.Provider value={api}>
      {children}
      <AnimatePresence>
        {fx && (
          <motion.div
            key={fx.id}
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {fx.kind === 'stamp-add' && <StampSlam />}
            {fx.kind === 'stamp-remove' && <StampPeel />}
            {fx.kind === 'coin-add' && <CoinBurst inWard />}
            {fx.kind === 'coin-remove' && <CoinBurst inWard={false} />}
            {fx.kind === 'prize' && <PrizeBurst />}
          </motion.div>
        )}
      </AnimatePresence>
    </FxContext.Provider>
  )
}

function StampSlam() {
  return (
    <motion.div
      initial={{ scale: 2.4, rotate: -18, y: -80 }}
      animate={{ scale: 1, rotate: -6, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 18 }}
      className="flex h-36 w-36 items-center justify-center rounded-full border-4 border-coral bg-gold text-6xl shadow-2xl"
    >
      ⭐
    </motion.div>
  )
}

function StampPeel() {
  return (
    <motion.div
      initial={{ rotate: 0, y: 0, opacity: 1 }}
      animate={{ rotate: 40, y: -90, opacity: 0 }}
      className="text-7xl"
    >
      ⭐
    </motion.div>
  )
}

function CoinBurst({ inWard }: { inWard: boolean }) {
  const coins = [0, 1, 2, 3, 4, 5]
  return (
    <div className="relative h-48 w-48">
      {coins.map((i) => (
        <motion.div
          key={i}
          className="absolute left-1/2 top-1/2 text-4xl"
          initial={{ x: inWard ? (i - 2.5) * 50 : 0, y: inWard ? -80 : 0, opacity: 1, scale: 1 }}
          animate={{ x: inWard ? 0 : (i - 2.5) * 60, y: inWard ? 20 : -90, opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.7, delay: i * 0.04 }}
        >
          🪙
        </motion.div>
      ))}
    </div>
  )
}

function PrizeBurst() {
  const bits = Array.from({ length: 18 }, (_, i) => i)
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {bits.map((i) => (
        <motion.div
          key={i}
          className="absolute text-2xl"
          initial={{ x: 0, y: 0, opacity: 1 }}
          animate={{
            x: Math.cos((i / bits.length) * Math.PI * 2) * 180,
            y: Math.sin((i / bits.length) * Math.PI * 2) * 140,
            opacity: 0,
            rotate: 180,
          }}
          transition={{ duration: 1.4 }}
        >
          {i % 2 === 0 ? '🎉' : '⭐'}
        </motion.div>
      ))}
      <motion.div
        initial={{ scale: 0.4 }}
        animate={{ scale: 1 }}
        className="rounded-3xl bg-gold px-8 py-5 font-display text-4xl font-bold text-ink shadow-xl"
      >
        Prize!
      </motion.div>
    </div>
  )
}
