import { useState } from 'react'
import { useRooms } from './hooks/useRooms'
import MapContainer from './components/map/MapContainer'
import RoomSearchPanel from './components/RoomSearchPanel'
import RoomDetailModal from './components/RoomDetailModal'

function App() {
  const { rooms, loading, error } = useRooms()
  const [currentFloor, setCurrentFloor] = useState(1)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  function handleSelectRoom(roomId: string) {
    setSelectedRoomId(roomId)
    setIsModalOpen(true)
    const selected = rooms.find((room) => room.id === roomId)
    if (selected && selected.floor !== currentFloor) {
      setCurrentFloor(selected.floor)
    }
  }

  function handleCloseModal() {
    setIsModalOpen(false)
  }

  function handleClearSelection() {
    setSelectedRoomId(null)
    setIsModalOpen(false)
  }

  return (
    <main className="relative h-[100dvh] w-screen overflow-hidden bg-slate-100 font-sans">
      {/* Primary Workspace: Interactive SVG Map */}
      <MapContainer
        rooms={rooms}
        currentFloor={currentFloor}
        onFloorChange={setCurrentFloor}
        selectedRoomId={selectedRoomId}
        onSelectRoom={handleSelectRoom}
        onClearSelection={handleClearSelection}
      />

      {/* Floating Search & Category Filter Overlay */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 z-20 max-w-sm sm:right-auto">
        <div className="pointer-events-auto">
          <RoomSearchPanel
            rooms={rooms}
            loading={loading}
            error={error}
            onSelectRoom={handleSelectRoom}
          />
        </div>
      </div>

      {/* Room Detail Modal: Bottom Sheet on Mobile, Side Panel on Desktop */}
      {isModalOpen && selectedRoomId && (
        <RoomDetailModal
          rooms={rooms}
          loading={loading}
          error={error}
          selectedRoomId={selectedRoomId}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
        />
      )}
    </main>
  )
}

export default App