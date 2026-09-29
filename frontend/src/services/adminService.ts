/**
 * adminService — write-API wrappers for the admin CRUD endpoints (#81).
 *
 * All functions throw on non-2xx responses so callers can handle errors uniformly.
 * `import.meta.env` is optional-chained so this module can be imported in plain
 * Node test environments (node:test / vitest) without Vite injecting globals.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UpdateRoomPayload {
  /** Display name stored as name_th in DynamoDB */
  name_th: string
  capacity?: number
}

export interface CreateSchedulePayload {
  room_code: string
  day_of_week: string
  start_time: string
  event_code: string
  end_time?: string
  event_name?: string
  event_type?: string
}

export interface UpdateSchedulePayload {
  day_of_week?: string
  start_time?: string
  event_code?: string
  end_time?: string
  event_name?: string
  event_type?: string
}

export interface CreateScheduleResult {
  message: string
  schedule_slot: string
}

// ---------------------------------------------------------------------------
// Locations
// ---------------------------------------------------------------------------

/**
 * PUT /api/locations/{location_id}
 * Editable fields: name_th, capacity. (name and nameThai are sync-written by
 * the existing update-location handler.)
 */
export async function updateRoom(
  locationId: string,
  payload: UpdateRoomPayload,
): Promise<void> {
  const url = `${API_BASE_URL}/api/locations/${encodeURIComponent(locationId)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: payload.name_th,
      name_th: payload.name_th,
      nameThai: payload.name_th,
      ...(payload.capacity !== undefined ? { capacity: payload.capacity } : {}),
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string; message?: string }).error ?? `PUT /api/locations failed (${res.status})`)
  }
}

/**
 * DELETE /api/locations/{location_id}
 */
export async function deleteRoom(locationId: string): Promise<void> {
  const url = `${API_BASE_URL}/api/locations/${encodeURIComponent(locationId)}`
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string; message?: string }).error ?? `DELETE /api/locations failed (${res.status})`)
  }
}

// ---------------------------------------------------------------------------
// Schedules
// ---------------------------------------------------------------------------

/**
 * POST /api/schedules
 * The Lambda auto-generates schedule_slot as {day_of_week}#{start_time}#{event_code}.
 */
export async function createSchedule(
  payload: CreateSchedulePayload,
): Promise<CreateScheduleResult> {
  const url = `${API_BASE_URL}/api/schedules`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string; message?: string }).error ?? `POST /api/schedules failed (${res.status})`)
  }
  return res.json() as Promise<CreateScheduleResult>
}

/**
 * PUT /api/schedules/{room_code}/{schedule_slot}
 * Updatable fields: end_time, event_name, event_type.
 * room_code and schedule_slot must be URL-encoded because schedule_slot
 * contains '#' characters.
 */
export async function updateSchedule(
  roomCode: string,
  scheduleSlot: string,
  payload: UpdateSchedulePayload,
): Promise<void> {
  const url = `${API_BASE_URL}/api/schedules/${encodeURIComponent(roomCode)}/${encodeURIComponent(scheduleSlot)}`
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string; message?: string }).error ?? `PUT /api/schedules failed (${res.status})`)
  }
}

/**
 * DELETE /api/schedules/{room_code}/{schedule_slot}
 */
export async function deleteSchedule(
  roomCode: string,
  scheduleSlot: string,
): Promise<void> {
  const url = `${API_BASE_URL}/api/schedules/${encodeURIComponent(roomCode)}/${encodeURIComponent(scheduleSlot)}`
  const res = await fetch(url, { method: 'DELETE' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error((err as { error?: string; message?: string }).error ?? `DELETE /api/schedules failed (${res.status})`)
  }
}
