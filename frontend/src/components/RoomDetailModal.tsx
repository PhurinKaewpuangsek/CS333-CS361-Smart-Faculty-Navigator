import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
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
  PencilSimple,
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

  const isEditEnabled = import.meta.env.VITE_ENABLE_EDIT_MODE === 'true'
  const [isEditMode, setIsEditMode] = useState<boolean>(false)
  const [nameInput, setNameInput] = useState<string>('')
  const [capacityInput, setCapacityInput] = useState<string>('')
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Local overrides stored per room so changes persist when switching rooms and across refreshes
  const [roomOverrides, setRoomOverrides] = useState<Record<string, { name?: string; capacity?: number }>>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('torch_room_overrides') : null
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const [prevSelectedRoomId, setPrevSelectedRoomId] = useState<string | null>(selectedRoomId)
  if (selectedRoomId !== prevSelectedRoomId) {
    setPrevSelectedRoomId(selectedRoomId)
    setIsEditMode(false)
    setSaveError(null)
  }

  const currentOverride = room ? roomOverrides[room.id] : undefined
  const displayName = currentOverride?.name ?? room?.nameThai ?? ''
  const displayCapacity =
    currentOverride?.capacity !== undefined
      ? currentOverride.capacity
      : room?.capacity

  const handleCloseModal = () => {
    setIsEditMode(false)
    setSaveError(null)
    onClose()
  }

  const handleEnterEditMode = () => {
    if (!room) return
    setNameInput(displayName)
    setCapacityInput(displayCapacity !== undefined ? String(displayCapacity) : '')
    setSaveError(null)
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    setIsEditMode(false)
    setSaveError(null)
  }

  const handleSave = async (e?: FormEvent) => {
    if (e) e.preventDefault()
    if (!room) return

    setIsSaving(true)
    setSaveError(null)

    try {
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')
      const url = `${apiBaseUrl}/api/locations/${room.id}`

      const parsedCapacity =
        capacityInput.trim() !== '' ? Number(capacityInput) : undefined

      const payload: {
        name: string
        name_th: string
        nameThai: string
        capacity?: number
      } = {
        name: nameInput,
        name_th: nameInput,
        nameThai: nameInput,
        ...(parsedCapacity !== undefined && !isNaN(parsedCapacity)
          ? { capacity: parsedCapacity }
          : {}),
      }

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        let errorMsg = `Failed to save (${response.status})`
        try {
          const data = await response.json()
          if (data?.message) errorMsg = data.message
          else if (data?.error) errorMsg = data.error
        } catch {
          // fallback
        }
        throw new Error(errorMsg)
      }

      setRoomOverrides((prev) => {
        const next = {
          ...prev,
          [room.id]: {
            name: nameInput,
            capacity: parsedCapacity !== undefined && !isNaN(parsedCapacity) ? parsedCapacity : undefined,
          },
        }
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem('torch_room_overrides', JSON.stringify(next))
          }
        } catch {
          // ignore storage quota errors
        }
        return next
      })

      setIsEditMode(false)
    } catch (err) {
      setSaveError(
        err instanceof Error ? err.message : 'Failed to update room details'
      )
    } finally {
      setIsSaving(false)
    }
  }

  // ปิดด้วยปุ่ม Esc
  useEffect(() => {
    if (!isOpen) return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsEditMode(false)
        setSaveError(null)
        onClose()
      }
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
        {/* Top Header with Close Button and Edit Button */}
        <div className="relative flex shrink-0 items-center justify-between bg-white px-5 pt-3 pb-1 sm:pt-4 sm:pb-2">
          <div className="h-1.5 w-10 rounded-full bg-slate-200 sm:hidden mx-auto absolute left-1/2 -translate-x-1/2 top-2" aria-hidden="true" />
          
          <div className="flex items-center gap-2">
            {isEditEnabled && !isEditMode && room && !loading && !error && (
              <button
                type="button"
                onClick={handleEnterEditMode}
                aria-label="Edit room details"
                className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 active:bg-blue-200 transition-colors cursor-pointer"
              >
                <PencilSimple size={14} weight="bold" />
                <span>Edit</span>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={handleCloseModal}
            aria-label="ปิดหน้าต่างรายละเอียดห้อง"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 active:bg-slate-200 transition-colors cursor-pointer ml-auto"
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
            isEditMode ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-semibold text-gray-900">แก้ไขข้อมูลห้อง (Edit)</h3>
                  <span className="text-xs text-slate-500 font-mono">{room.code || room.roomNumber}</span>
                </div>

                {saveError && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                    {saveError}
                  </div>
                )}

                <div>
                  <label htmlFor="edit-room-name" className="block text-xs font-semibold text-gray-700 mb-1">
                    ชื่อห้อง
                  </label>
                  <input
                    id="edit-room-name"
                    name="name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="ระบุชื่อห้อง..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isSaving}
                  />
                </div>

                <div>
                  <label htmlFor="edit-room-capacity" className="block text-xs font-semibold text-gray-700 mb-1">
                    ความจุ (คน)
                  </label>
                  <input
                    id="edit-room-capacity"
                    name="capacity"
                    type="number"
                    min="0"
                    value={capacityInput}
                    onChange={(e) => setCapacityInput(e.target.value)}
                    placeholder="ระบุความจุห้อง..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-gray-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    disabled={isSaving}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            ) : (
              <>
                <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                  {getBuildingLabel(room.building)} · ชั้น {room.floor}
                </p>

                <h2 id="room-modal-title" className="mt-1 text-xl font-semibold text-gray-900">
                  {displayName || 'ไม่ระบุชื่อห้อง'}
                </h2>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-500">
                  <span>
                    ห้อง {room.roomNumber || room.code || '-'}
                    {room.code ? ` (${room.code})` : ''}
                  </span>
                  {displayCapacity !== undefined && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>ความจุ {displayCapacity} คน</span>
                    </>
                  )}
                </div>

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
            )
          )}
        </div>
      </div>
    </div>
  )
}

export default RoomDetailModal


