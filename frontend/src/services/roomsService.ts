import type { RawRoomRecord, Room, RoomsDataResponse } from '../types/room'

export function normalizeRoom(raw: RawRoomRecord): Room {
  const roomCode = raw.room_code ?? ''
  const derivedRoomNumber =
    raw.room_number ??
    (roomCode.includes('-') ? roomCode.substring(roomCode.indexOf('-') + 1) : roomCode)

  return {
    id: raw.location_id ?? '',
    code: roomCode,
    nameThai: raw.name_th ?? '',
    building: raw.building_code ?? '',
    floor: typeof raw.floor === 'number' ? raw.floor : Number(raw.floor) || 0,
    roomNumber: derivedRoomNumber,
    category: raw.category ?? '',
    coordinates: {
      x: typeof raw.x === 'number' ? raw.x : Number(raw.x) || 0,
      y: typeof raw.y === 'number' ? raw.y : Number(raw.y) || 0,
    },
    landmarks: Array.isArray(raw.landmarks) ? raw.landmarks : [],
    aliases: Array.isArray(raw.aliases) ? raw.aliases : [],
  }
}

export async function getRooms(): Promise<Room[]> {
  const response = await fetch('/data/rooms.json')

  if (!response.ok) {
    throw new Error(`Failed to fetch rooms: ${response.status} ${response.statusText}`)
  }

  const data: RoomsDataResponse = await response.json()

  if (!data || !Array.isArray(data.records)) {
    throw new Error('Invalid rooms data format: expected "records" array')
  }

  return data.records.map(normalizeRoom)
}
