import { useState } from 'react'
import { useRooms } from './hooks/useRooms'
import MapContainer from './components/map/MapContainer'
import RoomSearchPanel from './components/RoomSearchPanel'
import RoomDetailModal from './components/RoomDetailModal'

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
        {/* Search & Filter Component — ปักหมุดจริงบน MapContainer ผ่าน handleSelectRoom เดียวกัน */}
        <RoomSearchPanel onSelectRoom={handleSelectRoom} />
      </section>

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

      {/* Bottom Sheet แสดงรายละเอียดห้อง — รับ event จากทั้ง Search และ Map Marker Click ผ่าน handleSelectRoom */}
      <RoomDetailModal
        selectedRoomId={selectedRoomId}
        onClose={() => setSelectedRoomId(null)}
      />
    </div>
  )
}

export default App