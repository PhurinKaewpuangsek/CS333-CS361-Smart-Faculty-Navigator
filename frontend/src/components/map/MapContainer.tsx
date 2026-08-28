import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { Room } from '../../types/room'
import { FLOOR_CONFIGS, getFloorConfig } from './floorConfig'
import FloorPlanSvg from './FloorPlanSvg'
import RoomMarkers from './RoomMarkers'
import './MapContainer.css'

export interface MapContainerProps {
  rooms: Room[]
  currentFloor: number
  onFloorChange: (floor: number) => void
  selectedRoomId: string | null
  onSelectRoom: (roomId: string) => void
}

function MapContainer({
  rooms,
  currentFloor,
  onFloorChange,
  selectedRoomId,
  onSelectRoom,
}: MapContainerProps) {
  const floorConfig = getFloorConfig(currentFloor)

  return (
    <div>
      <div role="group" aria-label="Floor switcher">
        {FLOOR_CONFIGS.map((config) => (
          <button
            key={config.floor}
            type="button"
            aria-pressed={config.floor === currentFloor}
            onClick={() => onFloorChange(config.floor)}
          >
            {config.label}
          </button>
        ))}
      </div>

      <TransformWrapper minScale={0.5} maxScale={4} centerOnInit>
        <TransformComponent>
          <div style={{ position: 'relative', width: floorConfig.width, height: floorConfig.height }}>
            <FloorPlanSvg floorConfig={floorConfig} />
            <RoomMarkers
              rooms={rooms}
              currentFloor={currentFloor}
              floorConfig={floorConfig}
              selectedRoomId={selectedRoomId}
              onSelectRoom={onSelectRoom}
            />
          </div>
        </TransformComponent>
      </TransformWrapper>
    </div>
  )
}

export default MapContainer
