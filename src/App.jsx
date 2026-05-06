import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Carrier from './pages/Carrier'
import Shipper from './pages/Shipper'
import Conductor from './pages/conductor'
import Independiente from './pages/Independiente'

function ProtectedRoute({ children }) {
  const [estado, setEstado] = useState('cargando')
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setEstado('sin-token'); return }
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      if (payload.exp * 1000 < Date.now()) { localStorage.clear(); setEstado('sin-token') }
      else setEstado('ok')
    } catch { localStorage.clear(); setEstado('sin-token') }
  }, [])
  if (estado === 'cargando') return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100dvh', background:'#060E1C' }}>
      <div style={{ width:'36px', height:'36px', borderRadius:'50%', border:'3px solid rgba(249,115,22,.15)', borderTop:'3px solid #F97316', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
  if (estado === 'sin-token') return <Navigate to="/login" replace />
  return children
}

// Detectar si es mobile
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
  window.matchMedia('(max-width: 768px)').matches

// Detectar si está instalada como PWA
const isPWA = window.matchMedia('(display-mode: standalone)').matches

// Landing correcto según contexto
const LandingSrc = (isMobile || isPWA) ? '/app-landing.html' : '/landing.html'

export default function App({ onReady }) {
  useEffect(() => { onReady?.() }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <iframe
            src={LandingSrc}
            style={{ width:'100%', height:'100dvh', border:'none' }}
            title="CargoShare"
            onLoad={() => onReady?.()}
          />
        } />
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shipper"  element={<ProtectedRoute><Shipper /></ProtectedRoute>} />
        <Route path="/carrier"  element={<ProtectedRoute><Carrier /></ProtectedRoute>} />
        <Route path="/conductor" element={<ProtectedRoute><Conductor /></ProtectedRoute>} />
        <Route path="/independiente" element={<ProtectedRoute><Independiente /></ProtectedRoute>} />
        <Route path="/admin-cs-2025-x9k" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}