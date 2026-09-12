import type { Room } from '../types/room.ts'

/**
 * Google-Maps-style marker placement for the floor plan.
 *
 * Room points are dense — nearest neighbours sit 20–45 map units apart — so drawing a
 * full pin and label for every room at default zoom turns the map into mush. This does
 * what Google does: place markers greedily by importance, and whatever would collide
 * with something already placed is demoted (pin → dot). Zooming in spreads the points
 * apart on screen, so the same pass promotes them back.
 *
 * Kept free of React and the DOM so it runs under plain `node --test`.
 */

export type MarkerMode = 'pin' | 'dot'
export type LabelSide = 'right' | 'left'

export interface MarkerPlacement {
  mode: MarkerMode
  label: LabelSide | null
}

/** Pin geometry in screen px. The tip sits on the room point; the head is above it. */
export const PIN_WIDTH = 24
export const PIN_HEIGHT = 32
export const PIN_HEAD_Y = 20

/** The selected pin is drawn larger so it stands out from the category pins. */
export const SELECTED_PIN_WIDTH = 30
export const SELECTED_PIN_HEIGHT = 40
export const SELECTED_PIN_HEAD_Y = 25

export const DOT_RADIUS = 4
export const LABEL_FONT_SIZE = 12
export const LABEL_HEIGHT = 16
export const LABEL_GAP = 3

/**
 * A demoted room keeps its number in smaller type when there is space for it. The floor
 * artwork no longer carries room numbers under the pins, so without this a crowded area
 * would lose its numbers entirely until the user zooms in.
 */
export const DOT_LABEL_FONT_SIZE = 10
export const DOT_LABEL_HEIGHT = 13

const CHAR_WIDTH = 7
const LABEL_PADDING = 8

/** Thai vowel and tone marks stack on the previous glyph and take no width of their own. */
const THAI_COMBINING_MARKS = /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/g

const CATEGORY_PRIORITY: Record<string, number> = {
  // Wayfinding first: toilets and stairs are what people look for in a corridor.
  toilet: 5,
  stairs: 5,
  lecture_room: 4,
  seminar_room: 4,
  meeting_room: 4,
  laboratory: 3,
  lab: 3,
  research_room: 3,
  faculty_office: 2,
  department_office: 2,
  staff_room: 2,
  office: 2,
}
const DEFAULT_PRIORITY = 1

/**
 * Text shown beside a pin.
 *
 * Students navigate by the number on the door, so a room shows its number. Corridor
 * POIs (toilets, stairs) have none and fall back to their name with any parenthetical
 * qualifier dropped — "ห้องน้ำหญิง (ฝั่งซ้าย)" becomes "ห้องน้ำหญิง".
 */
export function getMarkerLabel(room: Pick<Room, 'roomNumber' | 'nameThai' | 'code'>): string {
  if (room.roomNumber) return room.roomNumber
  const shortName = (room.nameThai ?? '').replace(/\s*\([^)]*\)\s*/g, ' ').trim()
  return shortName || room.code
}

export function getMarkerPriority(room: Pick<Room, 'category'>): number {
  return CATEGORY_PRIORITY[(room.category ?? '').toLowerCase()] ?? DEFAULT_PRIORITY
}

/**
 * Estimated rendered width of a label in screen px at `fontSize`.
 * Deterministic on purpose: no canvas in jsdom, and a stable estimate means the layout
 * cannot flicker between two outcomes from one frame to the next.
 */
export function estimateLabelWidth(label: string, fontSize: number = LABEL_FONT_SIZE): number {
  const glyphs = [...label.replace(THAI_COMBINING_MARKS, '')].length
  return (glyphs * CHAR_WIDTH + LABEL_PADDING) * (fontSize / LABEL_FONT_SIZE)
}

interface Box {
  x1: number
  y1: number
  x2: number
  y2: number
}

const overlaps = (a: Box, b: Box): boolean =>
  a.x1 < b.x2 && a.x2 > b.x1 && a.y1 < b.y2 && a.y2 > b.y1

export interface LayoutInput {
  rooms: Room[]
  /** Current zoom scale of the map; screen px = map units × scale. */
  scale: number
  selectedRoomId: string | null
}

export function layoutMarkers({ rooms, scale, selectedRoomId }: LayoutInput): Map<string, MarkerPlacement> {
  const s = scale > 0 ? scale : 1
  const px = (n: number) => n / s // screen px → map units

  const rank = (room: Room) => (room.id === selectedRoomId ? Number.MAX_SAFE_INTEGER : getMarkerPriority(room))
  const ordered = [...rooms].sort((a, b) => rank(b) - rank(a) || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))

  // Every room point stays visible (as a pin or a dot), so no label may be drawn over one.
  const anchors = new Map<string, Box>(
    rooms.map((room) => {
      const { x, y } = room.coordinates
      const r = px(DOT_RADIUS + 1)
      return [room.id, { x1: x - r, y1: y - r, x2: x + r, y2: y + r }]
    })
  )

  const occupied: Box[] = []
  const placements = new Map<string, MarkerPlacement>()

  const isFree = (box: Box, roomId: string) =>
    !occupied.some((other) => overlaps(other, box)) &&
    ![...anchors].some(([id, anchor]) => id !== roomId && overlaps(anchor, box))

  /** Label boxes to try, in order of preference: to the right of the marker, then left. */
  const labelCandidates = (
    x: number,
    centreY: number,
    offset: number,
    width: number,
    height: number
  ): Array<[LabelSide, Box]> => {
    const top = centreY - height / 2
    const bottom = centreY + height / 2
    return [
      ['right', { x1: x + offset, y1: top, x2: x + offset + width, y2: bottom }],
      ['left', { x1: x - offset - width, y1: top, x2: x - offset, y2: bottom }],
    ]
  }

  // Pass 1: pins and their labels, most important room first.
  for (const room of ordered) {
    const { x, y } = room.coordinates
    const isSelected = room.id === selectedRoomId
    const width = isSelected ? SELECTED_PIN_WIDTH : PIN_WIDTH
    const height = isSelected ? SELECTED_PIN_HEIGHT : PIN_HEIGHT
    const headY = isSelected ? SELECTED_PIN_HEAD_Y : PIN_HEAD_Y

    const pinBox: Box = { x1: x - px(width / 2), y1: y - px(height), x2: x + px(width / 2), y2: y }

    if (!isSelected && occupied.some((box) => overlaps(box, pinBox))) {
      placements.set(room.id, { mode: 'dot', label: null })
      continue
    }
    occupied.push(pinBox)

    const candidates = labelCandidates(
      x,
      y - px(headY),
      px(width / 2 + LABEL_GAP),
      px(estimateLabelWidth(getMarkerLabel(room))),
      px(LABEL_HEIGHT)
    )

    const free = candidates.find(([, box]) => isFree(box, room.id))
    // The selected room always keeps its label, even if it has to overlap something.
    const chosen = free ?? (isSelected ? candidates[0] : undefined)

    if (chosen) occupied.push(chosen[1])
    placements.set(room.id, { mode: 'pin', label: chosen ? chosen[0] : null })
  }

  // Pass 2: demoted dots bid for a small label, but only for space no pin wanted.
  for (const room of ordered) {
    if (placements.get(room.id)?.mode !== 'dot') continue
    const { x, y } = room.coordinates

    const candidates = labelCandidates(
      x,
      y,
      px(DOT_RADIUS + LABEL_GAP),
      px(estimateLabelWidth(getMarkerLabel(room), DOT_LABEL_FONT_SIZE)),
      px(DOT_LABEL_HEIGHT)
    )

    const free = candidates.find(([, box]) => isFree(box, room.id))
    if (!free) continue
    occupied.push(free[1])
    placements.set(room.id, { mode: 'dot', label: free[0] })
  }

  return placements
}
