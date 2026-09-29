/**
 * AdminPage — desktop-only split-panel admin UI for issue #81.
 *
 * Layout: left panel (room list / edit form + schedule list) | right panel (map, admin mode).
 * Route: /admin   — no link from public /map (security by obscurity for V2).
 *
 * State machine for left panel:
 *   'list'   → searchable room list (default)
 *   'room'   → room edit form + schedule list for selected room
 */
import { useState, useCallback } from 'react'
import { useRooms } from '../hooks/useRooms'
import { useSchedules } from '../hooks/useSchedules'
import { usePreloadImages } from '../hooks/usePreloadImages'
import MapContainer from './map/MapContainer'
import { FLOOR_CONFIGS } from './map/floorConfig'
import LoadingScreen from './LoadingScreen'
import type { Room } from '../types/room'
import type { ScheduleSlot } from '../types/schedule'
import {
  updateRoom,
  deleteRoom,
  createSchedule,
  updateSchedule,
  deleteSchedule,
} from '../services/adminService'

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const FLOOR_PLAN_ASSETS = FLOOR_CONFIGS.map((c) => c.asset)

// Simple search box
function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      type="search"
      placeholder="ค้นหาห้อง..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
    />
  )
}

// Room list item row
function RoomListItem({
  room,
  onSelect,
}: {
  room: Room
  onSelect: (roomId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(room.id)}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-100 active:bg-slate-200 transition-colors cursor-pointer"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-900">{room.nameThai || '(ไม่มีชื่อ)'}</p>
        <p className="text-xs text-slate-500">{room.code} · ชั้น {room.floor}</p>
      </div>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Schedule row inside the room edit view
// ---------------------------------------------------------------------------

interface ScheduleRowProps {
  slot: ScheduleSlot & { schedule_slot: string }
  onDelete: () => void
  onEdit: (updated: Partial<Pick<ScheduleSlot, 'dayOfWeek' | 'startTime' | 'eventCode' | 'endTime' | 'eventName' | 'eventType'>>) => void
}

function ScheduleRow({ slot, onDelete, onEdit }: ScheduleRowProps) {
  const [editing, setEditing] = useState(false)
  const [dayOfWeek, setDayOfWeek] = useState(slot.dayOfWeek)
  const [startTime, setStartTime] = useState(slot.startTime)
  const [eventCode, setEventCode] = useState(slot.eventCode)
  const [endTime, setEndTime] = useState(slot.endTime)
  const [eventName, setEventName] = useState(slot.eventName)
  const [eventType, setEventType] = useState(slot.eventType)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSave() {
    setSaving(true)
    setErr(null)
    try {
      await onEdit({ dayOfWeek, startTime, eventCode, endTime, eventName, eventType })
      setEditing(false)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 space-y-2">
        {err && <p className="text-xs text-red-600">{err}</p>}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">วัน</label>
            <select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">เริ่ม</label>
            <input
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="HH:MM"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">รหัสวิชา</label>
            <input
              type="text"
              value={eventCode}
              onChange={(e) => setEventCode(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อวิชา</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">สิ้นสุด</label>
            <input
              type="text"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="HH:MM"
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">ประเภท</label>
            <select
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="lecture">lecture</option>
              <option value="lab">lab</option>
              <option value="exam">exam</option>
              <option value="other">other</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={saving}
            className="rounded px-3 py-1 text-xs text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-100 px-3 py-2 text-xs">
      <div className="min-w-0 flex-1">
        <span className="font-mono text-slate-500">{slot.dayOfWeek} {slot.startTime}–{slot.endTime}</span>
        {' '}
        <span className="font-medium text-slate-800">{slot.eventCode}</span>
        {slot.eventName && <span className="text-slate-600"> · {slot.eventName}</span>}
      </div>
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="shrink-0 rounded px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 cursor-pointer"
      >
        แก้ไข
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="shrink-0 rounded px-2 py-0.5 text-xs text-red-600 hover:bg-red-50 cursor-pointer"
      >
        ลบ
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Create schedule inline form
// ---------------------------------------------------------------------------

interface CreateScheduleFormProps {
  roomCode: string
  onCreated: () => void
}

function CreateScheduleForm({ roomCode, onCreated }: CreateScheduleFormProps) {
  const [dayOfWeek, setDayOfWeek] = useState('MON')
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [eventCode, setEventCode] = useState('')
  const [eventName, setEventName] = useState('')
  const [eventType, setEventType] = useState('lecture')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setErr(null)
    try {
      await createSchedule({
        room_code: roomCode,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
        event_code: eventCode,
        event_name: eventName,
        event_type: eventType,
      })
      // Reset form
      setStartTime('')
      setEndTime('')
      setEventCode('')
      setEventName('')
      setEventType('lecture')
      onCreated()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">เพิ่มตารางสอนใหม่</h4>
      {err && <p className="text-xs text-red-600">{err}</p>}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">วัน <span className="text-red-500">*</span></label>
          <select
            value={dayOfWeek}
            onChange={(e) => setDayOfWeek(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">รหัสวิชา <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={eventCode}
            onChange={(e) => setEventCode(e.target.value)}
            placeholder="CS333"
            required
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">เริ่ม <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            placeholder="09:00"
            required
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">สิ้นสุด</label>
          <input
            type="text"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            placeholder="12:00"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">ชื่อวิชา</label>
          <input
            type="text"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="Computer Networks"
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">ประเภท</label>
          <select
            value={eventType}
            onChange={(e) => setEventType(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="lecture">lecture</option>
            <option value="lab">lab</option>
            <option value="exam">exam</option>
            <option value="other">other</option>
          </select>
        </div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
      >
        {saving ? 'กำลังเพิ่ม...' : '+ เพิ่มตารางสอน'}
      </button>
    </form>
  )
}

// ---------------------------------------------------------------------------
// Room edit panel (left panel when room is selected)
// ---------------------------------------------------------------------------

interface RoomEditPanelProps {
  room: Room
  schedules: ScheduleSlot[]
  onBack: () => void
  onRoomDeleted: () => void
  /** Called when room details change so the parent can reload */
  onRoomMutated: () => void
  /** Called when schedules change so the parent can reload */
  onSchedulesMutated: () => void
}

function RoomEditPanel({
  room,
  schedules,
  onBack,
  onRoomDeleted,
  onRoomMutated,
  onSchedulesMutated,
}: RoomEditPanelProps) {
  const [nameInput, setNameInput] = useState(room.nameThai)
  const [capacityInput, setCapacityInput] = useState(
    room.capacity !== undefined ? String(room.capacity) : '',
  )
  const [saving, setSaving] = useState(false)
  const [saveErr, setSaveErr] = useState<string | null>(null)
  const [saveOk, setSaveOk] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  // Build typed schedule slots with their DynamoDB composite key for this room
  const roomSchedules = schedules
    .filter((s) => s.roomCode === room.code)
    .map((s) => ({
      ...s,
      // Recompose schedule_slot from normalised fields (mirrors Lambda key format)
      schedule_slot: `${s.dayOfWeek}#${s.startTime}#${s.eventCode}`,
    }))

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveErr(null)
    setSaveOk(false)
    try {
      const parsed = capacityInput.trim() !== '' ? Number(capacityInput) : undefined
      await updateRoom(room.id, {
        name_th: nameInput,
        ...(parsed !== undefined && !isNaN(parsed) ? { capacity: parsed } : {}),
      })
      setSaveOk(true)
      onRoomMutated()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'เกิดข้อผิดพลาด')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteRoom(room.id)
      onRoomDeleted()
    } catch (e) {
      setSaveErr(e instanceof Error ? e.message : 'ลบไม่สำเร็จ')
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function handleScheduleEdit(
    slot: ScheduleSlot & { schedule_slot: string },
    updated: Partial<Pick<ScheduleSlot, 'dayOfWeek' | 'startTime' | 'eventCode' | 'endTime' | 'eventName' | 'eventType'>>,
  ) {
    await updateSchedule(room.code, slot.schedule_slot, {
      day_of_week: updated.dayOfWeek,
      start_time: updated.startTime,
      event_code: updated.eventCode,
      end_time: updated.endTime,
      event_name: updated.eventName,
      event_type: updated.eventType,
    })
    onSchedulesMutated()
  }

  async function handleScheduleDelete(slot: ScheduleSlot & { schedule_slot: string }) {
    await deleteSchedule(room.code, slot.schedule_slot)
    onSchedulesMutated()
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 cursor-pointer self-start"
      >
        ← กลับไปรายการ
      </button>

      {/* Room header */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
          {room.code} · ชั้น {room.floor}
        </p>
        <h2 className="mt-0.5 text-lg font-semibold text-slate-900">{room.nameThai || '(ไม่มีชื่อ)'}</h2>
      </div>

      {/* Current saved data */}
      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1">
        <p className="text-xs text-slate-500 mb-2">ข้อมูลปัจจุบันในระบบ:</p>
        <p className="text-sm font-medium text-slate-900">ชื่อ: {room.nameThai || '(ไม่มีชื่อ)'}</p>
        <p className="text-sm text-slate-700">ความจุ: {room.capacity !== undefined ? `${room.capacity} คน` : 'ไม่ได้ระบุ'}</p>
      </div>

      {/* Room edit form */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">แก้ไขข้อมูลห้อง</h3>
        <form onSubmit={handleSave} className="space-y-3">
          {saveErr && (
            <p className="rounded-lg bg-red-50 p-2 text-xs text-red-600 border border-red-200">
              {saveErr}
            </p>
          )}
          {saveOk && (
            <p className="rounded-lg bg-green-50 p-2 text-xs text-green-700 border border-green-200">
              บันทึกสำเร็จ
            </p>
          )}

          <div>
            <label htmlFor="admin-room-name" className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อห้อง (name_th)
            </label>
            <input
              id="admin-room-name"
              type="text"
              value={nameInput}
              onChange={(e) => {
                setNameInput(e.target.value)
                setSaveOk(false)
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          <div>
            <label htmlFor="admin-room-capacity" className="block text-xs font-medium text-slate-700 mb-1">
              ความจุ (คน)
            </label>
            <input
              id="admin-room-capacity"
              type="number"
              min="0"
              value={capacityInput}
              onChange={(e) => {
                setCapacityInput(e.target.value)
                setSaveOk(false)
              }}
              placeholder="ไม่ระบุ"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={saving}
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 cursor-pointer disabled:opacity-50"
          >
            {saving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลห้อง'}
          </button>
        </form>
      </section>

      {/* Delete room */}
      <section className="border-t border-red-100 pt-4">
        <h3 className="mb-2 text-sm font-semibold text-red-700">Danger Zone</h3>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 cursor-pointer"
          >
            ลบห้องนี้…
          </button>
        ) : (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-2">
            <p className="text-sm text-red-800 font-medium">
              ยืนยันการลบห้อง <span className="font-mono">{room.code}</span> ?
            </p>
            <p className="text-xs text-red-600">การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleting}
                className="rounded px-3 py-1.5 text-xs border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="rounded bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 cursor-pointer disabled:opacity-50"
              >
                {deleting ? 'กำลังลบ...' : 'ยืนยันลบ'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Schedule list */}
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          ตารางการใช้ห้อง ({roomSchedules.length})
        </h3>
        {roomSchedules.length === 0 ? (
          <p className="text-xs text-slate-400">ยังไม่มีตารางสอนสำหรับห้องนี้</p>
        ) : (
          <div className="space-y-1.5">
            {roomSchedules.map((slot) => (
              <ScheduleRow
                key={slot.schedule_slot}
                slot={slot}
                onDelete={() => handleScheduleDelete(slot)}
                onEdit={(updated) => handleScheduleEdit(slot, updated)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Create schedule form */}
      <CreateScheduleForm roomCode={room.code} onCreated={onSchedulesMutated} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// All-schedules secondary view
// ---------------------------------------------------------------------------

function AllSchedulesView({ 
  schedules, 
  rooms, 
  onSelectRoom 
}: { 
  schedules: ScheduleSlot[]
  rooms: Room[]
  onSelectRoom: (roomId: string) => void 
}) {
  const [search, setSearch] = useState('')
  const filtered = schedules.filter(
    (s) =>
      s.roomCode.toLowerCase().includes(search.toLowerCase()) ||
      s.eventCode.toLowerCase().includes(search.toLowerCase()) ||
      s.eventName.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex h-full flex-col gap-3">
      <h2 className="text-base font-semibold text-slate-800 shrink-0">ตารางทั้งหมด ({schedules.length})</h2>
      <div className="shrink-0">
        <SearchBox value={search} onChange={setSearch} />
      </div>
      <div className="flex-1 overflow-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50 sticky top-0 z-10">
            <tr>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-900">รหัสวิชา</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-900">ชื่อวิชา</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-900">วัน/เวลา</th>
              <th scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-900">ห้อง</th>
              <th scope="col" className="relative px-3 py-2"><span className="sr-only">จัดการ</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filtered.map((s, i) => {
              const room = rooms.find((r) => r.code === s.roomCode)
              return (
                <tr key={`${s.roomCode}-${s.dayOfWeek}-${s.startTime}-${s.eventCode}-${i}`} className="hover:bg-slate-50 transition-colors">
                  <td className="whitespace-nowrap px-3 py-2 text-xs font-medium text-slate-900">{s.eventCode}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-600">{s.eventName || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-500">{s.dayOfWeek} {s.startTime}-{s.endTime}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-900 font-mono">{s.roomCode}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right text-xs font-medium">
                    <button
                      type="button"
                      onClick={() => room && onSelectRoom(room.id)}
                      disabled={!room}
                      className="text-blue-600 hover:text-blue-900 disabled:opacity-50 cursor-pointer"
                    >
                      จัดการ →
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-4 text-center text-xs text-slate-400">ไม่พบตารางที่ตรงกับการค้นหา</p>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main AdminPage
// ---------------------------------------------------------------------------

type LeftPanelMode = 'list' | 'room'
type LeftTab = 'rooms' | 'schedules'

export default function AdminPage() {
  const { rooms, loading: roomsLoading, error: roomsError, reload: reloadRooms } = useRooms()
  const {
    schedules,
    loading: schedulesLoading,
    error: schedulesError,
    reload: reloadSchedules,
  } = useSchedules()
  const floorPlansReady = usePreloadImages(FLOOR_PLAN_ASSETS)

  const [panelMode, setPanelMode] = useState<LeftPanelMode>('list')
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [currentFloor, setCurrentFloor] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [leftTab, setLeftTab] = useState<LeftTab>('rooms')

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null

  const handleAdminSelectRoom = useCallback(
    (roomId: string) => {
      setSelectedRoomId(roomId)
      setPanelMode('room')
      const room = rooms.find((r) => r.id === roomId)
      if (room && room.floor !== currentFloor) {
        setCurrentFloor(room.floor)
      }
    },
    [rooms, currentFloor],
  )

  function handleBack() {
    setPanelMode('list')
    setSelectedRoomId(null)
  }

  function handleRoomDeleted() {
    setPanelMode('list')
    setSelectedRoomId(null)
    reloadRooms(true)
  }

  const filteredRooms = rooms.filter((r) => {
    const q = searchQuery.toLowerCase()
    return (
      r.code.toLowerCase().includes(q) ||
      r.nameThai.toLowerCase().includes(q) ||
      r.roomNumber.toLowerCase().includes(q)
    )
  })

  if (roomsError) {
    return (
      <LoadingScreen
        error={roomsError}
        onRetry={reloadRooms}
      />
    )
  }
  if (roomsLoading || !floorPlansReady) return <LoadingScreen />

  return (
    <div className="flex h-[100dvh] w-screen overflow-hidden bg-slate-100 font-sans">
      {/* ------------------------------------------------------------------ */}
      {/* Left panel                                                          */}
      {/* ------------------------------------------------------------------ */}
      <aside className="flex w-[380px] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white shadow-sm">
        {/* Header */}
        <div className="shrink-0 border-b border-slate-100 px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-sm font-bold text-slate-900 tracking-wide">TORCH Admin</h1>
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              Admin Mode
            </span>
          </div>
          {/* Tab switcher */}
          <div className="mt-2 flex gap-1 rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => { setLeftTab('rooms'); setPanelMode('list'); setSelectedRoomId(null) }}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors cursor-pointer ${
                leftTab === 'rooms'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ห้อง
            </button>
            <button
              type="button"
              onClick={() => setLeftTab('schedules')}
              className={`flex-1 rounded-md py-1 text-xs font-medium transition-colors cursor-pointer ${
                leftTab === 'schedules'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              ตารางทั้งหมด
            </button>
          </div>
        </div>

        {/* Panel content */}
        <div className="flex-1 overflow-y-auto p-4">
          {leftTab === 'schedules' ? (
            schedulesLoading ? (
              <p className="text-xs text-slate-400">กำลังโหลดตาราง...</p>
            ) : schedulesError ? (
              <p className="text-xs text-red-500">โหลดตารางไม่สำเร็จ</p>
            ) : (
              <AllSchedulesView schedules={schedules} rooms={rooms} onSelectRoom={handleAdminSelectRoom} />
            )
          ) : panelMode === 'list' ? (
            /* Room list */
            <div className="flex flex-col gap-3">
              <h2 className="text-base font-semibold text-slate-800">ห้องทั้งหมด ({rooms.length})</h2>
              <SearchBox value={searchQuery} onChange={setSearchQuery} />
              <div className="space-y-0.5">
                {filteredRooms.map((room) => (
                  <RoomListItem key={room.id} room={room} onSelect={handleAdminSelectRoom} />
                ))}
                {filteredRooms.length === 0 && (
                  <p className="text-xs text-slate-400">ไม่พบห้องที่ตรงกับการค้นหา</p>
                )}
              </div>
            </div>
          ) : selectedRoom ? (
            /* Room edit panel */
            <RoomEditPanel
              key={selectedRoom.id}
              room={selectedRoom}
              schedules={schedules}
              onBack={handleBack}
              onRoomDeleted={handleRoomDeleted}
              onRoomMutated={() => reloadRooms(true)}
              onSchedulesMutated={() => reloadSchedules(true)}
            />
          ) : null}
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* Right panel — Map (admin mode: clicking a marker selects for edit) */}
      {/* ------------------------------------------------------------------ */}
      <div className="relative flex-1 overflow-hidden">
        <MapContainer
          rooms={rooms}
          currentFloor={currentFloor}
          onFloorChange={setCurrentFloor}
          selectedRoomId={selectedRoomId}
          onSelectRoom={handleAdminSelectRoom}
          onClearSelection={() => {
            if (panelMode === 'room') {
              handleBack()
            }
          }}
          mode="admin"
        />
      </div>
    </div>
  )
}
