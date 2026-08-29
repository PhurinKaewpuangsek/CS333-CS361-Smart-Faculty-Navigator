import type { Landmark } from '../types/room.ts'

/**
 * ฟังก์ชันแปลงข้อมูลห้อง (Room) เป็นข้อความภาษาไทยที่อ่านง่าย
 * แยกออกมาจาก UI component เพื่อให้ทดสอบได้ตรงๆ ด้วย node:test (ไม่ต้องพึ่ง DOM)
 * และใช้ซ้ำได้ทั้งใน RoomDetailModal, Search Result, หรือจุดอื่นๆ ในอนาคต
 */

const BUILDING_NAMES_TH: Record<string, string> = {
  BR3: 'อาคาร บร.3',
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
  utility: 'ห้องระบบอาคาร',
  department_office: 'สำนักงานภาควิชา',
  meeting_room: 'ห้องประชุม',
  toilet: 'ห้องน้ำ',
  stairs: 'บันได',
  unknown: 'ไม่ระบุประเภท',
}

/** ชื่อประเภทจุดสังเกต  */
const LANDMARK_KIND_LABELS_TH: Record<string, string> = {
  near_toilet: 'ใกล้ห้องน้ำ',
  near_stairs: 'ใกล้บันได',
}

export function getBuildingLabel(buildingCode: string): string {
  if (!buildingCode) return 'ไม่ระบุอาคาร'
  return BUILDING_NAMES_TH[buildingCode] ?? buildingCode
}

export function getCategoryLabel(category: string): string {
  if (!category) return CATEGORY_LABELS_TH.unknown
  return CATEGORY_LABELS_TH[category] ?? category
}

export function getLandmarkText(landmark: Landmark): string {
  if (landmark.text_th) return landmark.text_th
  const kindLabel = LANDMARK_KIND_LABELS_TH[landmark.kind] ?? landmark.kind ?? 'จุดสังเกต'
  if (typeof landmark.walk_hops === 'number') {
    return `${kindLabel} (ประมาณ ${landmark.walk_hops} ช่วงเดิน)`
  }
  return kindLabel
}
