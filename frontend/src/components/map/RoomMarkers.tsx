import { createElement, useContext, useEffect, useMemo, useState } from 'react'
import type { KeyboardEvent, MouseEvent, ReactNode } from 'react'
import { Context } from 'react-zoom-pan-pinch'
import type { Room } from '../../types/room'
import type { FloorConfig } from './floorConfig'
import { getCategoryIcon } from '../categoryIcon'
import { getCategoryPinColor } from '../../services/roomDisplay'
import {
  DOT_LABEL_FONT_SIZE,
  DOT_RADIUS,
  LABEL_FONT_SIZE,
  LABEL_GAP,
  PIN_HEAD_Y,
  PIN_WIDTH,
  SELECTED_PIN_HEAD_Y,
  SELECTED_PIN_WIDTH,
  getMarkerLabel,
  layoutMarkers,
} from '../../services/markerLayout'
import type { LabelSide } from '../../services/markerLayout'

export interface RoomMarkersProps {
  rooms: Room[]
  currentFloor: number
  floorConfig: FloorConfig
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

/**
 * Hover growth has to scale about the marker itself. SVG elements default to
 * `transform-box: view-box`, so a Tailwind origin class (origin-bottom, or the default
 * centre) resolves against the whole floor plan and the marker slides away from the
 * pointer — which drops the hover, snaps it back, and makes the pin flee the cursor.
 * Local (0,0) is the pin tip and the dot centre, because the parent `g` translates there.
 */
const HOVER_ORIGIN = { transformOrigin: '0px 0px' } as const

/** Screen-px radius of the invisible tap target around a dot. */
const DOT_HIT_RADIUS = 11

/** Category pin: 24×32px teardrop, tip at (0,0), head centred at (0,-20). */
const PIN_PATH = 'M 0 0 C -2 -6.4 -12 -12 -12 -20 A 12 12 0 1 1 12 -20 C 12 -12 2 -6.4 0 0 Z'
/** Selected pin: the larger 30×40px Google red teardrop, head centred at (0,-25). */
const SELECTED_PIN_PATH = 'M 0 0 C -2.5 -8 -15 -15 -15 -25 A 15 15 0 1 1 15 -25 C 15 -15 2.5 -8 0 0 Z'

const SELECTED_PIN_COLOR = '#EA4335'
const SELECTED_LABEL_COLOR = '#0f172a'

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

function renderIcon(room: Room, x: number, y: number, size: number): ReactNode {
  return createElement(getCategoryIcon(room.category, room.nameThai), {
    x,
    y,
    size,
    color: 'white',
    weight: 'fill',
    'aria-hidden': true,
  })
}

/** Room number (or POI name) beside a pin, with a white halo so it reads over any tint. */
function MarkerLabel({
  text,
  side,
  offset,
  y,
  color,
  fontSize = LABEL_FONT_SIZE,
  bold = false,
}: {
  text: string
  side: LabelSide
  offset: number
  y: number
  color: string
  fontSize?: number
  bold?: boolean
}) {
  return (
    <text
      x={side === 'right' ? offset : -offset}
      y={y}
      dominantBaseline="central"
      textAnchor={side === 'right' ? 'start' : 'end'}
      fontSize={fontSize}
      fontWeight={bold ? 700 : 600}
      fill={color}
      stroke="white"
      strokeWidth={fontSize / 4}
      strokeLinejoin="round"
      paintOrder="stroke"
      style={{ userSelect: 'none' }}
    >
      {text}
    </text>
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
  // Re-run collision layout per 0.1 zoom step, not on every wheel frame.
  const layoutScale = Math.round((scale || 1) * 10) / 10

  const floorRooms = useMemo(
    () => rooms.filter((room) => room.floor === currentFloor),
    [rooms, currentFloor]
  )
  const layout = useMemo(
    () => layoutMarkers({ rooms: floorRooms, scale: layoutScale, selectedRoomId }),
    [floorRooms, layoutScale, selectedRoomId]
  )

  const dots = floorRooms.filter((room) => room.id !== selectedRoomId && layout.get(room.id)?.mode === 'dot')
  const pins = floorRooms.filter((room) => room.id !== selectedRoomId && layout.get(room.id)?.mode === 'pin')
  const selected = floorRooms.filter((room) => room.id === selectedRoomId)

  const interactiveProps = (room: Room, isSelected: boolean) => ({
    role: 'button',
    tabIndex: 0,
    'aria-label': room.nameThai || room.code || room.id,
    'aria-pressed': isSelected,
    style: { cursor: 'pointer', pointerEvents: 'auto' as const },
    onClick: (event: MouseEvent) => {
      event.stopPropagation()
      onSelectRoom(room.id)
    },
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        event.stopPropagation()
        onSelectRoom(room.id)
      }
    },
  })

  return (
    <svg
      viewBox={`0 0 ${floorConfig.width} ${floorConfig.height}`}
      width={floorConfig.width}
      height={floorConfig.height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none', overflow: 'visible' }}
    >
      {/* Paint order: dots → pins (with labels) → selected. The layout guarantees no
          label overlaps another pin, so labels never end up under a later marker. */}
      {dots.map((room) => {
        const color = getCategoryPinColor(room.category)
        const side = layout.get(room.id)?.label ?? null
        return (
          <g
            key={room.id}
            {...interactiveProps(room, false)}
            className="group"
            transform={`translate(${room.coordinates.x}, ${room.coordinates.y}) scale(${invScale})`}
          >
            <circle r={DOT_HIT_RADIUS} fill="transparent" />
            <circle
              data-testid="room-dot"
              r={DOT_RADIUS}
              fill={color}
              stroke="white"
              strokeWidth={1.5}
              className="transition-transform duration-150 group-hover:scale-150"
              style={HOVER_ORIGIN}
            />
            {side && (
              <MarkerLabel
                text={getMarkerLabel(room)}
                side={side}
                offset={DOT_RADIUS + LABEL_GAP}
                y={0}
                color={color}
                fontSize={DOT_LABEL_FONT_SIZE}
              />
            )}
          </g>
        )
      })}

      {pins.map((room) => {
        const color = getCategoryPinColor(room.category)
        const side = layout.get(room.id)?.label ?? null
        const props = interactiveProps(room, false)
        return (
          <g
            key={room.id}
            {...props}
            className="group"
            transform={`translate(${room.coordinates.x}, ${room.coordinates.y}) scale(${invScale})`}
            style={{ ...props.style, filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.25))' }}
          >
            <g
              data-testid="room-pin"
              className="transition-transform duration-150 group-hover:scale-110"
              style={HOVER_ORIGIN}
            >
              <path d={PIN_PATH} fill={color} stroke="white" strokeWidth={1.5} />
              {renderIcon(room, -7, -PIN_HEAD_Y - 7, 14)}
            </g>
            {side && (
              <MarkerLabel
                text={getMarkerLabel(room)}
                side={side}
                offset={PIN_WIDTH / 2 + LABEL_GAP}
                y={-PIN_HEAD_Y}
                color={color}
              />
            )}
          </g>
        )
      })}

      {selected.map((room) => {
        const side = layout.get(room.id)?.label ?? 'right'
        return (
          <g
            key={room.id}
            {...interactiveProps(room, true)}
            transform={`translate(${room.coordinates.x}, ${room.coordinates.y}) scale(${invScale})`}
          >
            {/* Elliptical ground shadow under the pin tip */}
            <ellipse
              data-testid="room-selected-halo"
              cx={0}
              cy={2.5}
              rx={6.5}
              ry={2.5}
              fill="#000000"
              fillOpacity={0.3}
            />
            <g className="animate-pin-drop" style={{ filter: 'drop-shadow(0 3px 6px rgba(0, 0, 0, 0.25))' }}>
              <path d={SELECTED_PIN_PATH} fill={SELECTED_PIN_COLOR} />
              {renderIcon(room, -9, -SELECTED_PIN_HEAD_Y - 9, 18)}
            </g>
            <MarkerLabel
              text={getMarkerLabel(room)}
              side={side}
              offset={SELECTED_PIN_WIDTH / 2 + LABEL_GAP}
              y={-SELECTED_PIN_HEAD_Y}
              color={SELECTED_LABEL_COLOR}
              bold
            />
          </g>
        )
      })}
    </svg>
  )
}

export default RoomMarkers
