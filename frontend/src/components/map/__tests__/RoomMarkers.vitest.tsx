import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RoomMarkers from '../RoomMarkers'
import { getFloorConfig } from '../floorConfig'
import type { Room } from '../../../types/room'

const rooms: Room[] = [
  {
    id: 'BR3-F1-R101',
    code: 'BR3-101',
    nameThai: 'ห้อง 101',
    building: 'BR3',
    floor: 1,
    roomNumber: '101',
    category: 'lecture_room',
    coordinates: { x: 100, y: 200 },
    landmarks: [],
    aliases: [],
  },
  {
    id: 'BR3-F2-R201',
    code: 'BR3-201',
    nameThai: 'ห้อง 201',
    building: 'BR3',
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
    expect(onSelectRoom).toHaveBeenCalledWith('BR3-F1-R101')
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
    expect(onSelectRoom).toHaveBeenCalledWith('BR3-F1-R101')
  })

  it('renders a selected halo only for the selected room', () => {
    render(
      <RoomMarkers
        rooms={rooms}
        currentFloor={1}
        floorConfig={getFloorConfig(1)}
        selectedRoomId="BR3-F1-R101"
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
})
