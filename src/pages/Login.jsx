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
    if (!correo || !password) { setError('Ingresa correo y contraseña'); return }
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
          setError('⏳ Tu cuenta está pendiente de aprobación. Te notificaremos por correo.')
        } else if (data.error === 'rechazado') {
          setError('❌ Tu solicitud fue rechazada. Contáctanos para más información.')
        } else {
          setError(data.error || 'Error al iniciar sesión')
        }
        setCargando(false)
        return
      }

      // Guardar token y redirigir
      localStorage.setItem('token', data.token)
      localStorage.setItem('rol', data.rol)
      localStorage.setItem('nombre', data.nombre)

      if (data.rol === 'empresa') navigate('/shipper')
      else navigate('/carrier')

    } catch {
      setError('Error de conexión con el servidor')
      setCargando(false)
    }
  }

  const inp = {width:'100%',background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.1)',borderRadius:'9px',padding:'11px 14px',color:'white',fontFamily:'DM Sans,sans-serif',fontSize:'14px',outline:'none'}

  return (
    <div style={{minHeight:'100vh',background:'#060E1C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans, sans-serif'}}>
      <div style={{background:'#0C1B35',border:'1px solid rgba(255,255,255,.1)',borderRadius:'22px',padding:'40px',width:'420px'}}>
        <div style={{fontFamily:'Syne, sans-serif',fontSize:'24px',fontWeight:'800',marginBottom:'6px',color:'white'}}>
          Cargo<span style={{color:'#F97316'}}>Share</span>
        </div>
        <div style={{fontSize:'14px',color:'#7A8FAD',marginBottom:'28px'}}>Inicia sesión en tu cuenta</div>

        {/* ROL */}
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'24px'}}>
          <div onClick={()=>setRol('transportista')}
            style={{border:`2px solid ${rol==='transportista'?'#F97316':'rgba(255,255,255,.1)'}`,background:rol==='transportista'?'rgba(249,115,22,.09)':'transparent',borderRadius:'14px',padding:'16px',textAlign:'center',cursor:'pointer',transition:'.2s'}}>
            <div style={{fontSize:'26px',marginBottom:'7px'}}>🚛</div>
            <div style={{fontSize:'13px',fontWeight:'700',color:'white'}}>Transportista</div>
            <div style={{fontSize:'11px',color:'#7A8FAD',marginTop:'3px'}}>Gestionar rutas e ingresos</div>
          </div>
          <div onClick={()=>setRol('empresa')}
            style={{border:`2px solid ${rol==='empresa'?'#F97316':'rgba(255,255,255,.1)'}`,background:rol==='empresa'?'rgba(249,115,22,.09)':'transparent',borderRadius:'14px',padding:'16px',textAlign:'center',cursor:'pointer',transition:'.2s'}}>
            <div style={{fontSize:'26px',marginBottom:'7px'}}>📦</div>
            <div style={{fontSize:'13px',fontWeight:'700',color:'white'}}>Empresa</div>
            <div style={{fontSize:'11px',color:'#7A8FAD',marginTop:'3px'}}>Gestionar envíos y ahorro</div>
          </div>
        </div>

        {/* FORM */}
        <div style={{marginBottom:'14px'}}>
          <label style={{fontSize:'11px',color:'#7A8FAD',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.7px',display:'block',marginBottom:'6px'}}>Correo corporativo</label>
          <input type="email" placeholder="correo@empresa.com"
            value={correo} onChange={e=>setCorreo(e.target.value)}
            style={inp}/>
        </div>
        <div style={{marginBottom:'20px'}}>
          <label style={{fontSize:'11px',color:'#7A8FAD',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.7px',display:'block',marginBottom:'6px'}}>Contraseña</label>
          <input type="password" placeholder="Tu contraseña"
            value={password} onChange={e=>setPassword(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&handleLogin()}
            style={inp}/>
        </div>

        {error && (
          <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'9px',padding:'11px 14px',fontSize:'13px',color:'#EF4444',marginBottom:'16px'}}>
            {error}
          </div>
        )}

        <button onClick={handleLogin} disabled={cargando}
          style={{width:'100%',background:'#F97316',border:'none',color:'white',padding:'13px',borderRadius:'10px',fontFamily:'DM Sans,sans-serif',fontSize:'15px',fontWeight:'700',cursor:'pointer',opacity:cargando?0.7:1}}>
          {cargando ? 'Iniciando sesión...' : rol==='empresa'?'Entrar a mi panel de empresa →':'Entrar a mi panel de transportista →'}
        </button>
        <div onClick={()=>navigate('/conductor')}
          style={{border:'1px solid rgba(255,255,255,.1)',borderRadius:'14px',padding:'14px',textAlign:'center',cursor:'pointer',marginTop:'12px',transition:'.2s'}}>
          <div style={{fontSize:'22px',marginBottom:'4px'}}>🚛</div>
          <div style={{fontSize:'13px',fontWeight:'700',color:'white'}}>Soy conductor</div>
          <div style={{fontSize:'11px',color:'#7A8FAD',marginTop:'2px'}}>Acceso al panel de viajes</div>
        </div>

        <div style={{textAlign:'center',marginTop:'16px',fontSize:'13px',color:'#7A8FAD'}}>
          ¿No tienes cuenta? <span style={{color:'#60A5FA',cursor:'pointer'}} onClick={()=>navigate('/register')}>Registrarse gratis</span>
        </div>
      </div>
    </div>
  )
}
export default Login