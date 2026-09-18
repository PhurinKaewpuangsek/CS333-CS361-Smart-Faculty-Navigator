import { useCallback, useEffect, useState } from 'react'
import { getSchedules } from '../services/schedulesService.ts'
import type { ScheduleSlot } from '../types/schedule.ts'

export interface UseSchedulesResult {
  schedules: ScheduleSlot[]
  loading: boolean
  error: Error | null
  /** Fetches the schedules again, e.g. from a "try again" button after an error. */
  reload: () => void
}

export function useSchedules(): UseSchedulesResult {
  const [schedules, setSchedules] = useState<ScheduleSlot[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let isMounted = true

    getSchedules()
      .then((data) => {
        if (isMounted) {
          setSchedules(data)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!isMounted) return
        setLoading(false)
        setError(err instanceof Error ? err : new Error(String(err)))
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

  return { schedules, loading, error, reload }
}
