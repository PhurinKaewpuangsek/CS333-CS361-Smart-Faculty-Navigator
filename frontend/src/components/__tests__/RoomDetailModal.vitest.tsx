import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import RoomDetailModal from '../RoomDetailModal'
import type { Room } from '../../types/room.ts'

const mockRooms: Room[] = [
  {
    id: 'room-1',
    code: 'LC3-F1-R111',
    roomNumber: '111',
    nameThai: 'ห้องเรียน 111',
    building: 'LC3',
    floor: 1,
    category: 'LECTURE_ROOM',
    coordinates: { x: 0, y: 0 },
    aliases: [],
    landmarks: [{ kind: 'NEAR', ref_location_id: 'lift-1' }],
  },
  {
    id: 'room-2',
    code: 'LC3-F1-R112',
    roomNumber: '112',
    nameThai: 'ห้องปฏิบัติการ 112',
    building: 'LC3',
    floor: 1,
    category: 'LAB',
    coordinates: { x: 0, y: 0 },
    aliases: [],
    landmarks: [], // ไม่สั่งมี landmark เพื่อทดสอบ Fallback
  },
]

describe('RoomDetailModal Component', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.unstubAllEnvs()
  })
  it('1. ไม่ render UI เมื่อ selectedRoomId เป็น null', () => {
    const { container } = render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId={null} onClose={vi.fn()} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('2. แสดงผลข้อมูลห้องและจุดสังเกต (Landmarks) ได้ถูกต้องเมื่อส่ง selectedRoomId', () => {
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
    )

    expect(screen.getByText('ห้องเรียน 111')).toBeInTheDocument()
    expect(screen.getByText(/LC3-F1-R111/)).toBeInTheDocument()
    // เช็คการ Render Landmark
    expect(screen.getByText('NEAR')).toBeInTheDocument()
  })


  it('3. แสดง Fallback Text เมื่อห้องไม่มีข้อมูล landmarks (landmarks เป็น array ว่าง)', () => {
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-2" onClose={vi.fn()} />
    )

    expect(screen.getByText('ห้องปฏิบัติการ 112')).toBeInTheDocument()
    expect(
      screen.getByText('ยังไม่มีข้อมูลจุดสังเกตสำหรับห้องนี้')
    ).toBeInTheDocument()
  })

  it('แสดงความจุที่บันทึกไว้บน server แม้เครื่องนี้ไม่เคยแก้ไขห้องนั้นเลย', () => {
    const roomWithCapacity: Room = { ...mockRooms[0], capacity: 60 }

    render(
      <RoomDetailModal rooms={[roomWithCapacity]} selectedRoomId="room-1" onClose={vi.fn()} />
    )

    expect(screen.getByText('ความจุ 60 คน')).toBeInTheDocument()
  })

  it('4. เรียกใช้ onClose เมื่อคลิกปุ่มปิด (X)', () => {
    const handleClose = vi.fn()
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={handleClose} />
    )

    const closeButton = screen.getByRole('button', {
      name: /ปิดหน้าต่างรายละเอียดห้อง/i,
    })
    fireEvent.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('5. ไม่มี backdrop overlay บดบังแผนที่ และ wrapper เป็น pointer-events-none', () => {
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
    )

    expect(screen.queryByTestId('room-modal-backdrop')).toBeNull()
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('pointer-events-auto')
  })

  it('6. เรียกใช้ onClose เมื่อกดปุ่ม Escape บนแป้นพิมพ์', () => {
    const handleClose = vi.fn()
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={handleClose} />
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('7. ไม่ render UI เมื่อ isOpen เป็น false แม้ว่า selectedRoomId จะมีค่า', () => {
    const { container } = render(
      <RoomDetailModal
        rooms={mockRooms}
        selectedRoomId="room-1"
        isOpen={false}
        onClose={vi.fn()}
      />
    )
    expect(container.firstChild).toBeNull()
  })

  describe('Edit Mode & CRUD operations', () => {
    it('8. ไม่แสดงปุ่ม Edit หาก VITE_ENABLE_EDIT_MODE ไม่ได้เป็น true', () => {
      vi.stubEnv('VITE_ENABLE_EDIT_MODE', 'false')
      render(
        <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
      )
      expect(screen.queryByRole('button', { name: /edit/i })).toBeNull()
      vi.unstubAllEnvs()
    })

    it('9. แสดงปุ่ม Edit เมื่อ VITE_ENABLE_EDIT_MODE เป็น true', () => {
      vi.stubEnv('VITE_ENABLE_EDIT_MODE', 'true')
      render(
        <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
      )
      expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
      vi.unstubAllEnvs()
    })

    it('10. กดปุ่ม Edit แล้วแสดง Input ชื่อห้อง และความจุ', () => {
      vi.stubEnv('VITE_ENABLE_EDIT_MODE', 'true')
      render(
        <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
      )

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      expect(screen.getByLabelText(/ชื่อห้อง/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ความจุ/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
      vi.unstubAllEnvs()
    })

    it('11. กด Save แล้วยิง PUT API ไปที่ VITE_API_BASE_URL + /api/locations/{id} พร้อม Payload และอัปเดตข้อมูลบนหน้าจอ', async () => {
      vi.stubEnv('VITE_ENABLE_EDIT_MODE', 'true')
      vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com')

      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ message: 'Updated' }),
      })
      globalThis.fetch = mockFetch

      render(
        <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
      )

      fireEvent.click(screen.getByRole('button', { name: /edit/i }))

      const nameInput = screen.getByLabelText(/ชื่อห้อง/i)
      const capacityInput = screen.getByLabelText(/ความจุ/i)

      fireEvent.change(nameInput, { target: { value: 'ห้องเรียนใหม่ 111' } })
      fireEvent.change(capacityInput, { target: { value: '45' } })

      fireEvent.click(screen.getByRole('button', { name: /save/i }))

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/api/locations/room-1',
        expect.objectContaining({
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'ห้องเรียนใหม่ 111',
            name_th: 'ห้องเรียนใหม่ 111',
            nameThai: 'ห้องเรียนใหม่ 111',
            capacity: 45,
          }),
        })
      )

      expect(await screen.findByText('ห้องเรียนใหม่ 111')).toBeInTheDocument()
      expect(await screen.findByText(/ความจุ 45 คน/)).toBeInTheDocument()

      vi.unstubAllEnvs()
    })

    it('12. กด Cancel ใน Edit Mode แล้วกลับสู่ View Mode โดยไม่อัปเดตข้อมูล', () => {
      vi.stubEnv('VITE_ENABLE_EDIT_MODE', 'true')
      render(
        <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={vi.fn()} />
      )

      fireEvent.click(screen.getByRole('button', { name: /edit/i }))

      const nameInput = screen.getByLabelText(/ชื่อห้อง/i)
      fireEvent.change(nameInput, { target: { value: 'ห้องที่แก้ไขแต่กดยกเลิก' } })

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByLabelText(/ชื่อห้อง/i)).toBeNull()
      expect(screen.getByText('ห้องเรียน 111')).toBeInTheDocument()
      expect(screen.queryByText('ห้องที่แก้ไขแต่กดยกเลิก')).toBeNull()

      vi.unstubAllEnvs()
    })
  })
})