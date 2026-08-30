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
      className="max-w-none max-h-none select-none pointer-events-none"
      style={{
        width: floorConfig.width,
        height: floorConfig.height,
        maxWidth: 'none',
        maxHeight: 'none',
        display: 'block',
      }}
      draggable={false}
    />
  )
}

export default FloorPlanSvg

