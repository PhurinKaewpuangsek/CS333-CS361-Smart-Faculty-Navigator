import type { Room } from '../types/room.ts'

export interface CategoryFilterOption {
  /** ค่าที่ใช้อ้างอิงปุ่มนี้ภายในแอป (ส่งเข้า filterRooms เป็นพารามิเตอร์ category) */
  key: string
  /** ข้อความไทยที่แสดงบนปุ่ม filter */
  label: string
  /**
   * ค่า Room['category'] จริงจาก rooms.json ที่ปุ่มนี้ครอบคลุม
   * อาร์เรย์ว่าง = ไม่กรอง (ใช้กับปุ่ม "ทั้งหมด")
   *
   * หมายเหตุ: การจัดกลุ่มรอบแรกนี้อิงจากค่า category จริงที่สำรวจเจอใน
   * rooms.json (issue #25 บอกไว้ว่าปรับส่วน filter ได้) ได้แก่
   * faculty_office, laboratory, lecture_room, toilet, stairs,
   * seminar_room, storage, research_room, unknown, utility,
   * department_office, student_room, staff_room, service_room,
   * meeting_room — ถ้าทีมอยากจัดกลุ่มใหม่ แก้ไขแค่ CATEGORY_FILTERS
   * ด้านล่างนี้ ไม่ต้องแตะ filterRooms() หรือ UI component ใดๆ
   */
  matchCategories: string[]
}

export const CATEGORY_FILTERS: CategoryFilterOption[] = [
  {
    key: 'all',
    label: 'ทั้งหมด',
    matchCategories: [],
  },
  {
    key: 'lecture_room',
    label: 'ห้องบรรยาย',
    matchCategories: ['lecture_room'],
  },
  {
    key: 'seminar_room',
    label: 'ห้องสัมมนา',
    matchCategories: ['seminar_room'],
  },
  {
    key: 'meeting_room',
    label: 'ห้องประชุม',
    matchCategories: ['meeting_room'],
  },
  {
    key: 'research_room',
    label: 'ห้องวิจัย',
    matchCategories: ['research_room'],
  },
  {
    key: 'laboratory',
    label: 'ห้องปฏิบัติการ',
    matchCategories: ['laboratory', 'lab'],
  },
  {
    key: 'office',
    label: 'สำนักงาน / ห้องพักอาจารย์',
    matchCategories: ['faculty_office', 'department_office', 'staff_room'],
  },
  {
    key: 'facility',
    label: 'สิ่งอำนวยความสะดวก',
    matchCategories: [
      'toilet',
      'stairs',
      'utility',
      'storage',
      'service_room',
      'student_room',
      'unknown',
    ],
  },
]

export const DEFAULT_CATEGORY_KEY = CATEGORY_FILTERS[0].key

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function roomMatchesQuery(room: Room, normalizedQuery: string): boolean {
  if (normalizedQuery === '') return true

  if (normalize(room.code).includes(normalizedQuery)) return true
  if (normalize(room.nameThai).includes(normalizedQuery)) return true

  return room.aliases.some((alias) => normalize(alias).includes(normalizedQuery))
}

function roomMatchesCategory(room: Room, categoryKey: string): boolean {
  if (categoryKey === DEFAULT_CATEGORY_KEY) return true

  const option = CATEGORY_FILTERS.find((filter) => filter.key === categoryKey)
  if (!option || option.matchCategories.length === 0) return true

  return option.matchCategories.includes(room.category)
}

/**
 * กรองห้องจาก query (ค้นหาแบบ case-insensitive ใน code, nameThai, aliases)
 * และ category (key จาก CATEGORY_FILTERS ด้านบน)
 *
 * Pure function — ไม่แตะ state หรือ side effect ใดๆ จึงเทสได้ตรงไปตรงมา
 */
export function filterRooms(rooms: Room[], query: string, category: string): Room[] {
  const normalizedQuery = normalize(query)

  return rooms.filter(
    (room) => roomMatchesQuery(room, normalizedQuery) && roomMatchesCategory(room, category)
  )
}
