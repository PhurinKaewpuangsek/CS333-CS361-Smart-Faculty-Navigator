import { useContext, useState, useEffect } from 'react'
import { Context } from 'react-zoom-pan-pinch'
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

/**
 * Safely extracts current zoom scale from react-zoom-pan-pinch context.
 * Falls back to scale=1 in standalone test environments.
 */
function useTransformScale(): number {
  const transformContext = useContext(Context)
  const [scale, setScale] = useState<number>(
    transformContext?.state?.scale ?? 1
  )

  useEffect(() => {
    if (!transformContext) return
    const callback = (ref: { state: { scale: number } }) => {
      const currentScale = ref?.state?.scale
      if (currentScale && currentScale > 0) {
        setScale(currentScale)
      }
    }
    transformContext.onChangeCallbacks.add(callback)
    return () => {
      transformContext.onChangeCallbacks.delete(callback)
    }
  }, [transformContext])

  return scale
}

/**
 * Classic Google Maps SVG pin (30x40px) in standard Google Red (#EA4335)
 * with a dark circular center cutout and an elliptical ground drop shadow.
 *
 * Anchoring:
 * - The sharp bottom tip anchors precisely at (cx, cy).
 * - The entire 40px pin body extends upwards (y: 0 to -40) without covering room text.
 */
function GoogleMapsPin({
  cx,
  cy,
  invScale,
}: {
  cx: number
  cy: number
  invScale: number
}) {
  return (
    <g
      transform={`translate(${cx}, ${cy}) scale(${invScale})`}
      style={{
        filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))',
      }}
    >
      {/* Elliptical ground drop shadow under pin tip */}
      <ellipse
        data-testid="room-selected-halo"
        cx={0}
        cy={2.5}
        rx={6.5}
        ry={2.5}
        fill="#000000"
        fillOpacity={0.3}
      />

      {/* Floating pin body with smooth entrance animation */}
      <g className="animate-pin-drop">
        {/* Google Maps Teardrop Shape: Google Red #EA4335 (No white border) */}
        <path
          d="M 0 0 C -2.5 -8 -15 -15 -15 -25 A 15 15 0 1 1 15 -25 C 15 -15 2.5 -8 0 0 Z"
          fill="#EA4335"
        />

        {/* Dark circular center cutout */}
        <circle cx={0} cy={-25} r={5.5} fill="#76120e" />
      </g>
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
  const scale = useTransformScale()
  const invScale = 1 / (scale || 1)
  const floorRooms = rooms.filter((room) => room.floor === currentFloor)

  return (
    <svg
      viewBox={`0 0 ${floorConfig.width} ${floorConfig.height}`}
      width={floorConfig.width}
      height={floorConfig.height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    >
      {/* Render unselected room hitboxes: transparent with crisp hover feedback, no cluttering dots */}
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
              className="group"
              style={{ cursor: 'pointer', pointerEvents: 'auto' }}
              onClick={(event) => {
                event.stopPropagation()
                onSelectRoom(room.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectRoom(room.id)
                }
              }}
            >
              {/* Forgiving hit box area with crisp hover/active visual feedback */}
              <circle
                cx={markerX}
                cy={markerY}
                r={HIT_RADIUS}
                fill="transparent"
                className="transition-all duration-150 group-hover:fill-blue-500/15 group-hover:stroke-blue-500 group-hover:stroke-2"
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
              onClick={(event) => {
                event.stopPropagation()
                onSelectRoom(room.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  onSelectRoom(room.id)
                }
              }}
            >
              <GoogleMapsPin cx={markerX} cy={markerY} invScale={invScale} />
            </g>
          )
        })}
    </svg>
  )
}

export default RoomMarkers

