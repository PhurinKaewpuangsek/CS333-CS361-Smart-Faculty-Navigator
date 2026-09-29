import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import MapPage from './components/MapPage.tsx'
import AdminPage from './components/AdminPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        {/* / → /map: canonical public entry point */}
        <Route path="/" element={<Navigate to="/map" replace />} />

        {/* /map: read-only interactive floor plan (public) */}
        <Route path="/map" element={<MapPage />} />

        {/* /admin: room & schedule CRUD panel (no public link — security by obscurity) */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
