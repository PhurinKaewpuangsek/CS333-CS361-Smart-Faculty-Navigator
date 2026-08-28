export interface Coordinates {
  x: number
  y: number
}

export interface Landmark {
  kind: string
  ref_location_id?: string
  walk_hops?: number
  text_th?: string
  verification?: string
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
}

export interface RawRoomRecord {
  location_id?: string
  building_code?: string
  floor?: number
  location_kind?: string
  room_code?: string
  room_number?: string
  aliases?: string[]
  name_th?: string
  category?: string
  map_asset_id?: string
  x?: number
  y?: number
  detail_th?: string
  landmarks?: Landmark[]
  source?: unknown
  verification?: unknown
  flags?: unknown[]
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
