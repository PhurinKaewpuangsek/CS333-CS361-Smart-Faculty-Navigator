import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getBuildingLabel, getCategoryLabel, getLandmarkText, getCategoryColor } from '../roomDisplay.ts'

describe('getBuildingLabel', () => {
  it('แปลงรหัสอาคารที่รู้จัก (BR3) เป็นชื่อภาษาไทย', () => {
    assert.equal(getBuildingLabel('BR3'), 'อาคาร บร.3')
  })

  it('คืนรหัสเดิมเมื่อเป็นอาคารที่ยังไม่มีชื่อแปลไว้', () => {
    assert.equal(getBuildingLabel('XX9'), 'XX9')
  })

  it('คืนข้อความ fallback เมื่อไม่มีรหัสอาคาร', () => {
    assert.equal(getBuildingLabel(''), 'ไม่ระบุอาคาร')
  })
})

describe('getCategoryLabel', () => {
  it('แปล category เป็นชื่อภาษาไทยที่อ่านง่าย', () => {
    assert.equal(getCategoryLabel('faculty_office'), 'ห้องพักอาจารย์')
    assert.equal(getCategoryLabel('laboratory'), 'ห้องปฏิบัติการ')
    assert.equal(getCategoryLabel('toilet'), 'ห้องน้ำ')
  })

  it('คืนค่าเดิมเมื่อ category ไม่อยู่ใน mapping', () => {
    assert.equal(getCategoryLabel('some_new_category'), 'some_new_category')
  })

  it('คืนข้อความ "ไม่ระบุประเภท" เมื่อ category ว่างเปล่า', () => {
    assert.equal(getCategoryLabel(''), 'ไม่ระบุประเภท')
  })
})

describe('getCategoryColor', () => {
  it('คืนค่าสีที่ถูกต้องตามหมวดหมู่', () => {
    const lectureColor = getCategoryColor('lecture_room')
    assert.equal(lectureColor.bg, 'bg-violet-100')
    assert.equal(lectureColor.text, 'text-violet-700')

    const seminarColor = getCategoryColor('seminar_room')
    assert.equal(seminarColor.bg, 'bg-fuchsia-100')
    assert.equal(seminarColor.text, 'text-fuchsia-700')

    const meetingColor = getCategoryColor('meeting_room')
    assert.equal(meetingColor.bg, 'bg-teal-100')
    assert.equal(meetingColor.text, 'text-teal-700')

    const researchColor = getCategoryColor('research_room')
    assert.equal(researchColor.bg, 'bg-emerald-100')
    assert.equal(researchColor.text, 'text-emerald-700')

    const labColor = getCategoryColor('laboratory')
    assert.equal(labColor.bg, 'bg-lime-100')
    assert.equal(labColor.text, 'text-lime-700')

    const officeColor = getCategoryColor('faculty_office')
    assert.equal(officeColor.bg, 'bg-amber-100')
    assert.equal(officeColor.text, 'text-amber-700')

    const facilityColor = getCategoryColor('toilet')
    assert.equal(facilityColor.bg, 'bg-slate-100')
    assert.equal(facilityColor.text, 'text-slate-600')
  })

  it('คืนค่าสี fallback สำหรับหมวดหมู่ที่ไม่รู้จัก', () => {
    const fallbackColor = getCategoryColor('unknown_custom')
    assert.equal(fallbackColor.bg, 'bg-slate-100')
    assert.equal(fallbackColor.text, 'text-slate-600')
  })
})

describe('getLandmarkText', () => {
  it('ใช้ text_th ตรงๆ เมื่อ data มีให้อยู่แล้ว', () => {
    const text = getLandmarkText({
      kind: 'near_toilet',
      text_th: 'ใกล้ห้องน้ำหญิง (ฝั่งขวา)',
    })
    assert.equal(text, 'ใกล้ห้องน้ำหญิง (ฝั่งขวา)')
  })

  it('สร้างข้อความ fallback จาก kind + walk_hops เมื่อไม่มี text_th', () => {
    const text = getLandmarkText({ kind: 'near_stairs', walk_hops: 7 })
    assert.equal(text, 'ใกล้บันได (ประมาณ 7 ช่วงเดิน)')
  })

  it('ไม่ใส่จำนวนช่วงเดินเมื่อไม่มี walk_hops', () => {
    const text = getLandmarkText({ kind: 'near_toilet' })
    assert.equal(text, 'ใกล้ห้องน้ำ')
  })

  it('ใช้ kind ดิบเป็น fallback เมื่อ kind ไม่อยู่ใน mapping', () => {
    const text = getLandmarkText({ kind: 'near_elevator', walk_hops: 2 })
    assert.equal(text, 'near_elevator (ประมาณ 2 ช่วงเดิน)')
  })
})

