import { useEffect, useState } from 'react'

interface Room {
  id: string
  name: string
  floor?: number
}

function App() {
  const [rooms, setRooms] = useState<Room[]>([])

  useEffect(() => {
    fetch('/data/rooms.json')
      .then((res) => res.json())
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch((err) => console.error('Failed to load rooms:', err))
  }, [])

  return (
    <div style={{ padding: '24px', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Smart Faculty Navigator</h1>
      
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
        <ul>
          {rooms.map((room) => (
            <li key={room.id}>{room.name}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}

export default App