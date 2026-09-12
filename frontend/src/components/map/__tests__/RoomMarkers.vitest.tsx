import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomMarkers from '../RoomMarkers'
import { getFloorConfig } from '../floorConfig'
import type { Room } from '../../../types/room'

const rooms: Room[] = [
  {
    id: 'LC3-F1-R101',
    code: 'LC3-101',
    nameThai: 'ห้อง 101',
    building: 'LC3',
    floor: 1,
    roomNumber: '101',
    category: 'lecture_room',
    coordinates: { x: 100, y: 200 },
    landmarks: [],
    aliases: [],
  },
  {
    id: 'LC3-F2-R201',
    code: 'LC3-201',
    nameThai: 'ห้อง 201',
    building: 'LC3',
    floor: 2,
    roomNumber: '201',
    category: 'lecture_room',
    coordinates: { x: 300, y: 400 },
    landmarks: [],
    aliases: [],
  },
]

describe('RoomMarkers', () => {
  it('only renders markers for rooms on the current floor', () => {
    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'ห้อง 101' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'ห้อง 201' })).not.toBeInTheDocument()
  })

  it('calls onSelectRoom with the same roomId whether the hit-layer or the pin is clicked', async () => {
    const user = userEvent.setup()
    const onSelectRoom = vi.fn()

    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={onSelectRoom}
      />
    )

    await user.click(screen.getByRole('button', { name: 'ห้อง 101' }))

    expect(onSelectRoom).toHaveBeenCalledTimes(1)
    expect(onSelectRoom).toHaveBeenCalledWith('LC3-F1-R101')
  })

  it('supports keyboard activation via Enter and Space', async () => {
    const user = userEvent.setup()
    const onSelectRoom = vi.fn()

    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={onSelectRoom}
      />
    )

    const marker = screen.getByRole('button', { name: 'ห้อง 101' })
    marker.focus()
    await user.keyboard('{Enter}')
    await user.keyboard(' ')

    expect(onSelectRoom).toHaveBeenCalledTimes(2)
    expect(onSelectRoom).toHaveBeenCalledWith('LC3-F1-R101')
  })

  it('renders a selected halo only for the selected room', () => {
    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId="LC3-F1-R101"
        onSelectRoom={vi.fn()}
      />
    )

    const marker = screen.getByRole('button', { name: 'ห้อง 101' })
    expect(marker).toHaveAttribute('aria-pressed', 'true')
    expect(marker.querySelector('[data-testid="room-selected-halo"]')).not.toBeNull()
  })

  it('does not render a halo when no room is selected', () => {
    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    expect(screen.queryByTestId('room-selected-halo')).not.toBeInTheDocument()
  })

  it('shows the room number beside the pin, because students look for door numbers', () => {
    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    expect(screen.getByText('101')).toBeInTheDocument()
    expect(screen.getByTestId('room-pin')).toBeInTheDocument()
  })

  it('labels a POI without a room number by its short name', () => {
    const toilet: Room = {
      ...rooms[0],
      id: 'LC3-F1-PLFTOILET',
      code: '',
      nameThai: 'ห้องน้ำหญิง (ฝั่งซ้าย)',
      roomNumber: '',
      category: 'toilet',
    }

    render(
      <RoomMarkers
        rooms={[toilet]}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    expect(screen.getByText('ห้องน้ำหญิง')).toBeInTheDocument()
  })

  it('collapses a crowded lower-priority room to a dot that is still clickable', async () => {
    const user = userEvent.setup()
    const onSelectRoom = vi.fn()
    const office: Room = {
      ...rooms[0],
      id: 'LC3-F1-R101-OFFICE',
      nameThai: 'ห้องพักอาจารย์',
      roomNumber: '101/9',
      category: 'faculty_office',
      coordinates: { x: 104, y: 200 },
    }

    render(
      <RoomMarkers
        rooms={[rooms[0], office]}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={onSelectRoom}
      />
    )

    expect(screen.getAllByTestId('room-pin')).toHaveLength(1)
    expect(screen.getAllByTestId('room-dot')).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'ห้องพักอาจารย์' }))
    expect(onSelectRoom).toHaveBeenCalledWith('LC3-F1-R101-OFFICE')
  })

  it('scales markers about their own anchor on hover, so a pin cannot flee the cursor', () => {
    render(
      <RoomMarkers
        rooms={[rooms[0]]}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    // SVG defaults to transform-box: view-box, where any origin keyword resolves
    // against the whole floor plan and slides the marker out from under the pointer.
    expect(screen.getByTestId('room-pin').style.transformOrigin).toBe('0px 0px')
  })

  it('draws separate man and woman pictograms for the two restrooms', () => {
    const restroom = (id: string, nameThai: string, x: number): Room => ({
      ...rooms[0],
      id,
      code: '',
      nameThai,
      roomNumber: '',
      category: 'toilet',
      coordinates: { x, y: 200 },
    })

    render(
      <RoomMarkers
        rooms={[restroom('M', 'ห้องน้ำชาย (ฝั่งซ้าย)', 100), restroom('F', 'ห้องน้ำหญิง (ฝั่งซ้าย)', 400)]}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId={null}
        onSelectRoom={vi.fn()}
      />
    )

    expect(screen.getByTestId('icon-restroom-male')).toBeInTheDocument()
    expect(screen.getByTestId('icon-restroom-female')).toBeInTheDocument()
  })
})
