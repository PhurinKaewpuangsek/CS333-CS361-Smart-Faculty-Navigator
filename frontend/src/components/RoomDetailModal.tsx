import { useEffect, useState } from 'react'
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react'
import {
  MapPin,
  BookOpen,
  Flask,
  Briefcase,
  Toilet,
  Gear,
  Package,
  Bell,
  Users,
  ChalkboardTeacher,
  X,
  Atom,
} from '@phosphor-icons/react'
import { getBuildingLabel, getCategoryLabel, getLandmarkText, getCategoryColor } from '../services/roomDisplay.ts'

import type { Room } from '../types/room.ts'

export interface RoomDetailModalProps {
  rooms: Room[]
  loading?: boolean
  error?: Error | null
  /** id ของห้องที่ถูกเลือก (มาจาก Search Result หรือ Map Marker Click) — null = ปิด Modal */
  selectedRoomId: string | null
  onClose: () => void
}

/** ระยะลาก (px) ที่ต้องลากลงเกินก่อนจะถือว่าผู้ใช้ต้องการปิด Modal ด้วย Gesture */
const DRAG_TO_CLOSE_THRESHOLD = 96

function renderCategoryIcon(category: string): ReactNode {
  const key = (category || '').toLowerCase()
  if (key.includes('lab')) return <Flask size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('lecture')) return <BookOpen size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('seminar')) return <ChalkboardTeacher size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('office')) return <Briefcase size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('toilet') || key.includes('restroom')) return <Toilet size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('student') || key.includes('meeting') || key.includes('staff')) return <Users size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('research')) return <Atom size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('utility')) return <Gear size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('storage')) return <Package size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  if (key.includes('service')) return <Bell size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
  return <MapPin size={16} weight="duotone" className="text-current shrink-0" aria-hidden="true" />
}

export function RoomDetailModal({
  rooms,
  loading = false,
  error = null,
  selectedRoomId,
  onClose,
}: RoomDetailModalProps) {
  const [drag, setDrag] = useState<{ startY: number | null; offset: number }>({
    startY: null,
    offset: 0,
  })

  // reset ตอนเปลี่ยนห้อง — ทำตอน render แทน useEffect
  const [prevRoomId, setPrevRoomId] = useState(selectedRoomId)
  if (prevRoomId !== selectedRoomId) {
    setPrevRoomId(selectedRoomId)
    setDrag({ startY: null, offset: 0 })
  }

  const isOpen = selectedRoomId !== null
  const room: Room | undefined = isOpen
    ? rooms.find((r) => r.id === selectedRoomId)
    : undefined

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    setDrag({ startY: event.clientY, offset: 0 })
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    setDrag((current) => {
      if (current.startY === null) return current
      const delta = event.clientY - current.startY
      return delta > 0 ? { ...current, offset: delta } : current
    })
  }

  function handlePointerUp() {
    if (drag.offset > DRAG_TO_CLOSE_THRESHOLD) onClose()
    setDrag({ startY: null, offset: 0 })
  }

  const landmarks = room?.landmarks ?? []
  const hasLandmarks = landmarks.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none sm:justify-end sm:items-start sm:p-4">
      {/* Backdrop (Mobile only) — แตะเพื่อปิด โดยไม่ทำให้หน้าจอมืด */}
      <div
        data-testid="room-modal-backdrop"
        className="absolute inset-0 bg-transparent pointer-events-auto sm:hidden"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Sheet / Side Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        className="pointer-events-auto relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-h-[calc(100vh-2rem)] sm:w-96 sm:rounded-3xl sm:border sm:border-slate-100"
        style={{
          transform: drag.offset > 0 ? `translateY(${drag.offset}px)` : undefined,
          transition: drag.startY === null ? 'transform 150ms ease-out' : 'none',
        }}
      >
        {/* แถบจับลาก + ปุ่มปิด */}
        <div
          className="sticky top-0 z-10 flex shrink-0 touch-none flex-col items-center bg-white pb-1 pt-2 sm:pt-4 sm:pb-2 sm:items-end sm:px-4"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="h-1.5 w-10 rounded-full bg-gray-300 sm:hidden" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างรายละเอียดห้อง"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors sm:static"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* เนื้อหา */}
        <div className="overflow-y-auto px-5 pb-8 pt-2">
          {loading && (
            <p className="py-6 text-center text-sm text-gray-500">กำลังโหลดข้อมูลห้อง...</p>
          )}

          {!loading && error && (
            <p className="py-6 text-center text-sm text-red-600">
              เกิดข้อผิดพลาดในการโหลดข้อมูลห้อง: {error.message}
            </p>
          )}

          {!loading && !error && !room && (
            <p className="py-6 text-center text-sm text-gray-500">ไม่พบข้อมูลห้องนี้</p>
          )}

          {!loading && !error && room && (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                {getBuildingLabel(room.building)} · ชั้น {room.floor}
              </p>

              <h2 id="room-modal-title" className="mt-1 text-xl font-semibold text-gray-900">
                {room.nameThai || 'ไม่ระบุชื่อห้อง'}
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                ห้อง {room.roomNumber || room.code || '-'}
                {room.code ? ` (${room.code})` : ''}
              </p>

              {(() => {
                const color = getCategoryColor(room.category)
                return (
                  <span
                    className={`mt-3 inline-flex items-center gap-1.5 w-fit rounded-full border ${color.border} ${color.bg} px-3 py-1 text-xs font-medium ${color.text} shadow-sm`}
                  >
                    {renderCategoryIcon(room.category)}
                    <span>{getCategoryLabel(room.category)}</span>
                  </span>
                )
              })()}


              <div className="mt-5 border-t border-gray-100 pt-4">
                <h3 className="text-sm font-semibold text-gray-800">จุดสังเกตใกล้เคียง</h3>

                {hasLandmarks ? (
                  <ul className="mt-2 space-y-2">
                    {landmarks.map((landmark, index) => (
                      <li
                        key={`${landmark.kind}-${landmark.ref_location_id ?? index}`}
                        className="flex items-start gap-2 text-sm text-gray-700"
                      >
                        <MapPin size={16} weight="fill" className="text-red-500 shrink-0 mt-0.5" aria-hidden="true" />
                        <span>{getLandmarkText(landmark)}</span>
                      </li>
                    ))}
                  </ul>

                ) : (
                  <p className="mt-2 text-sm text-gray-400">
                    ยังไม่มีข้อมูลจุดสังเกตสำหรับห้องนี้
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomDetailModal


