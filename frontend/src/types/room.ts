export interface Coordinates {
  x: number
  y: number
}

export interface Landmark {
  kind: string
  ref_location_id?: string
  walk_hops?: number
  text_th?: string
  [key: string]: unknown
}

export interface Room {
  id: string
  code: string
  nameThai: string
  building: string
  floor: number
  roomNumber: string
  category: string
  coordinates: Coordinates
  landmarks: Landmark[]
  aliases: string[]
  capacity?: number
}

/**
 * One item of GET /api/locations. The API sends only these fields
 * (functions/get-locations/index.mjs RESPONSE_FIELDS); the table's provenance
 * attributes such as `source` and `verification` stay in DynamoDB.
 */
export interface RawRoomRecord {
  location_id?: string
  building_code?: string
  floor?: number
  room_code?: string
  room_number?: string
  aliases?: string[]
  name_th?: string
  category?: string
  x?: number
  y?: number
  landmarks?: Landmark[]
  capacity?: number
  [key: string]: unknown
}

export interface RoomsDataResponse {
  generated_by?: string
  manifest?: string
  building?: unknown
  floors?: unknown[]
  counts?: Record<string, number>
  records: RawRoomRecord[]
}
