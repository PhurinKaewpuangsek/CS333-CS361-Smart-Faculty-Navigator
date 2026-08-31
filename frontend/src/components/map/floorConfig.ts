export interface FloorConfig {
  floor: number
  label: string
  asset: string
  width: number
  height: number
}

export const FLOOR_CONFIGS: FloorConfig[] = [
  { floor: 1, label: '1st Floor', asset: '/maps/lc3/floor-1.svg', width: 1217, height: 742 },
  { floor: 2, label: '2nd Floor', asset: '/maps/lc3/floor-2.svg', width: 1070, height: 528 },
]

export function getFloorConfig(floor: number): FloorConfig {
  const config = FLOOR_CONFIGS.find((entry) => entry.floor === floor)
  if (!config) {
    throw new Error(`No floor configuration found for floor ${floor}`)
  }
  return config
}
