import { useMemo, useState } from 'react'
import { useRooms } from '../hooks/useRooms.ts'
import { filterRooms, DEFAULT_CATEGORY_KEY } from '../services/filterRooms.ts'
import SearchBar from './SearchBar.tsx'
import CategoryFilter from './CategoryFilter.tsx'
import SearchResultList from './SearchResultList.tsx'

interface RoomSearchPanelProps {
  /** ยิง event ออกไปเมื่อผู้ใช้กดเลือกห้องจากผลลัพธ์ ให้ parent ไปปักหมุด SVG / เปิด Room Detail Modal ต่อ */
  onSelectRoom: (roomId: string) => void
}

/**
 * Search & Filter Component (issue #25) — self-contained: ดึงข้อมูลห้องเองผ่าน
 * useRooms() ตาม Goal ของ issue แล้วส่งเฉพาะ roomId ที่เลือกออกไปให้ parent
 *
 * หมายเหตุ: เพราะ component นี้เรียก useRooms() เอง ถ้า parent (เช่น App.tsx)
 * เรียก useRooms() ซ้ำอีกที่ จะมี fetch('/data/rooms.json') สองครั้ง —
 * ยอมรับได้สำหรับ V1 เพราะเป็นไฟล์ static เล็ก แต่ถ้าจะ optimize ทีหลัง
 * ควรทำ caching ใน roomsService หรือย้าย state ขึ้นไปที่ context แทน
 */
export default function RoomSearchPanel({ onSelectRoom }: RoomSearchPanelProps) {
  const { rooms, loading, error } = useRooms()
  const [query, setQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(DEFAULT_CATEGORY_KEY)

  const results = useMemo(
    () => filterRooms(rooms, query, categoryKey),
    [rooms, query, categoryKey]
  )

  return (
    <div className="w-full max-w-sm max-h-[85vh] space-y-3 overflow-y-auto rounded-3xl bg-white/95 p-3 shadow-xl backdrop-blur">
      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter value={categoryKey} onChange={setCategoryKey} />
      <SearchResultList
        rooms={results}
        loading={loading}
        error={error}
        onSelectRoom={onSelectRoom}
      />
    </div>
  )
}
