import type { Landmark } from '../types/room.ts'

/**
 * ฟังก์ชันแปลงข้อมูลห้อง (Room) เป็นข้อความภาษาไทยที่อ่านง่าย
 * แยกออกมาจาก UI component เพื่อให้ทดสอบได้ตรงๆ ด้วย node:test (ไม่ต้องพึ่ง DOM)
 * และใช้ซ้ำได้ทั้งใน RoomDetailModal, Search Result, หรือจุดอื่นๆ ในอนาคต
 */

const BUILDING_NAMES_TH: Record<string, string> = {
  LC3: 'อาคาร LC3',
}

const CATEGORY_LABELS_TH: Record<string, string> = {
  faculty_office: 'ห้องพักอาจารย์',
  lecture_room: 'ห้องบรรยาย',
  seminar_room: 'ห้องสัมมนา',
  student_room: 'ห้องนักศึกษา',
  staff_room: 'ห้องเจ้าหน้าที่',
  storage: 'ห้องเก็บของ',
  service_room: 'ห้องบริการ',
  research_room: 'ห้องวิจัย',
  laboratory: 'ห้องปฏิบัติการ',
  lab: 'ห้องปฏิบัติการ',
  utility: 'ห้องระบบอาคาร',
  department_office: 'สำนักงานภาควิชา',
  meeting_room: 'ห้องประชุม',
  toilet: 'ห้องน้ำ',
  stairs: 'บันได',
  unknown: 'ไม่ระบุประเภท',
}

/**
 * Shared color mapping for category pills and badges.
 * Applied consistently across search filters and room detail modal.
 *
 * Rules:
 * - Blue family is reserved exclusively for the active filter state.
 * - Red family is reserved exclusively for map pin & nearby landmark icons.
 */
export interface CategoryColorStyle {
  bg: string
  text: string
  border: string
}

export const CATEGORY_COLORS: Record<string, CategoryColorStyle> = {
  // ห้องบรรยาย -> bg-violet-100 text-violet-700
  lecture_room: { bg: 'bg-violet-100', text: 'text-violet-700', border: 'border-violet-200' },
  // ห้องสัมมนา -> bg-fuchsia-100 text-fuchsia-700
  seminar_room: { bg: 'bg-fuchsia-100', text: 'text-fuchsia-700', border: 'border-fuchsia-200' },
  // ห้องประชุม -> bg-teal-100 text-teal-700
  meeting_room: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
  // ห้องวิจัย -> bg-emerald-100 text-emerald-700
  research_room: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200' },
  // ห้องปฏิบัติการ -> bg-lime-100 text-lime-700
  laboratory: { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200' },
  lab: { bg: 'bg-lime-100', text: 'text-lime-700', border: 'border-lime-200' },
  // สำนักงาน / ห้องพักอาจารย์ -> bg-amber-100 text-amber-700
  faculty_office: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  department_office: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  staff_room: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  office: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  // สิ่งอำนวยความสะดวก -> bg-slate-100 text-slate-600
  toilet: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  stairs: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  utility: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  storage: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  service_room: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  student_room: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  unknown: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  facility: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  all: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
}

export const DEFAULT_CATEGORY_COLOR: CategoryColorStyle = {
  bg: 'bg-slate-100',
  text: 'text-slate-600',
  border: 'border-slate-200',
}

export function getCategoryColor(categoryKey?: string): CategoryColorStyle {
  if (!categoryKey) return DEFAULT_CATEGORY_COLOR
  const key = categoryKey.toLowerCase()
  return CATEGORY_COLORS[key] ?? DEFAULT_CATEGORY_COLOR
}




export function getBuildingLabel(buildingCode: string): string {
  if (!buildingCode) return 'ไม่ระบุอาคาร'
  return BUILDING_NAMES_TH[buildingCode] ?? buildingCode
}

export function getCategoryLabel(category: string): string {
  if (!category) return CATEGORY_LABELS_TH.unknown
  const key = category.toLowerCase()
  return CATEGORY_LABELS_TH[key] ?? CATEGORY_LABELS_TH[category] ?? category
}

/** ชื่อประเภทจุดสังเกต  */
const LANDMARK_KIND_LABELS_TH: Record<string, string> = {
  near_toilet: 'ใกล้ห้องน้ำ',
  near_stairs: 'ใกล้บันได',
}

export function getLandmarkText(landmark: Landmark): string {
  if (landmark.text_th) return landmark.text_th
  const kindLabel = LANDMARK_KIND_LABELS_TH[landmark.kind] ?? landmark.kind ?? 'จุดสังเกต'
  if (typeof landmark.walk_hops === 'number') {
    return `${kindLabel} (ประมาณ ${landmark.walk_hops} ช่วงเดิน)`
  }
  return kindLabel
}
