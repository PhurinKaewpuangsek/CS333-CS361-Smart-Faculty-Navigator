import type { Room } from '../../types/room'
import type { FloorConfig } from './floorConfig'

export interface RoomMarkersProps {
  rooms: Room[]
  currentFloor: number
  floorConfig: FloorConfig
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

const HIT_RADIUS = 16
const PIN_RADIUS = 5

/**
 * Renders a classic SVG map-pin (inverted teardrop) with balanced proportions.
 * The bottom-center tip lands PRECISELY at (cx, cy).
 *
 * Geometry:
 *   ┌──────────┐   ← top of rounded cap at cy - bodyH - r
 *   │  O hole  │   ← white center hole at (cx, cy - bodyH)
 *   │          │
 *    \        /    ← balanced tapered sides
 *     \      /
 *        \/        ← bottom tip anchored at (cx, cy)
 */
function MapPinSvg({
  cx,
  cy,
}: {
  cx: number
  cy: number
}) {
  const r = 7
  const bodyH = 15
  const holeR = 3
  const capCy = cy - bodyH

  // Path starts at tip (cx, cy), curves up around the circular cap, and returns to tip
  const path = [
    `M ${cx} ${cy}`,
    `C ${cx - 1.5} ${cy - bodyH * 0.4} ${cx - r} ${capCy + r * 0.4} ${cx - r} ${capCy}`,
    `A ${r} ${r} 0 1 1 ${cx + r} ${capCy}`,
    `C ${cx + r} ${capCy + r * 0.4} ${cx + 1.5} ${cy - bodyH * 0.4} ${cx} ${cy}`,
    'Z',
  ].join(' ')

  return (
    <g style={{ filter: 'drop-shadow(0px 2px 4px rgba(0, 0, 0, 0.3))' }}>
      {/* Ground contact shadow under tip */}
      <ellipse cx={cx} cy={cy + 0.5} rx={2.5} ry={1} fill="#000000" fillOpacity={0.25} />
      {/* Pin body */}
      <path
        d={path}
        fill="#ef4444"
        stroke="#ffffff"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      {/* White center hole */}
      <circle
        cx={cx}
        cy={capCy}
        r={holeR}
        fill="#ffffff"
      />
    </g>
  )
}

function RoomMarkers({
  rooms,
  currentFloor,
  floorConfig,
  selectedRoomId,
  onSelectRoom,
}: RoomMarkersProps) {
  const floorRooms = rooms.filter((room) => room.floor === currentFloor)
  const hasSelection = selectedRoomId !== null

  return (
    <svg
      viewBox={`0 0 ${floorConfig.width} ${floorConfig.height}`}
      width={floorConfig.width}
      height={floorConfig.height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Render unselected rooms first so the selected pin always sits on top */}
      {floorRooms
        .filter((room) => room.id !== selectedRoomId)
        .map((room) => {
          const markerX = room.coordinates.x
          const markerY = room.coordinates.y
          return (
            <g
              key={room.id}
              role="button"
              tabIndex={0}
              aria-label={room.nameThai || room.code || room.id}
              aria-pressed={false}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onSelectRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectRoom(room.id)
                }
              }}
            >
              {/* Hit area */}
              <circle cx={markerX} cy={markerY} r={HIT_RADIUS} fill="transparent" />
              {/* Unselected dot: muted when something else is selected */}
              <circle
                cx={markerX}
                cy={markerY}
                r={PIN_RADIUS}
                fill={hasSelection ? '#94a3b8' : '#3b82f6'}
                fillOpacity={hasSelection ? 0.45 : 0.75}
                stroke="#ffffff"
                strokeWidth={1.5}
                strokeOpacity={hasSelection ? 0.6 : 0.9}
              />
            </g>
          )
        })}

      {/* Render the selected room last — always on top */}
      {floorRooms
        .filter((room) => room.id === selectedRoomId)
        .map((room) => {
          const markerX = room.coordinates.x
          const markerY = room.coordinates.y
          return (
            <g
              key={room.id}
              role="button"
              tabIndex={0}
              aria-label={room.nameThai || room.code || room.id}
              aria-pressed={true}
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={() => onSelectRoom(room.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  onSelectRoom(room.id)
                }
              }}
            >
              {/* Invisible testid halo for unit tests */}
              <circle
                data-testid="room-selected-halo"
                cx={markerX}
                cy={markerY}
                r={HIT_RADIUS}
                fill="transparent"
              />
              <MapPinSvg cx={markerX} cy={markerY} />
            </g>
          )
        })}
    </svg>
  )
}

export default RoomMarkers

