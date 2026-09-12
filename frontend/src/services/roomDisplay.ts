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

/**
 * Hex equivalents of CATEGORY_COLORS, for the SVG floor-plan area tint.
 *
 * An SVG `fill` cannot take a Tailwind class, so the same families are repeated here as
 * literal colours. These are the 100-level tints on purpose: RoomAreas.tsx composites
 * them with `mix-blend-mode: multiply` over the white room interiors, which keeps the
 * black room numbers and wall strokes baked into the floor plan fully legible.
 *
 * The map artwork used to carry its own arbitrary fills (faculty_office was spread over
 * three of them); driving the colour from category here is what makes it mean something.
 */
export const CATEGORY_AREA_FILLS: Record<string, string> = {
  lecture_room: '#ede9fe', // violet-100
  seminar_room: '#fae8ff', // fuchsia-100
  meeting_room: '#ccfbf1', // teal-100
  research_room: '#d1fae5', // emerald-100
  laboratory: '#ecfccb', // lime-100
  lab: '#ecfccb',
  faculty_office: '#fef3c7', // amber-100
  department_office: '#fef3c7',
  staff_room: '#fef3c7',
  office: '#fef3c7',
}

/** slate-100 — matches DEFAULT_CATEGORY_COLOR for every unclassified space. */
export const DEFAULT_CATEGORY_AREA_FILL = '#f1f5f9'

/**
 * Categories shown in the map colour key, in reading order.
 *
 * One representative key per distinct colour — laboratory and lab share a tint, as do
 * the four office-ish categories, so listing all of them would repeat swatches. Anything
 * not covered here falls through to DEFAULT_CATEGORY_AREA_FILL, which the legend shows
 * as its final "other" row.
 */
export const AREA_LEGEND_CATEGORIES: readonly string[] = [
  'lecture_room',
  'seminar_room',
  'meeting_room',
  'research_room',
  'laboratory',
  'faculty_office',
]

export function getCategoryAreaFill(categoryKey?: string): string {
  if (!categoryKey) return DEFAULT_CATEGORY_AREA_FILL
  return CATEGORY_AREA_FILLS[categoryKey.toLowerCase()] ?? DEFAULT_CATEGORY_AREA_FILL
}

/**
 * Map-pin colours: the 600-level of the same families as CATEGORY_AREA_FILLS, dark
 * enough to carry a white icon and to read as label text over the floor plan.
 *
 * Keeps this file's colour rule — blue is reserved for the active filter and red for the
 * selected pin — so no category pin may be blue or red. Lime drops to 700 because
 * lime-600 is too light behind a white glyph.
 */
export const CATEGORY_PIN_COLORS: Record<string, string> = {
  lecture_room: '#7c3aed', // violet-600
  seminar_room: '#c026d3', // fuchsia-600
  meeting_room: '#0d9488', // teal-600
  research_room: '#059669', // emerald-600
  laboratory: '#4d7c0f', // lime-700
  lab: '#4d7c0f',
  faculty_office: '#d97706', // amber-600
  department_office: '#d97706',
  staff_room: '#d97706',
  office: '#d97706',
}

/** slate-600 — facilities (toilets, stairs) and anything unclassified. */
export const DEFAULT_CATEGORY_PIN_COLOR = '#475569'

export function getCategoryPinColor(categoryKey?: string): string {
  if (!categoryKey) return DEFAULT_CATEGORY_PIN_COLOR
  return CATEGORY_PIN_COLORS[categoryKey.toLowerCase()] ?? DEFAULT_CATEGORY_PIN_COLOR
}

export type RestroomGender = 'male' | 'female'

/**
 * Which restroom a POI is, read from its Thai name ("ห้องน้ำชาย (ฝั่งซ้าย)").
 * The map draws a different pictogram for each, so a student can tell them apart
 * without reading the label. Returns null when the name says neither.
 */
export function getRestroomGender(name?: string): RestroomGender | null {
  if (!name) return null
  if (name.includes('หญิง')) return 'female'
  if (name.includes('ชาย')) return 'male'
  return null
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
