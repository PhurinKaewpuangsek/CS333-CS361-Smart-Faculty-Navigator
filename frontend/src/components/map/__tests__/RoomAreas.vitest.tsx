import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RoomAreas from '../RoomAreas'
import { getFloorConfig } from '../floorConfig'
import { ROOM_AREAS } from '../roomAreaGeometry'
import { getCategoryAreaFill } from '../../../services/roomDisplay'
import type { Room } from '../../../types/room'

function makeRoom(overrides: Partial<Room> & Pick<Room, 'id' | 'floor' | 'category'>): Room {
  return {
    code: '',
    nameThai: '',
    building: 'LC3',
    roomNumber: '',
    coordinates: { x: 0, y: 0 },
    landmarks: [],
    aliases: [],
    ...overrides,
  }
}

// Real IDs from the generated geometry, so the test breaks if extraction regresses.
const LAB_ON_FLOOR_2 = 'LC3-F2-R203'
const LECTURE_ON_FLOOR_1 = 'LC3-F1-R101-1'
// A corridor POI: it has a seed record and a map pin, but no area rect.
const POI_WITHOUT_AREA = 'LC3-F1-PLFTOILET'

describe('RoomAreas', () => {
  it('renders a tinted rect for each room on the current floor', () => {
    const rooms = [
      makeRoom({ id: LECTURE_ON_FLOOR_1, floor: 1, category: 'lecture_room' }),
      makeRoom({ id: LAB_ON_FLOOR_2, floor: 2, category: 'laboratory' }),
    ]

    render(<RoomAreas rooms={rooms} currentFloor={1} floorConfig={getFloorConfig(1)} />)

    const rects = screen.getByTestId('room-areas').querySelectorAll('rect')
    expect(rects).toHaveLength(1)
    expect(rects[0].getAttribute('data-room-id')).toBe(LECTURE_ON_FLOOR_1)
  })

  it('positions each rect on the geometry extracted from the floor plan', () => {
    const room = makeRoom({ id: LECTURE_ON_FLOOR_1, floor: 1, category: 'lecture_room' })
    const area = ROOM_AREAS[LECTURE_ON_FLOOR_1]

    render(<RoomAreas rooms={[room]} currentFloor={1} floorConfig={getFloorConfig(1)} />)

    const rect = screen.getByTestId('room-areas').querySelector('rect')
    expect(rect?.getAttribute('x')).toBe(String(area.x))
    expect(rect?.getAttribute('y')).toBe(String(area.y))
    expect(rect?.getAttribute('width')).toBe(String(area.width))
    expect(rect?.getAttribute('height')).toBe(String(area.height))
  })

  it('colours each area by category rather than by the artwork', () => {
    const rooms = [
      makeRoom({ id: LECTURE_ON_FLOOR_1, floor: 1, category: 'lecture_room' }),
      makeRoom({ id: 'LC3-F1-R103', floor: 1, category: 'faculty_office' }),
    ]

    render(<RoomAreas rooms={rooms} currentFloor={1} floorConfig={getFloorConfig(1)} />)

    const rects = [...screen.getByTestId('room-areas').querySelectorAll('rect')]
    for (const rect of rects) {
      const room = rooms.find((r) => r.id === rect.getAttribute('data-room-id'))
      expect(rect.getAttribute('fill')).toBe(getCategoryAreaFill(room?.category))
    }
    expect(rects[0].getAttribute('fill')).not.toBe(rects[1].getAttribute('fill'))
  })

  it('renders nothing for a room that has no extracted area', () => {
    const room = makeRoom({ id: POI_WITHOUT_AREA, floor: 1, category: 'toilet' })
    expect(ROOM_AREAS[POI_WITHOUT_AREA]).toBeUndefined()

    render(<RoomAreas rooms={[room]} currentFloor={1} floorConfig={getFloorConfig(1)} />)

    expect(screen.getByTestId('room-areas').querySelectorAll('rect')).toHaveLength(0)
  })

  it('never intercepts pointer events, so room markers stay clickable', () => {
    render(<RoomAreas rooms={[]} currentFloor={1} floorConfig={getFloorConfig(1)} />)

    const layer = screen.getByTestId('room-areas')
    expect(layer.style.pointerEvents).toBe('none')
    expect(layer.style.mixBlendMode).toBe('multiply')
    expect(layer).toHaveAttribute('aria-hidden', 'true')
  })
})
