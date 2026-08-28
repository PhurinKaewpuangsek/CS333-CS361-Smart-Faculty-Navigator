import { useEffect, useState } from 'react'
import { getRooms } from '../services/roomsService.ts'
import type { Room } from '../types/room.ts'

export interface UseRoomsResult {
  rooms: Room[]
  loading: boolean
  error: Error | null
}

export function useRooms(): UseRoomsResult {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

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
  }, [])

  return { rooms, loading, error }
}
