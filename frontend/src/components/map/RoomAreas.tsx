import type { Room } from '../../types/room'
import { getCategoryAreaFill } from '../../services/roomDisplay'
import type { FloorConfig } from './floorConfig'
import { ROOM_AREAS } from './roomAreaGeometry'

export interface RoomAreasProps {
  rooms: Room[]
  currentFloor: number
  floorConfig: FloorConfig
}

/**
 * Tints each room's floor-plan area by category.
 *
 * The floor plan is a flat <img>: room numbers and wall strokes are baked into it above
 * the interior fills, and the artwork's own background sits below them, so there is no
 * layer to slide underneath. Instead the interiors were neutralised to white (see
 * tools/data-extraction/extract-room-areas.mjs) and this layer composites on top with
 * `mix-blend-mode: multiply` — white takes the tint, black text and strokes stay black.
 *
 * Rooms with no entry in ROOM_AREAS (corridor POIs such as toilets and stairs) simply
 * render nothing; RoomMarkers still places their pin.
 */
function RoomAreas({ rooms, currentFloor, floorConfig }: RoomAreasProps) {
  const floorRooms = rooms.filter((room) => room.floor === currentFloor)

  return (
    <svg
      data-testid="room-areas"
      viewBox={`0 0 ${floorConfig.width} ${floorConfig.height}`}
      width={floorConfig.width}
      height={floorConfig.height}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        // Clicks belong to RoomMarkers, which sits above this layer.
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }}
    >
      {floorRooms.map((room) => {
        const path = ROOM_AREAS[room.id]
        if (!path || path.floor !== currentFloor) return null

        return (
          <rect
            key={room.id}
            data-room-id={room.id}
            x={path.x}
            y={path.y}
            width={path.width}
            height={path.height}
            fill={getCategoryAreaFill(room.category)}
          />
        )
      })}
    </svg>
  )
}

export default RoomAreas
