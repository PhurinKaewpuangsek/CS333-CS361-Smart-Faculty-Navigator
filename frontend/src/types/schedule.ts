export interface ScheduleSlot {
  roomCode: string
  eventCode: string
  eventName: string
  dayOfWeek: string
  startTime: string
  endTime: string
  eventType: string
}

export interface RawScheduleRecord {
  room_code?: string
  schedule_slot?: string
  event_code?: string
  event_name?: string
  day_of_week?: string
  start_time?: string
  end_time?: string
  event_type?: string
  [key: string]: unknown
}

export interface SchedulesDataResponse {
  count?: number
  records: RawScheduleRecord[]
}
