import { describe, it } from 'node:test'
import assert from 'node:assert'
import fs from 'node:fs'
import path from 'node:path'
import { normalizeRoom, getRooms } from '../roomsService.ts'
import type { RawRoomRecord, RoomsDataResponse } from '../../types/room.ts'

describe('roomsService - Data Access Layer', () => {
  const roomsJsonPath = path.resolve(process.cwd(), 'public/data/rooms.json')
  const rawData: RoomsDataResponse = JSON.parse(fs.readFileSync(roomsJsonPath, 'utf-8'))

  describe('normalizeRoom()', () => {
    it('correctly maps raw seed fields to Room interface', () => {
      const sampleRaw: RawRoomRecord = {
        location_id: 'BR3-F1-R101-1',
        building_code: 'BR3',
        floor: 1,
        location_kind: 'room',
        room_code: 'BR3-101/1',
        aliases: ['BR3-101/1', '101/1'],
        name_th: 'ห้องบรรยาย 4 (วิทยาศาสตร์สิ่งแวดล้อม)',
        category: 'lecture_room',
        x: 376,
        y: 152,
        landmarks: [
          {
            kind: 'near_toilet',
            ref_location_id: 'BR3-F1-PLMTOILET',
            walk_hops: 10,
            text_th: 'ใกล้ห้องน้ำชาย (ฝั่งซ้าย)',
            verification: 'derived_unverified',
          },
        ],
      }

      const room = normalizeRoom(sampleRaw)

      assert.strictEqual(room.id, 'LC3-F1-R101-1')
      assert.strictEqual(room.code, 'LC3-101/1')
      assert.strictEqual(room.nameThai, 'ห้องบรรยาย 4 (วิทยาศาสตร์สิ่งแวดล้อม)')
      assert.strictEqual(room.building, 'LC3')
      assert.strictEqual(room.floor, 1)
      assert.strictEqual(room.roomNumber, '101/1')
      assert.strictEqual(room.category, 'lecture_room')
      assert.deepStrictEqual(room.coordinates, { x: 376, y: 152 })
      assert.strictEqual(room.landmarks.length, 1)
      assert.deepStrictEqual(room.aliases, ['BR3-101/1', '101/1'])
    })

    it('handles POI records without room_code or landmarks gracefully', () => {
      const samplePoi: RawRoomRecord = {
        location_id: 'BR3-F1-PLFTOILET',
        building_code: 'BR3',
        floor: 1,
        location_kind: 'poi',
        room_code: '',
        aliases: [],
        name_th: 'ห้องน้ำหญิง (ฝั่งซ้าย)',
        category: 'toilet',
        x: 127,
        y: 356,
      }

      const room = normalizeRoom(samplePoi)

      assert.strictEqual(room.id, 'BR3-F1-PLFTOILET')
      assert.strictEqual(room.code, '')
      assert.strictEqual(room.nameThai, 'ห้องน้ำหญิง (ฝั่งซ้าย)')
      assert.strictEqual(room.building, 'BR3')
      assert.strictEqual(room.floor, 1)
      assert.strictEqual(room.roomNumber, '')
      assert.strictEqual(room.category, 'toilet')
      assert.deepStrictEqual(room.coordinates, { x: 127, y: 356 })
      assert.deepStrictEqual(room.landmarks, [])
      assert.deepStrictEqual(room.aliases, [])
    })

    it('normalizes all 131 records from rooms.json without any undefined fields', () => {
      assert.strictEqual(rawData.records.length, 131, 'rooms.json must contain 131 records')

      const normalizedRooms = rawData.records.map(normalizeRoom)
      assert.strictEqual(normalizedRooms.length, 131)

      const requiredKeys = [
        'id',
        'code',
        'nameThai',
        'building',
        'floor',
        'roomNumber',
        'category',
        'coordinates',
        'landmarks',
        'aliases',
      ] as const

      for (const [index, room] of normalizedRooms.entries()) {
        for (const key of requiredKeys) {
          assert.notStrictEqual(
            room[key],
            undefined,
            `Record at index ${index} (${room.id}) has undefined field: ${key}`
          )
        }
        assert.notStrictEqual(room.coordinates.x, undefined)
        assert.notStrictEqual(room.coordinates.y, undefined)
        assert.ok(Array.isArray(room.landmarks))
        assert.ok(Array.isArray(room.aliases))
      }
    })
  })

  describe('getRooms()', () => {
    it('fetches and returns 131 normalized rooms from data.records', async () => {
      const originalFetch = globalThis.fetch
      try {
        globalThis.fetch = async (input: RequestInfo | URL) => {
          assert.strictEqual(String(input), '/data/rooms.json')
          return {
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => rawData,
          } as Response
        }

        const rooms = await getRooms()
        assert.strictEqual(rooms.length, 131)
        assert.strictEqual(rooms[0].id, 'BR3-F1-PLFTOILET')
        assert.strictEqual(rooms[0].building, 'BR3')
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws an error when HTTP response is not ok', async () => {
      const originalFetch = globalThis.fetch
      try {
        globalThis.fetch = async () =>
          ({
            ok: false,
            status: 404,
            statusText: 'Not Found',
          }) as Response

        await assert.rejects(async () => {
          await getRooms()
        }, /Failed to fetch rooms: 404 Not Found/)
      } finally {
        globalThis.fetch = originalFetch
      }
    })

    it('throws an error when data does not have records array', async () => {
      const originalFetch = globalThis.fetch
      try {
        globalThis.fetch = async () =>
          ({
            ok: true,
            status: 200,
            statusText: 'OK',
            json: async () => ({ foo: 'bar' }),
          }) as Response

        await assert.rejects(async () => {
          await getRooms()
        }, /Invalid rooms data format: expected "records" array/)
      } finally {
        globalThis.fetch = originalFetch
      }
    })
  })
})
