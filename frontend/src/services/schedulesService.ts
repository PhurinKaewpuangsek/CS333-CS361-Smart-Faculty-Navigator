import type { RawScheduleRecord, ScheduleSlot, SchedulesDataResponse } from '../types/schedule'

export function normalizeSchedule(raw: RawScheduleRecord): ScheduleSlot {
  return {
    roomCode: raw.room_code ?? '',
    eventCode: raw.event_code ?? '',
    eventName: raw.event_name ?? '',
    dayOfWeek: raw.day_of_week ?? '',
    startTime: raw.start_time ?? '',
    endTime: raw.end_time ?? '',
    eventType: raw.event_type ?? '',
  }
}

/**
 * Base URL of the deployed API Gateway stage, from VITE_API_BASE_URL.
 *
 * `import.meta.env` is optional-chained because unit tests for this module run under
 * plain `node --test`, where Vite never injects it.
 */
const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

export const SCHEDULES_ENDPOINT = `${API_BASE_URL}/api/schedules`

export async function getSchedules(): Promise<ScheduleSlot[]> {
  const response = await fetch(SCHEDULES_ENDPOINT)

  if (!response.ok) {
    throw new Error(`Failed to fetch schedules: ${response.status} ${response.statusText}`)
  }

  const data: SchedulesDataResponse = await response.json()

  if (!data || !Array.isArray(data.records)) {
    throw new Error('Invalid schedules data format: expected "records" array')
  }

  return data.records.map(normalizeSchedule)
}
