import { useRef, useEffect } from 'react'
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch'
import type { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch'
import { Crosshair } from '@phosphor-icons/react'
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

const PADDING_X = 300
const PADDING_Y = 240

function MapContainer({
  rooms,
  currentFloor,
  onFloorChange,
  selectedRoomId,
  onSelectRoom,
}: MapContainerProps) {
  const floorConfig = getFloorConfig(currentFloor)
  const transformRef = useRef<ReactZoomPanPinchRef | null>(null)

  useEffect(() => {
    if (!selectedRoomId) return
    const room = rooms.find((r) => r.id === selectedRoomId)
    if (!room || room.floor !== currentFloor) return

    // Small delay to ensure SVG and layout are ready
    const timer = setTimeout(() => {
      if (!transformRef.current) return
      const wrapper = transformRef.current.instance?.wrapperComponent
      const wrapperWidth = wrapper?.clientWidth ?? window.innerWidth
      const wrapperHeight = wrapper?.clientHeight ?? window.innerHeight

      const isMobile = wrapperWidth < 640
      const targetScale = 1.8

      // On mobile: position target slightly higher (35% of viewport height) to avoid bottom sheet
      // On desktop: adjust center for side panel if needed
      const targetX = isMobile ? wrapperWidth / 2 : Math.max(wrapperWidth / 2, (wrapperWidth - 384) / 2)
      const targetY = isMobile ? wrapperHeight * 0.35 : wrapperHeight / 2

      const posX = targetX - (room.coordinates.x + PADDING_X) * targetScale
      const posY = targetY - (room.coordinates.y + PADDING_Y) * targetScale

      transformRef.current.setTransform(posX, posY, targetScale, 300, 'easeOutQuad')
    }, 50)

    return () => clearTimeout(timer)
  }, [selectedRoomId, currentFloor, rooms])


  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Re-center floating action button */}
      <button
        type="button"
        aria-label="จัดกึ่งกลางแผนที่"
        onClick={() => transformRef.current?.resetTransform(300)}
        className="absolute bottom-20 right-4 z-10 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/95 text-slate-700 shadow-2xl backdrop-blur-md border border-slate-100/80 hover:bg-slate-50 hover:text-blue-600 hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 transition-all duration-200 cursor-pointer sm:bottom-20 sm:right-6"
      >
        <Crosshair size={22} weight="bold" aria-hidden="true" />
      </button>


      {/* Floor switcher floating on the map */}
      <div
        role="group"
        aria-label="Floor switcher"
        className="absolute bottom-6 right-4 z-10 flex gap-2 rounded-2xl bg-white/95 p-1.5 shadow-2xl backdrop-blur-md border border-slate-100/80 sm:bottom-6 sm:right-6"
      >
        {FLOOR_CONFIGS.map((config) => {
          const isActive = config.floor === currentFloor
          return (
            <button
              key={config.floor}
              type="button"
              aria-pressed={isActive}
              onClick={() => onFloorChange(config.floor)}
              className={
                isActive
                  ? 'rounded-xl bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg active:translate-y-0 transition-all duration-200 cursor-pointer'
                  : 'rounded-xl border border-slate-200/80 bg-white/80 px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all duration-200 cursor-pointer'
              }
            >
              {config.label}
            </button>
          )
        })}
      </div>


      <TransformWrapper
        ref={transformRef}
        minScale={0.2}
        maxScale={6}
        centerOnInit
        centerZoomedOut
        limitToBounds={true}
        disablePadding={false}
        autoAlignment={{
          sizeX: 300,
          sizeY: 250,
          animationTime: 250,
          velocityAlignmentTime: 400,
          animationType: 'easeOut',
        }}
      >

        <TransformComponent
          wrapperClass="w-full h-full overflow-hidden"
          wrapperStyle={{ width: '100%', height: '100%' }}
          contentStyle={{ padding: `${PADDING_Y}px ${PADDING_X}px` }}
        >

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

