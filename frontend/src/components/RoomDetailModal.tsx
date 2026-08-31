import { useEffect } from 'react'
import type { ReactNode } from 'react'
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
  /** id ของห้องที่ถูกเลือก (มาจาก Search Result หรือ Map Marker Click) */
  selectedRoomId: string | null
  /** ควบคุมการแสดงผล Modal — ถ้าไม่ระบุจะเปิดเมื่อ selectedRoomId !== null */
  isOpen?: boolean
  onClose: () => void
}

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
  isOpen: isOpenProp,
  onClose,
}: RoomDetailModalProps) {
  const isOpen =
    isOpenProp !== undefined
      ? isOpenProp && selectedRoomId !== null
      : selectedRoomId !== null
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

  const landmarks = room?.landmarks ?? []
  const hasLandmarks = landmarks.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center pointer-events-none sm:justify-end sm:items-start sm:p-4">
      {/* Modal Card: Bottom Sheet on Mobile, Floating Side Card on Desktop */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="room-modal-title"
        className="pointer-events-auto relative flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl animate-modal-mobile sm:animate-modal-desktop sm:max-h-[calc(100vh-2rem)] sm:w-96 sm:rounded-3xl sm:border sm:border-slate-100"
      >
        {/* Top Header with Close Button */}
        <div className="relative flex shrink-0 items-center justify-end bg-white px-5 pt-3 pb-1 sm:pt-4 sm:pb-2">
          <div className="h-1.5 w-10 rounded-full bg-slate-200 sm:hidden mx-auto absolute left-1/2 -translate-x-1/2 top-2" aria-hidden="true" />
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างรายละเอียดห้อง"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer"
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


