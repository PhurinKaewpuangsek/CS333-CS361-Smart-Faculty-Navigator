import { describe, it } from 'node:test'
import assert from 'node:assert'
import { filterRooms } from '../filterRooms.ts'
import type { Room } from '../../types/room.ts'

function makeRoom(overrides: Partial<Room>): Room {
  return {
    id: 'BR3-F1-R000',
    code: 'BR3-000',
    nameThai: 'ห้องทดสอบ',
    building: 'BR3',
    floor: 1,
    roomNumber: '000',
    category: 'lecture_room',
    coordinates: { x: 0, y: 0 },
    landmarks: [],
    aliases: [],
    ...overrides,
  }
}

const sampleRooms: Room[] = [
  makeRoom({
    id: 'BR3-F1-R101',
    code: 'BR3-101',
    nameThai: 'ห้องบรรยาย 1',
    category: 'lecture_room',
    aliases: ['LC3-101', '101'],
  }),
  makeRoom({
    id: 'BR3-F1-R102',
    code: 'BR3-102',
    nameThai: 'ห้องปฏิบัติการเคมี',
    category: 'laboratory',
    aliases: ['LC3-102', '102'],
  }),
  makeRoom({
    id: 'BR3-F1-PLMTOILET',
    code: '',
    nameThai: 'ห้องน้ำชาย (ฝั่งซ้าย)',
    category: 'toilet',
    aliases: [],
  }),
]

describe('filterRooms()', () => {
  it('returns every room when query is empty and category is "all"', () => {
    const result = filterRooms(sampleRooms, '', 'all')
    assert.strictEqual(result.length, sampleRooms.length)
  })

  it('matches by room code, case-insensitively', () => {
    const result = filterRooms(sampleRooms, 'br3-101', 'all')
    assert.deepStrictEqual(
      result.map((room) => room.id),
      ['BR3-F1-R101']
    )
  })

  it('matches by Thai room name', () => {
    const result = filterRooms(sampleRooms, 'เคมี', 'all')
    assert.deepStrictEqual(
      result.map((room) => room.id),
      ['BR3-F1-R102']
    )
  })

  it('matches by alias', () => {
    const result = filterRooms(sampleRooms, 'lc3-102', 'all')
    assert.deepStrictEqual(
      result.map((room) => room.id),
      ['BR3-F1-R102']
    )
  })

  it('filters by category key alone', () => {
    const result = filterRooms(sampleRooms, '', 'laboratory')
    assert.deepStrictEqual(
      result.map((room) => room.id),
      ['BR3-F1-R102']
    )
  })

  it('combines a text query with a category filter', () => {
    const matching = filterRooms(sampleRooms, '102', 'laboratory')
    assert.deepStrictEqual(
      matching.map((room) => room.id),
      ['BR3-F1-R102']
    )

    const mismatchedCategory = filterRooms(sampleRooms, '102', 'lecture_room')
    assert.deepStrictEqual(mismatchedCategory, [])
  })

  it('returns an empty array when nothing matches the query', () => {
    const result = filterRooms(sampleRooms, 'ไม่มีห้องนี้แน่นอน', 'all')
    assert.deepStrictEqual(result, [])
  })

  it('trims whitespace around the query', () => {
    const result = filterRooms(sampleRooms, '  Br3-101  ', 'all')
    assert.deepStrictEqual(
      result.map((room) => room.id),
      ['BR3-F1-R101']
    )
  })

  it('treats an unknown category key as "no filter"', () => {
    const result = filterRooms(sampleRooms, '', 'this-key-does-not-exist')
    assert.strictEqual(result.length, sampleRooms.length)
  })
})
