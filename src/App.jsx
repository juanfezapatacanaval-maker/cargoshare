import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Carrier from './pages/Carrier'
import Shipper from './pages/Shipper'
import Conductor from './pages/conductor'
import Independiente from './pages/Independiente'

// ── GUARD — evita que el refresh cierre sesion ─────────────────────
function ProtectedRoute({ children }) {
  const [estado, setEstado] = useState('cargando') // cargando | ok | sin-token

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) { setEstado('sin-token'); return }

    // Verificar que el token no esté expirado localmente
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const expirado = payload.exp * 1000 < Date.now()
      if (expirado) {
        localStorage.clear()
        setEstado('sin-token')
      } else {
        setEstado('ok')
      }
    } catch {
      localStorage.clear()
      setEstado('sin-token')
    }
  }, [])

  if (estado === 'cargando') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100dvh', background: '#060E1C', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          border: '3px solid rgba(249,115,22,.2)',
          borderTop: '3px solid #F97316',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
        <div style={{ fontFamily: 'sans-serif', fontSize: '13px', color: '#7A8FAD' }}>
          Cargo<span style={{ color: '#F97316' }}>Share</span>
        </div>
      </div>
    )
  }

  if (estado === 'sin-token') {
    return <Navigate to="/login" replace />
  }

  return children
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <iframe src="/landing.html" style={{ width: '100%', height: '100dvh', border: 'none' }} title="CargoShare" />
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

export default App