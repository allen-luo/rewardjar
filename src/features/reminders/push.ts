import { supabase } from '../../lib/supabase'
import { isStandalone } from '../../lib/pwa'

export { isStandalone }

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
  return output
}

export function canUsePush(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function subscribeToPush(familyId: string, userId: string): Promise<string | null> {
  if (!canUsePush()) return 'Push is not supported in this browser.'
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'Notifications were not allowed.'
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY
  if (!key) return 'Missing VAPID public key.'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      family_id: familyId,
      user_id: userId,
      endpoint: json.endpoint,
      p256dh: json.keys?.p256dh,
      auth: json.keys?.auth,
    },
    { onConflict: 'endpoint' },
  )
  if (error) return error.message
  return null
}

export async function unsubscribeFromPush(): Promise<void> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (!sub) return
  await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  await sub.unsubscribe()
}
