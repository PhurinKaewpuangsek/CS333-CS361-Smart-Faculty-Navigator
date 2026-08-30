import { useMemo, useState, useRef, useEffect } from 'react'
import type { KeyboardEvent } from 'react'
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
 * รับข้อมูล rooms, loading, error จาก App.tsx
 * ควบคุมการเปิด/ปิด dropdown ผลลัพธ์ และซ่อน dropdown อัตโนมัติเมื่อเลือกห้อง
 */
export default function RoomSearchPanel({
  rooms,
  loading = false,
  error = null,
  onSelectRoom,
}: RoomSearchPanelProps) {
  const [query, setQuery] = useState('')
  const [categoryKey, setCategoryKey] = useState(DEFAULT_CATEGORY_KEY)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isFilterExpanded, setIsFilterExpanded] = useState(true)

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const hasActiveFilter = categoryKey !== DEFAULT_CATEGORY_KEY
  const hasActiveQueryOrFilter = query.trim() !== '' || hasActiveFilter

  const results = useMemo(
    () => (hasActiveQueryOrFilter ? filterRooms(rooms, query, categoryKey) : []),
    [rooms, query, categoryKey, hasActiveQueryOrFilter]
  )

  const showDropdown = isDropdownOpen && hasActiveQueryOrFilter

  function handleQueryChange(newQuery: string) {
    setQuery(newQuery)
    setIsDropdownOpen(true)
  }

  function handleCategoryChange(newCategoryKey: string) {
    setCategoryKey(newCategoryKey)
    setIsDropdownOpen(true)
  }

  function handleSelect(roomId: string) {
    // 1. Immediately hide the search results dropdown
    setIsDropdownOpen(false)
    // 2. Dismiss mobile virtual keyboard
    inputRef.current?.blur()
    // 3. Keep existing query intact (do not clear query)
    // 4. Trigger room selection
    onSelectRoom(roomId)
  }

  function handleInputFocus() {
    setIsDropdownOpen(true)
  }

  function handleInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') {
      setIsDropdownOpen(false)
      inputRef.current?.blur()
    }
  }

  useEffect(() => {
    function handlePointerDownOutside(event: MouseEvent | TouchEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDropdownOpen(false)
        inputRef.current?.blur()
      }
    }

    document.addEventListener('mousedown', handlePointerDownOutside)
    document.addEventListener('touchstart', handlePointerDownOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside)
      document.removeEventListener('touchstart', handlePointerDownOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div
      ref={panelRef}
      className="w-full max-w-sm space-y-3 rounded-3xl bg-white/95 px-4 py-4 shadow-2xl backdrop-blur-md border border-slate-100/80 transition-all duration-200"
    >
      <SearchBar
        inputRef={inputRef}
        value={query}
        onChange={handleQueryChange}
        onFocus={handleInputFocus}
        onKeyDown={handleInputKeyDown}
        isFilterOpen={isFilterExpanded}
        hasActiveFilter={hasActiveFilter}
        onToggleFilter={() => setIsFilterExpanded((prev) => !prev)}
      />
      <div
        className={`grid transition-[grid-template-rows,opacity] duration-300 ease-in-out ${
          isFilterExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
        }`}
      >
        <div className="overflow-hidden">
          <CategoryFilter value={categoryKey} onChange={handleCategoryChange} />
        </div>
      </div>
      {showDropdown && (
        <SearchResultList
          rooms={results}
          loading={loading}
          error={error}
          onSelectRoom={handleSelect}
        />
      )}
    </div>
  )
}


