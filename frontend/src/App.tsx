import { useState } from 'react'
import { useRooms } from './hooks/useRooms'
import RoomSearchPanel from './components/RoomSearchPanel'

function App() {
  const { rooms, loading, error } = useRooms()
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Faculty Navigator</h1>

      <section style={{ marginBottom: '32px' }}>
        {/* Search & Filter Component — จัดใน flow ปกติ (ไม่ลอยทับรูปแผนที่)
            เพราะการปักหมุดทับผังจริงเป็นงานของ issue #26/#27 ไม่ใช่ของ issue นี้ */}
        <RoomSearchPanel
          onSelectRoom={(roomId) => {
            setSelectedRoomId(roomId)
            // TODO: ปักหมุดบนผัง SVG และเปิด Room Detail Modal — งานของ issue #26/#27
          }}
        />
        {selectedRoomId && (
          <p style={{ marginTop: '12px' }}>
            เลือกห้องล่าสุด (roomId): <code>{selectedRoomId}</code>
          </p>
        )}
      </section>

      <section style={{ marginBottom: '32px' }}>
        <h2>Floor Plan Preview (BR3 - Floor 1)</h2>
        <img
          src="/maps/br3/floor-1.svg"
          alt="BR3 Floor 1 Map"
          style={{ maxWidth: '100%', height: 'auto', border: '1px solid #ccc' }}
        />
      </section>

      <section>
        <h2>Loaded Rooms ({rooms.length})</h2>
        {loading && <p>กำลังโหลดข้อมูลห้อง...</p>}
        {error && <p style={{ color: 'red' }}>เกิดข้อผิดพลาด: {error.message}</p>}
        {!loading && !error && (
          <ul>
            {rooms.map((room) => (
              <li key={room.id}>
                <strong>{room.code || room.id}</strong>: {room.nameThai}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

export default App