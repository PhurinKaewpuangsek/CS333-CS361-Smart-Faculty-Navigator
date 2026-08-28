import type { FloorConfig } from './floorConfig'

export interface FloorPlanSvgProps {
  floorConfig: FloorConfig
}

function FloorPlanSvg({ floorConfig }: FloorPlanSvgProps) {
  return (
    <img
      src={floorConfig.asset}
      alt={`Floor plan: ${floorConfig.label}`}
      width={floorConfig.width}
      height={floorConfig.height}
      draggable={false}
    />
  )
}

export default FloorPlanSvg
