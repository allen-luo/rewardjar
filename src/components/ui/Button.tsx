import type { ButtonHTMLAttributes, ReactNode } from 'react'

const variants = {
  coral: 'bg-coral text-white shadow-[0_4px_0_#d45538]',
  mint: 'bg-mint text-ink shadow-[0_4px_0_#1ea36c]',
  gold: 'bg-gold text-ink shadow-[0_4px_0_#e0b12e]',
  sky: 'bg-sky text-ink shadow-[0_4px_0_#2ea4d4]',
  ghost: 'bg-white/80 text-ink shadow-[0_4px_0_#e7d7c1]',
  danger: 'bg-white text-coral shadow-[0_4px_0_#e7d7c1]',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  children: ReactNode
}

export function Button({ variant = 'coral', className = '', children, ...props }: Props) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 font-display text-lg font-semibold transition active:translate-y-0.5 active:shadow-none disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
