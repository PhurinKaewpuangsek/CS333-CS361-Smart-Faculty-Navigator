import { useMemo, useState } from 'react'
import { filterRooms, DEFAULT_CATEGORY_KEY } from '../services/filterRooms.ts'
import SearchBar from './SearchBar.tsx'
import CategoryFilter from './CategoryFilter.tsx'
import SearchResultList from './SearchResultList.tsx'
import type { Room } from '../types/room.ts'

export interface RoomSearchPanelProps {
  rooms: Room[]
  loading?: boolean
  error?: Error | null
  /** ยิง event ออกไปเมื่อผู้ใช้กดเลือกห้องจากผลลัพธ์ ให้ parent ไปปักหมุด SVG / เปิด Room Detail Modal ต่อ */
  onSelectRoom: (roomId: string) => void
}

/**
 * Search & Filter Component — floating overlay บนแผนที่
 * รับข้อมูล rooms, loading, error จาก App.tsx และซ่อนผลลัพธ์เมื่อไม่มีการค้นหา
 */
export default function RoomSearchPanel({
  rooms,
  loading = false,
  error = null,
  onSelectRoom,
}: RoomSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(DEFAULT_CATEGORY_KEY)

  const isSearchActive = query.trim() !== '' || categoryKey !== DEFAULT_CATEGORY_KEY

  const results = useMemo(
    () => (isSearchActive ? filterRooms(rooms, query, categoryKey) : []),
    [rooms, query, categoryKey, isSearchActive]
  )

  return (
    <div className="w-full max-w-sm space-y-3 rounded-3xl bg-white/95 p-3 shadow-xl backdrop-blur">
      <SearchBar value={query} onChange={setQuery} />
      <CategoryFilter value={categoryKey} onChange={setCategoryKey} />
      {isSearchActive && (
        <SearchResultList
          rooms={results}
          loading={loading}
          error={error}
          onSelectRoom={onSelectRoom}
        />
      )}
    </div>
  )
}

