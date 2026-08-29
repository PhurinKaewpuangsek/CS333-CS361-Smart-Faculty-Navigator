import type { Room } from '../../types/room'
import type { FloorConfig } from './floorConfig'

export interface RoomMarkersProps {
  rooms: Room[]
  currentFloor: number
  floorConfig: FloorConfig
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

const HIT_RADIUS = 10
const PIN_RADIUS = 5
const SELECTED_RADIUS = 7
const HALO_RADIUS = 14

function RoomMarkers({
  rooms,
  currentFloor,
  floorConfig,
  selectedRoomId,
  onSelectRoom,
}: RoomMarkersProps) {
  const floorRooms = rooms.filter((room) => room.floor === currentFloor)

  return (
    <svg
      viewBox={`0 0 ${floorConfig.width} ${floorConfig.height}`}
      width={floorConfig.width}
      height={floorConfig.height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {floorRooms.map((room) => {
        const isSelected = room.id === selectedRoomId
        const label = room.nameThai || room.code || room.id

        return (
          <g
            key={room.id}
            role="button"
            tabIndex={0}
            aria-label={label}
            aria-pressed={isSelected}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onClick={() => onSelectRoom(room.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onSelectRoom(room.id)
              }
            }}
          >
            {/* Invisible hit-layer: enlarges the touch target beyond the visible pin */}
            <circle
              cx={room.coordinates.x}
              cy={room.coordinates.y}
              r={HIT_RADIUS}
              fill="transparent"
            />
            {isSelected && (
              <circle
                data-testid="room-selected-halo"
                cx={room.coordinates.x}
                cy={room.coordinates.y}
                r={HALO_RADIUS}
                fill="none"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="4 3"
              />
            )}
            <circle
              cx={room.coordinates.x}
              cy={room.coordinates.y}
              r={isSelected ? SELECTED_RADIUS : PIN_RADIUS}
              fill={isSelected ? '#ef4444' : '#2563eb'}
              stroke="white"
              strokeWidth={isSelected ? 2 : 1.5}
            />
          </g>
        )
      })}
    </svg>
  )
}

export default RoomMarkers
