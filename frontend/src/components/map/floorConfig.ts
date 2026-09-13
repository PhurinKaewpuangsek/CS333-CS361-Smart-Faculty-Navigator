export interface LegendEntry {
  /** A room fill used in the floor-plan artwork. */
  fill: string
  label: string
}

export interface FloorConfig {
  floor: number
  label: string
  asset: string
  width: number
  height: number
  /** What the artwork's room colours mean — only the colours this floor actually uses. */
  legend: LegendEntry[]
}

/** The artwork's department colour key, as printed in the original floor-1 legend. */
const COMMON_AREA: LegendEntry = { fill: '#F5CAAB', label: 'พื้นที่ส่วนกลาง' }
const MATH_STAT: LegendEntry = { fill: '#BFD8EB', label: 'ภาควิชาคณิตศาสตร์และสถิติ' }
const ENV_SCIENCE: LegendEntry = { fill: '#CBE6D8', label: 'ภาควิชาวิทยาศาสตร์สิ่งแวดล้อม' }
const PHYSICS: LegendEntry = { fill: '#F0E3EB', label: 'ภาควิชาฟิสิกส์' }

export const FLOOR_CONFIGS: FloorConfig[] = [
  {
    floor: 1,
    label: '1st Floor',
    asset: '/maps/lc3/floor-1.svg',
    width: 1217,
    height: 742,
    legend: [COMMON_AREA, MATH_STAT, ENV_SCIENCE, PHYSICS],
  },
  {
    floor: 2,
    label: '2nd Floor',
    asset: '/maps/lc3/floor-2.svg',
    width: 1070,
    height: 528,
    legend: [COMMON_AREA, MATH_STAT, ENV_SCIENCE],
  },
]

export function getFloorConfig(floor: number): FloorConfig {
  const config = FLOOR_CONFIGS.find((entry) => entry.floor === floor)
  if (!config) {
    throw new Error(`No floor configuration found for floor ${floor}`)
  }
  return config
}
