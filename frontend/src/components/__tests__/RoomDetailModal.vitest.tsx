import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import RoomDetailModal from '../RoomDetailModal'
import type { Room } from '../../types/room.ts'

const mockRooms: Room[] = [
  {
    id: 'room-1',
    code: 'BR3-F1-R111',
    roomNumber: '111',
    nameThai: 'ห้องเรียน 111',
    building: 'BR3',
    floor: 1,
    category: 'LECTURE_ROOM',
    coordinates: { x: 0, y: 0 },
    aliases: [],
    landmarks: [{ kind: 'NEAR', ref_location_id: 'lift-1' }],
  },
  {
    id: 'room-2',
    code: 'BR3-F1-R112',
    roomNumber: '112',
    nameThai: 'ห้องปฏิบัติการ 112',
    building: 'BR3',
    floor: 1,
    category: 'LAB',
    coordinates: { x: 0, y: 0 },
    aliases: [],
    landmarks: [], // ไม่สั่งมี landmark เพื่อทดสอบ Fallback
  },
]

describe('RoomDetailModal Component', () => {
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
    expect(screen.getByText(/BR3-F1-R111/)).toBeInTheDocument()
    // เช็คการ Render Landmark
    expect(screen.getByText(/📍/)).toBeInTheDocument()
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

  it('5. เรียกใช้ onClose เมื่อคลิกที่พื้นที่ Backdrop ด้านนอก', () => {
    const handleClose = vi.fn()
    render(
      <RoomDetailModal rooms={mockRooms} selectedRoomId="room-1" onClose={handleClose} />
    )

    const backdrop = screen.getByTestId('room-modal-backdrop')
    fireEvent.click(backdrop)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})