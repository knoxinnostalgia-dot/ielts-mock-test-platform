/**
 * Persistence layer.
 *
 * JSON state (session, profile, settings) lives in localStorage.
 * Audio recordings are far too large for that quota, so they go to IndexedDB
 * as blobs and the JSON state only keeps their keys.
 */

export const STORAGE_KEYS = {
  session: 'ielts.session.v1',
  profile: 'ielts.profile.v1',
  theme: 'ielts.theme.v1',
  lastResult: 'ielts.lastResult.v1',
} as const

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch (error) {
    console.warn(`[storage] failed to read "${key}"`, error)
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): boolean {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.warn(`[storage] failed to write "${key}"`, error)
    return false
  }
}

export function removeKey(key: string): void {
  try {
    window.localStorage.removeItem(key)
  } catch (error) {
    console.warn(`[storage] failed to remove "${key}"`, error)
  }
}

/* ------------------------------------------------------------------ */
/* Recording blob store (IndexedDB)                                    */
/* ------------------------------------------------------------------ */

const DB_NAME = 'ielts-recordings'
const DB_VERSION = 1
const STORE = 'clips'

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDB(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => {
        console.warn('[storage] IndexedDB unavailable', request.error)
        resolve(null)
      }
    } catch (error) {
      console.warn('[storage] IndexedDB open failed', error)
      resolve(null)
    }
  })
  return dbPromise
}

/** In-memory mirror so playback still works if IndexedDB is blocked. */
const memoryBlobs = new Map<string, Blob>()

export async function saveRecording(id: string, blob: Blob): Promise<void> {
  memoryBlobs.set(id, blob)
  const db = await openDB()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(blob, id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

export async function loadRecording(id: string): Promise<Blob | null> {
  const cached = memoryBlobs.get(id)
  if (cached) return cached
  const db = await openDB()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(id)
      request.onsuccess = () => {
        const value = request.result as Blob | undefined
        if (value) memoryBlobs.set(id, value)
        resolve(value ?? null)
      }
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function deleteRecording(id: string): Promise<void> {
  memoryBlobs.delete(id)
  const db = await openDB()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(id)
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

export async function listRecordingIds(): Promise<string[]> {
  const db = await openDB()
  if (!db) return [...memoryBlobs.keys()]
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).getAllKeys()
      request.onsuccess = () => resolve(request.result.map(String))
      request.onerror = () => resolve([])
    } catch {
      resolve([])
    }
  })
}

/** Drops blobs no longer referenced by any stored result or live session. */
export async function pruneRecordings(keepIds: Set<string>): Promise<void> {
  const ids = await listRecordingIds()
  await Promise.all(ids.filter((id) => !keepIds.has(id)).map((id) => deleteRecording(id)))
}
