import { useCallback, useEffect, useRef, useState } from 'react'

type DeviceMotionWithPermission = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>
}

function needsMotionPermission(): boolean {
  return typeof DeviceMotionEvent !== 'undefined' && typeof (DeviceMotionEvent as DeviceMotionWithPermission).requestPermission === 'function'
}

export function useJarShake(onShake: () => void, enabled: boolean) {
  const [permissionPending, setPermissionPending] = useState(needsMotionPermission)
  const lastShake = useRef(0)
  const onShakeRef = useRef(onShake)
  onShakeRef.current = onShake

  useEffect(() => {
    if (!enabled || permissionPending) return

    const onMotion = (event: DeviceMotionEvent) => {
      const a = event.accelerationIncludingGravity
      if (!a) return
      const mag = Math.hypot(a.x ?? 0, a.y ?? 0, a.z ?? 0)
      if (mag < 15) return
      const now = Date.now()
      if (now - lastShake.current < 600) return
      lastShake.current = now
      onShakeRef.current()
    }

    window.addEventListener('devicemotion', onMotion)
    return () => window.removeEventListener('devicemotion', onMotion)
  }, [enabled, permissionPending])

  const requestPermission = useCallback(async () => {
    const DME = DeviceMotionEvent as DeviceMotionWithPermission
    if (typeof DME.requestPermission === 'function') {
      try {
        const result = await DME.requestPermission()
        setPermissionPending(result !== 'granted')
      } catch {
        setPermissionPending(true)
      }
    } else {
      setPermissionPending(false)
    }
  }, [])

  return { permissionPending, requestPermission }
}
