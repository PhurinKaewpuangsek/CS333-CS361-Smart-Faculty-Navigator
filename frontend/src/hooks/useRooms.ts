import { useCallback, useEffect, useRef, useState } from 'react'
import { getRooms } from '../services/roomsService.ts'
import type { Room } from '../types/room.ts'

export interface UseRoomsResult {
  rooms: Room[]
  loading: boolean
  error: Error | null
  /** Fetches the rooms again, e.g. from a "try again" button after an error. */
  reload: () => void
}

/**
 * Last good response, so a returning visitor gets the map instantly.
 *
 * The locations API takes one to two seconds. Room positions almost never change, so the
 * cached copy is shown straight away and quietly replaced once the fresh one arrives —
 * only a first visit (or cleared storage) waits on the network.
 */
export const ROOMS_CACHE_KEY = 'torch_rooms_cache_v1'

function readCachedRooms(): Room[] | null {
  try {
    const raw = globalThis.localStorage?.getItem(ROOMS_CACHE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as Room[]) : null
  } catch {
    return null
  }
}

function writeCachedRooms(rooms: Room[]): void {
  try {
    globalThis.localStorage?.setItem(ROOMS_CACHE_KEY, JSON.stringify(rooms))
  } catch {
    // Storage full or blocked (private mode): the app still works, just without the head start.
  }
}

export function useRooms(): UseRoomsResult {
  const [cached] = useState<Room[] | null>(readCachedRooms)
  const [rooms, setRooms] = useState<Room[]>(cached ?? [])
  const [loading, setLoading] = useState<boolean>(cached === null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)
  const hasRoomsRef = useRef(cached !== null)

  useEffect(() => {
    let isMounted = true

    getRooms()
      .then((data) => {
        writeCachedRooms(data)
        if (isMounted) {
          hasRoomsRef.current = true
          setRooms(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setLoading(false)
        // With a cached copy on screen, a failed refresh is not worth interrupting the user.
        if (!hasRoomsRef.current) setError(err instanceof Error ? err : new Error(String(err)))
      })

    return () => {
      isMounted = false
    }
  }, [attempt])

  const reload = useCallback(() => {
    setLoading(true)
    setError(null)
    setAttempt((n) => n + 1)
  }, [])

  return { rooms, loading, error, reload }
}
