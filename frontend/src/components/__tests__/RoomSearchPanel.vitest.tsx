import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import RoomSearchPanel from '../RoomSearchPanel'
import type { Room } from '../../types/room'

const mockRooms: Room[] = [
  {
    id: 'BR3-F1-R101',
    code: 'BR3-101',
    roomNumber: '101',
    nameThai: 'ห้องเรียน 101',
    building: 'BR3',
    floor: 1,
    category: 'lecture_room',
    coordinates: { x: 100, y: 200 },
    aliases: ['101', 'lab 1'],
    landmarks: [],
  },
  {
    id: 'BR3-F2-R201',
    code: 'BR3-201',
    roomNumber: '201',
    nameThai: 'ห้องปฏิบัติการ 201',
    building: 'BR3',
    floor: 2,
    category: 'laboratory',
    coordinates: { x: 300, y: 400 },
    aliases: [],
    landmarks: [],
  },
]

describe('RoomSearchPanel Component', () => {
  it('does not render the search result list when query is empty and category is all', () => {
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)

    expect(screen.getByPlaceholderText(/ค้นหาห้อง/i)).toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(screen.queryByText('BR3-101')).not.toBeInTheDocument()
  })

  it('renders matching results when user types a search query', async () => {
    const user = userEvent.setup()
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)

    const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
    await user.type(input, '101')

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('BR3-101')).toBeInTheDocument()
    expect(screen.queryByText('BR3-201')).not.toBeInTheDocument()
  })

  it('renders filtered results when user selects a category', async () => {
    const user = userEvent.setup()
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)

    const labButton = screen.getByRole('button', { name: 'ห้องปฏิบัติการ' })
    await user.click(labButton)


    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('BR3-201')).toBeInTheDocument()
    expect(screen.queryByText('BR3-101')).not.toBeInTheDocument()
  })

  it('collapses dropdown and retains query when a room is selected', async () => {
    const user = userEvent.setup()
    const handleSelectRoom = vi.fn()
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={handleSelectRoom} />)

    const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
    await user.type(input, '101')

    expect(screen.getByRole('list')).toBeInTheDocument()

    const resultButton = screen.getByRole('button', { name: /BR3-101/i })
    await user.click(resultButton)

    // Selection called
    expect(handleSelectRoom).toHaveBeenCalledWith('BR3-F1-R101')
    // Dropdown collapsed
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    // Query retained
    expect(input).toHaveValue('101')
  })

  it('re-opens dropdown when search input is focused again with existing query', async () => {
    const user = userEvent.setup()
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)

    const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
    await user.type(input, '101')

    const resultButton = screen.getByRole('button', { name: /BR3-101/i })
    await user.click(resultButton)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()

    // Focus input again
    await user.click(input)
    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getByText('BR3-101')).toBeInTheDocument()
  })

  it('dismisses dropdown when Escape key is pressed', async () => {
    const user = userEvent.setup()
    render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)

    const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
    await user.type(input, '101')
    expect(screen.getByRole('list')).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
    expect(input).toHaveValue('101')
  })

  it('dismisses dropdown when clicking outside', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <div data-testid="outside-area">Outside</div>
        <RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />
      </div>
    )

    const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
    await user.type(input, '101')
    expect(screen.getByRole('list')).toBeInTheDocument()

    const outside = screen.getByTestId('outside-area')
    await user.click(outside)
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('starts with filter collapsed by default on mobile viewport (< 640px)', () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 375

    try {
      render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)
      const toggleButton = screen.getByRole('button', { name: /แสดงตัวกรอง/i })
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    } finally {
      window.innerWidth = originalWidth
    }
  })

  it('auto-collapses filter bar on mobile when a room is selected', async () => {
    const originalWidth = window.innerWidth
    window.innerWidth = 375
    const user = userEvent.setup()

    try {
      render(<RoomSearchPanel rooms={mockRooms} onSelectRoom={vi.fn()} />)
      const toggleButton = screen.getByRole('button', { name: /แสดงตัวกรอง/i })
      // Expand filter
      await user.click(toggleButton)
      expect(toggleButton).toHaveAttribute('aria-expanded', 'true')

      // Type and select a room
      const input = screen.getByPlaceholderText(/ค้นหาห้อง/i)
      await user.type(input, '101')
      const resultButton = screen.getByRole('button', { name: /BR3-101/i })
      await user.click(resultButton)

      // Filter bar should now be auto-collapsed
      expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    } finally {
      window.innerWidth = originalWidth
    }
  })
})

