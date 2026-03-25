import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Register() {
  const [rol, setRol] = useState('empresa')
  const [form, setForm] = useState({nombre:'',correo:'',password:'',nit:''})
  const [errores, setErrores] = useState({})
  const [enviado, setEnviado] = useState(false)
  const navigate = useNavigate()

  function validar() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'El nombre es obligatorio'
    if (!form.correo.includes('@') || !form.correo.includes('.')) e.correo = 'Ingresa un correo válido'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (!form.nit.trim()) e.nit = 'El NIT es obligatorio'
    return e
  }

  const [cargando, setCargando] = useState(false)
  const [errorApi, setErrorApi] = useState('')

  async function handleRegister() {
    const e = validar()
    if (Object.keys(e).length > 0) { setErrores(e); return }
    setCargando(true)
    setErrorApi('')
    try {
      const res = await fetch('https://cargoshare-api-production.up.railway.app/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, rol })
      })
      const data = await res.json()
      if (!res.ok) { setErrorApi(data.error || 'Error al registrar'); setCargando(false); return }
      setEnviado(true)
    } catch {
      setErrorApi('Error de conexión con el servidor')
      setCargando(false)
    }
  }

  const inp = {
    width:'100%',background:'rgba(255,255,255,.06)',
    border:'1px solid rgba(255,255,255,.1)',borderRadius:'9px',
    padding:'11px 14px',color:'white',
    fontFamily:'DM Sans,sans-serif',fontSize:'14px',outline:'none'
  }
  const inpErr = {...inp, border:'1px solid #EF4444'}
  const lbl = {fontSize:'11px',color:'#7A8FAD',fontWeight:'700',
    textTransform:'uppercase',letterSpacing:'.7px',display:'block',marginBottom:'6px'}
  const err = {fontSize:'11px',color:'#EF4444',marginTop:'4px'}

  // PANTALLA DE APROBACIÓN PENDIENTE
  if (enviado) return (
    <div style={{minHeight:'100vh',background:'#060E1C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif',padding:'20px'}}>
      <div style={{background:'#0C1B35',border:'1px solid rgba(255,255,255,.1)',borderRadius:'22px',padding:'48px 40px',width:'480px',textAlign:'center'}}>
        <div style={{fontSize:'64px',marginBottom:'16px'}}>⏳</div>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:'26px',fontWeight:'800',marginBottom:'8px',color:'white'}}>
          Solicitud enviada
        </div>
        <div style={{fontSize:'14px',color:'#7A8FAD',lineHeight:'1.7',marginBottom:'28px'}}>
          Recibimos tu solicitud para unirte a <strong style={{color:'white'}}>CargoShare</strong>.<br/>
          Revisaremos tu información y en <strong style={{color:'#F97316'}}>24 a 48 horas hábiles</strong> recibirás un correo con la confirmación de tu cuenta.
        </div>

        <div style={{background:'rgba(255,255,255,.04)',border:'1px solid rgba(255,255,255,.07)',borderRadius:'14px',padding:'20px',marginBottom:'28px',textAlign:'left'}}>
          <div style={{fontSize:'12px',color:'#7A8FAD',marginBottom:'14px',fontWeight:'700',textTransform:'uppercase',letterSpacing:'.8px'}}>Datos enviados</div>
          {[
            ['Empresa', form.nombre],
            ['Correo', form.correo],
            ['NIT', form.nit],
            ['Rol', rol === 'empresa' ? '📦 Empresa remitente' : '🚛 Transportista'],
          ].map(([k,v])=>(
            <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid rgba(255,255,255,.05)',fontSize:'13px'}}>
              <span style={{color:'#7A8FAD'}}>{k}</span>
              <span style={{fontWeight:'700',color:'white'}}>{v}</span>
            </div>
          ))}
        </div>

        <div style={{background:'rgba(249,115,22,.08)',border:'1px solid rgba(249,115,22,.18)',borderRadius:'12px',padding:'16px',marginBottom:'28px',fontSize:'13px',color:'rgba(255,200,140,.9)',lineHeight:'1.6'}}>
          📧 Te enviaremos un correo a <strong>{form.correo}</strong> cuando tu cuenta esté aprobada.
        </div>

        <button onClick={()=>navigate('/')}
          style={{width:'100%',background:'#F97316',border:'none',color:'white',padding:'13px',borderRadius:'10px',fontFamily:'DM Sans,sans-serif',fontSize:'15px',fontWeight:'700',cursor:'pointer'}}>
          Volver al inicio →
        </button>
        <div style={{marginTop:'14px',fontSize:'13px',color:'#7A8FAD'}}>
          ¿Ya tienes cuenta aprobada? <span style={{color:'#60A5FA',cursor:'pointer'}} onClick={()=>navigate('/login')}>Iniciar sesión</span>
        </div>
      </div>
    </div>
  )

  // FORMULARIO DE REGISTRO
  return (
    <div style={{minHeight:'100vh',background:'#060E1C',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'DM Sans,sans-serif',padding:'20px'}}>
      <div style={{background:'#0C1B35',border:'1px solid rgba(255,255,255,.1)',borderRadius:'22px',padding:'40px',width:'460px'}}>
        <div style={{fontFamily:'Syne,sans-serif',fontSize:'24px',fontWeight:'800',marginBottom:'6px',color:'white'}}>
          Cargo<span style={{color:'#F97316'}}>Share</span>
        </div>
        <div style={{fontSize:'14px',color:'#7A8FAD',marginBottom:'28px'}}>Crea tu cuenta — revisamos en 24-48h</div>

        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'24px'}}>
          {[['transportista','🚛','Transportista','Tengo camión o flota'],['empresa','📦','Empresa','Necesito enviar carga']].map(([r,ic,n,d])=>(
            <div key={r} onClick={()=>setRol(r)}
              style={{border:`2px solid ${rol===r?'#F97316':'rgba(255,255,255,.1)'}`,background:rol===r?'rgba(249,115,22,.09)':'transparent',borderRadius:'14px',padding:'16px',textAlign:'center',cursor:'pointer',transition:'.2s'}}>
              <div style={{fontSize:'26px',marginBottom:'7px'}}>{ic}</div>
              <div style={{fontSize:'13px',fontWeight:'700',color:'white'}}>{n}</div>
              <div style={{fontSize:'11px',color:'#7A8FAD',marginTop:'3px'}}>{d}</div>
            </div>
          ))}
        </div>

        {[
          {key:'nombre', label:'Nombre de la empresa', type:'text', placeholder: rol==='transportista'?'Ej: Carlos Jiménez':'Ej: Textiles Andinos SAS'},
          {key:'correo', label:'Correo corporativo', type:'email', placeholder:'correo@empresa.com'},
          {key:'password', label:'Contraseña', type:'password', placeholder:'Mínimo 8 caracteres'},
          {key:'nit', label:'NIT de la empresa', type:'text', placeholder:'900.123.456-7'},
        ].map(f=>(
          <div key={f.key} style={{marginBottom:'14px'}}>
            <label style={lbl}>{f.label}</label>
            <input type={f.type} placeholder={f.placeholder}
              value={form[f.key]}
              onChange={e=>setForm({...form,[f.key]:e.target.value})}
              style={errores[f.key]?inpErr:inp}/>
            {errores[f.key] && <div style={err}>⚠️ {errores[f.key]}</div>}
          </div>
        ))}

        {errorApi && <div style={{background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.25)',borderRadius:'9px',padding:'11px 14px',fontSize:'13px',color:'#EF4444',marginBottom:'14px'}}>⚠️ {errorApi}</div>}
        <button onClick={handleRegister} disabled={cargando}
          style={{width:'100%',background:'#F97316',border:'none',color:'white',padding:'13px',borderRadius:'10px',fontFamily:'DM Sans,sans-serif',fontSize:'15px',fontWeight:'700',cursor:'pointer',marginTop:'6px'}}>
          {cargando ? 'Enviando...' : rol==='empresa'?'Solicitar cuenta de empresa →':'Solicitar cuenta de transportista →'}
        </button>

        <div style={{textAlign:'center',marginTop:'16px',fontSize:'13px',color:'#7A8FAD'}}>
          ¿Ya tienes cuenta? <span style={{color:'#60A5FA',cursor:'pointer'}} onClick={()=>navigate('/login')}>Iniciar sesión</span>
        </div>
      </div>
    </div>
  )
}
export default Register