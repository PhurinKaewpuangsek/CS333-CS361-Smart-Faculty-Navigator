import { createElement } from 'react'
import { afterEach, describe, it } from 'node:test'
import assert from 'node:assert'
import { act, create, type ReactTestRenderer } from 'react-test-renderer'
import { useRooms, type UseRoomsResult } from '../useRooms.ts'

const reactTestEnvironment = globalThis as typeof globalThis & {
  IS_REACT_ACT_ENVIRONMENT: boolean
}

reactTestEnvironment.IS_REACT_ACT_ENVIRONMENT = true

let renderer: ReactTestRenderer | undefined
const originalFetch = globalThis.fetch

function createResponse(data: unknown): Response {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    json: async () => data,
  } as Response
}

async function flushUpdates(): Promise<void> {
  await Promise.resolve()
  await Promise.resolve()
}

async function renderUseRooms(): Promise<() => UseRoomsResult> {
  let latestResult: UseRoomsResult | undefined

  function HookProbe() {
    latestResult = useRooms()
    return null
  }

  await act(async () => {
    renderer = create(createElement(HookProbe))
    await flushUpdates()
  })

  return () => {
    assert.ok(latestResult, 'useRooms should return a result')
    return latestResult
  }
}

afterEach(async () => {
  globalThis.fetch = originalFetch

  if (renderer) {
    await act(async () => {
      renderer?.unmount()
    })
    renderer = undefined
  }
})

describe('useRooms()', () => {
  it('returns loading initially, then exposes normalized rooms', async () => {
    let resolveFetch: (response: Response) => void = () => undefined
    globalThis.fetch =
      (() =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        })) as typeof fetch

    const readResult = await renderUseRooms()
    assert.strictEqual(readResult().loading, true)
    assert.deepStrictEqual(readResult().rooms, [])
    assert.strictEqual(readResult().error, null)

    await act(async () => {
      resolveFetch(
        createResponse({
          records: [
            {
              location_id: 'LC3-F1-R101',
              room_code: 'LC3-101',
              name_th: 'ห้องบรรยาย 1',
              building_code: 'LC3',
              floor: 1,
              room_number: '101',
              category: 'lecture_room',
              x: 100,
              y: 200,
            },
          ],
        })
      )
      await flushUpdates()
    })

    assert.strictEqual(readResult().loading, false)
    assert.strictEqual(readResult().error, null)
    assert.deepStrictEqual(readResult().rooms, [
      {
        id: 'LC3-F1-R101',
        code: 'LC3-101',
        nameThai: 'ห้องบรรยาย 1',
        building: 'LC3',
        floor: 1,
        roomNumber: '101',
        category: 'lecture_room',
        coordinates: { x: 100, y: 200 },
        landmarks: [],
        aliases: [],
      },
    ])
  })

  it('returns an Error and clears loading when the request fails', async () => {
    let rejectFetch: (reason: Error) => void = () => undefined
    globalThis.fetch =
      (() =>
        new Promise<Response>((_, reject) => {
          rejectFetch = reject
        })) as typeof fetch

    const readResult = await renderUseRooms()

    await act(async () => {
      rejectFetch(new Error('Network unavailable'))
      await flushUpdates()
    })

    assert.strictEqual(readResult().loading, false)
    assert.deepStrictEqual(readResult().rooms, [])
    const error = readResult().error
    assert.ok(error instanceof Error)
    assert.strictEqual(error.message, 'Network unavailable')
  })
})
