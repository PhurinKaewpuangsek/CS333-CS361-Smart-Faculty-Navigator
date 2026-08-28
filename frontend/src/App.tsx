import { useState } from 'react'
import { useRooms } from './hooks/useRooms'
import MapContainer from './components/map/MapContainer'

function App() {
  const { rooms, loading, error } = useRooms()
  const [currentFloor, setCurrentFloor] = useState(1)
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  function handleSelectRoom(roomId: string) {
    setSelectedRoomId(roomId)
    const selected = rooms.find((room) => room.id === roomId)
    if (selected) {
      setCurrentFloor(selected.floor)
    }
  }

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Faculty Navigator</h1>

      <section style={{ marginBottom: '32px' }}>
        <h2>Floor Plan (BR3)</h2>
        {loading && <p>กำลังโหลดข้อมูลห้อง...</p>}
        {error && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {error.message}</p>}
        {!loading && !error && (
          <MapContainer
            rooms={rooms}
            currentFloor={currentFloor}
            onFloorChange={setCurrentFloor}
            selectedRoomId={selectedRoomId}
            onSelectRoom={handleSelectRoom}
          />
        )}
        {selectedRoomId && <p>Selected room: {selectedRoomId}</p>}
      </section>
    </div>
  )
}

export default App