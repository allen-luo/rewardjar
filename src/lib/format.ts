import { KID_COLORS } from './types'

export function formatCents(cents: number): string {
  const sign = cents < 0 ? '-' : ''
  const abs = Math.abs(cents)
  return `${sign}$${(abs / 100).toFixed(2)}`
}

export function kidTheme(colorKey: string) {
  return KID_COLORS.find((c) => c.key === colorKey) ?? KID_COLORS[0]
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
