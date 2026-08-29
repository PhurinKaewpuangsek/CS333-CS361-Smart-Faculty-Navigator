import type { Room } from '../types/room.ts'

interface SearchResultListProps {
  rooms: Room[]
  loading: boolean
  error: Error | null
  onSelectRoom: (roomId: string) => void
}

export default function SearchResultList({
  rooms,
  loading,
  error,
  onSelectRoom,
}: SearchResultListProps) {
  if (loading) {
    return (
      <p className="px-4 py-6 text-center text-sm text-slate-500">กำลังโหลดข้อมูลห้อง...</p>
    )
  }

  if (error) {
    return (
      <p className="px-4 py-6 text-center text-sm text-red-600">
        เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง: {error.message}
      </p>
    )
  }

  if (rooms.length === 0) {
    return (
      <p className="px-4 py-6 text-center text-sm text-slate-500">
        ไม่พบห้องที่ค้นหา ลองเปลี่ยนคำค้นหาหรือหมวดหมู่ดูนะ
      </p>
    )
  }

  return (
    <ul className="max-h-72 divide-y divide-slate-100 overflow-y-auto">
      {rooms.map((room) => (
        <li key={room.id}>
          <button
            type="button"
            onClick={() => onSelectRoom(room.id)}
            className="flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left hover:bg-slate-50"
          >
            <span className="text-sm font-semibold text-slate-900">
              {room.code || room.roomNumber || room.id}
            </span>
            <span className="text-sm text-slate-600">{room.nameThai || 'ไม่มีชื่อห้อง'}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
