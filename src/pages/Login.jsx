import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api/auth'

function Login() {
  const [rol, setRol] = useState('empresa')
  const [correo, setCorreo] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  async function handleLogin() {
    if (!correo || !password) { setError('Ingresa correo y contrasena'); return }
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.error === 'pendiente') {
          setError('Tu cuenta esta pendiente de aprobacion. Te notificaremos por correo.')
        } else if (data.error === 'rechazado') {
          setError('Tu solicitud fue rechazada. Contactanos para mas informacion.')
        } else {
          setError(data.error || 'Error al iniciar sesion')
        }
        setCargando(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombre', data.nombre)

      if (data.rol === 'ambas') {
        if (rol === 'transportista') navigate('/carrier')
        else navigate('/shipper')
      } else if (data.rol === 'empresa' || data.rol === 'remitente') {
        navigate('/shipper')
      } else {
        navigate('/carrier')
      }

    } catch {
      setError('Error de conexion con el servidor')
      setCargando(false)
    }
  }

  const inp = {
    width: '100%',
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '9px',
    padding: '11px 14px',
    color: 'white',
    fontFamily: 'DM Sans,sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const rolCard = (r, icon, titulo, desc) => (
    <div onClick={() => setRol(r)}
      style={{
        border: `2px solid ${rol === r ? '#F97316' : 'rgba(255,255,255,.1)'}`,
        background: rol === r ? 'rgba(249,115,22,.09)' : 'transparent',
        borderRadius: '14px',
        padding: '14px 10px',
        textAlign: 'center',
        cursor: 'pointer',
        transition: '.2s',
      }}>
      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{titulo}</div>
      <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '3px', lineHeight: 1.4 }}>{desc}</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif', padding: '20px' }}>
      <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '40px', width: '100%', maxWidth: '440px' }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '6px', color: 'white' }}>
          Cargo<span style={{ color: '#F97316' }}>Share</span>
        </div>
        <div style={{ fontSize: '14px', color: '#7A8FAD', marginBottom: '28px' }}>Inicia sesion en tu cuenta</div>

        {/* ROL — 3 opciones empresas */}
        <div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', marginBottom: '10px' }}>
          Entrar como empresa
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          {rolCard('empresa', '📦', 'Remitente', 'Enviar carga')}
          {rolCard('transportista', '🚛', 'Transportista', 'Gestionar rutas')}
          {rolCard('ambas', '🔄', 'Ambos roles', 'Tengo los dos')}
        </div>

        {/* Aviso para ambas */}
        {rol === 'ambas' && (
          <div style={{ background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.2)', borderRadius: '10px', padding: '12px 14px', marginBottom: '18px', fontSize: '12px', color: '#60A5FA', lineHeight: 1.6 }}>
            Con <strong>Ambos roles</strong> puedes elegir a cual panel entrar:
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
              <button onClick={() => setRol('empresa')} style={{ background: 'rgba(249,115,22,.15)', border: '1px solid rgba(249,115,22,.3)', color: '#F97316', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                📦 Panel Remitente
              </button>
              <button onClick={() => setRol('transportista')} style={{ background: 'rgba(96,165,250,.15)', border: '1px solid rgba(96,165,250,.3)', color: '#60A5FA', borderRadius: '8px', padding: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                🚛 Panel Transportista
              </button>
            </div>
          </div>
        )}

        {/* FORM */}
        <div style={{ marginBottom: '14px' }}>
          <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Correo corporativo</label>
          <input type="email" placeholder="correo@empresa.com"
            value={correo} onChange={e => setCorreo(e.target.value)}
            style={inp} />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Contrasena</label>
          <input type="password" placeholder="Tu contrasena"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={inp} />
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={cargando}
          style={{ width: '100%', background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '15px', fontWeight: '700', cursor: 'pointer', opacity: cargando ? 0.7 : 1 }}>
          {cargando ? 'Iniciando sesion...' :
            rol === 'empresa' ? 'Entrar como Remitente →' :
            rol === 'transportista' ? 'Entrar como Transportista →' :
            'Selecciona un panel arriba →'}
        </button>

        {/* Divisor */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.08)' }} />
          <span style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.7px' }}>O accede como</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,.08)' }} />
        </div>

        {/* Accesos directos — conductor e independiente */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div onClick={() => navigate('/conductor')}
            style={{ border: '1px solid rgba(255,255,255,.1)', borderRadius: '14px', padding: '14px', textAlign: 'center', cursor: 'pointer', transition: '.2s' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🚛</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Conductor</div>
            <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>Panel de viajes</div>
          </div>
          <div onClick={() => navigate('/independiente')}
            style={{ border: '1px solid rgba(16,185,129,.25)', background: 'rgba(16,185,129,.04)', borderRadius: '14px', padding: '14px', textAlign: 'center', cursor: 'pointer', transition: '.2s' }}>
            <div style={{ fontSize: '22px', marginBottom: '4px' }}>🚚</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>Independiente</div>
            <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>Tengo mi camion</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '13px', color: '#7A8FAD' }}>
          No tienes cuenta? <span style={{ color: '#60A5FA', cursor: 'pointer' }} onClick={() => navigate('/register')}>Registrarse gratis</span>
        </div>
      </div>
    </div>
  )
}

export default Login