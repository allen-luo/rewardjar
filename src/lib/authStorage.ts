import { isStandalone } from './pwa'

const DB_NAME = 'rewardjar'
const STORE = 'kv'
const REMEMBER_KEY = 'rewardjar-remember'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'))
  })
}

async function idbGet(key: string): Promise<string | null> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(key)
    req.onsuccess = () => resolve((req.result as string | undefined) ?? null)
    req.onerror = () => reject(req.error)
  })
}

async function idbSet(key: string, value: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).put(value, key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

async function idbRemove(key: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, 'readwrite').objectStore(STORE).delete(key)
    req.onsuccess = () => resolve()
    req.onerror = () => reject(req.error)
  })
}

export const authStorage = {
  async getItem(key: string): Promise<string | null> {
    try {
      return await idbGet(key)
    } catch {
      return localStorage.getItem(key)
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      await idbSet(key, value)
    } catch {
      localStorage.setItem(key, value)
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      await idbRemove(key)
    } catch {
      localStorage.removeItem(key)
    }
  },
}

export function setRememberMe(remember: boolean) {
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0')
}

export function shouldRememberSession(): boolean {
  if (typeof window === 'undefined') return true
  if (isStandalone()) return true
  return localStorage.getItem(REMEMBER_KEY) !== '0'
}

export async function requestPersistentStorage() {
  try {
    await navigator.storage?.persist?.()
  } catch {
    /* persist() is optional; Chrome Android may deny */
  }
}
