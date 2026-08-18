const MUTE_KEY = 'rewardjar-mute'

export function isMuted(): boolean {
  return localStorage.getItem(MUTE_KEY) === '1'
}

export function setMuted(muted: boolean) {
  localStorage.setItem(MUTE_KEY, muted ? '1' : '0')
  window.dispatchEvent(new Event('rewardjar-mute'))
}

function ctx(): AudioContext | null {
  if (isMuted()) return null
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  return new AudioCtx()
}

function beep(context: AudioContext, freq: number, start: number, dur: number, type: OscillatorType, gain = 0.12) {
  const osc = context.createOscillator()
  const g = context.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, start + dur)
  osc.connect(g)
  g.connect(context.destination)
  osc.start(start)
  osc.stop(start + dur + 0.02)
}

export async function playStamp() {
  const context = ctx()
  if (!context) return
  const t = context.currentTime
  beep(context, 140, t, 0.12, 'sine', 0.2)
  beep(context, 90, t, 0.18, 'triangle', 0.15)
  const noise = context.createBufferSource()
  const buffer = context.createBuffer(1, context.sampleRate * 0.08, context.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length)
  const filter = context.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 800
  const g = context.createGain()
  g.gain.value = 0.18
  noise.buffer = buffer
  noise.connect(filter)
  filter.connect(g)
  g.connect(context.destination)
  noise.start(t)
}

export async function playWhoosh() {
  const context = ctx()
  if (!context) return
  const t = context.currentTime
  beep(context, 420, t, 0.16, 'sawtooth', 0.05)
  beep(context, 180, t + 0.05, 0.2, 'sine', 0.08)
}

export async function playCoin() {
  const context = ctx()
  if (!context) return
  const t = context.currentTime
  beep(context, 880, t, 0.08, 'square', 0.08)
  beep(context, 1320, t + 0.07, 0.12, 'square', 0.07)
  beep(context, 1760, t + 0.14, 0.1, 'triangle', 0.06)
}

export async function playCoinOut() {
  const context = ctx()
  if (!context) return
  const t = context.currentTime
  beep(context, 880, t, 0.08, 'triangle', 0.07)
  beep(context, 440, t + 0.08, 0.14, 'sine', 0.08)
}

export async function playFanfare() {
  const context = ctx()
  if (!context) return
  const t = context.currentTime
  ;[523, 659, 784, 1046].forEach((freq, i) => {
    beep(context, freq, t + i * 0.12, 0.22, 'triangle', 0.1)
  })
}
