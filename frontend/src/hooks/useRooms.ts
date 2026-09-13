import { useCallback, useEffect, useState } from 'react'
import { getRooms } from '../services/roomsService.ts'
import type { Room } from '../types/room.ts'

export interface UseRoomsResult {
  rooms: Room[]
  loading: boolean
  error: Error | null
  /** Fetches the rooms again, e.g. from a "try again" button after an error. */
  reload: () => void
}

export function useRooms(): UseRoomsResult {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    getRooms()
      .then((data) => {
        if (isMounted) {
          setRooms(data)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
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
