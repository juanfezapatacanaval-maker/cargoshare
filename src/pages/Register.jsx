import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api/auth'

export default function Register() {
  const navigate = useNavigate()
  const [paso, setPaso] = useState(1)
  const [enviado, setEnviado] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [errorApi, setErrorApi] = useState('')

  const [form, setForm] = useState({
    rol: '',
    nombre: '',
    correo: '',
    password: '',
    passwordConfirm: '',
    nit: '',
    razonSocial: '',
    correoEmpresa: '',
    telefono: '',
    ciudad: '',
    direccion: '',
    fechaConstitucion: '',
    nombreRepLegal: '',
    cedulaRepLegal: '',
    cedula: '',
    empresaAfiliada: '',
    placa: '',
    tipoVehiculo: '',
    capacidadKg: '',
    capacidadM3: '',
    anoVehiculo: '',
    licenciaCategoria: '',
    licenciaVencimiento: '',
  })

  const [archivos, setArchivos] = useState({
    rut: null,
    camaraComercio: null,
    certRepresentacion: null,
    cedulaRep: null,
    habilitacionMT: null,
    polizaRC: null,
    fotoCedula: null,
    fotoLicencia: null,
    tarjetaPropiedad: null,
    soat: null,
    tecnicoMecanica: null,
    fotoCamion: null
  })

  const [errores, setErrores] = useState({})

  const tiposEmpresa = [
    { id: 'empresa_remitente', ic: '📦', titulo: 'Empresa remitente', desc: 'Necesito enviar carga' },
    { id: 'empresa_flota', ic: '🚛', titulo: 'Empresa con flota', desc: 'Tengo camiones disponibles' },
    { id: 'ambas', ic: '🔄', titulo: 'Ambas', desc: 'Envío carga y tengo flota' },
    { id: 'independiente', ic: '🚚', titulo: 'Transportista independiente', desc: 'Tengo mi propio camión' },
    { id: 'conductor', ic: '🚗', titulo: 'Soy conductor', desc: 'Quiero afiliarme a una empresa' },
  ]

  const esEmpresa = ['empresa_remitente', 'empresa_flota', 'ambas'].includes(form.rol)
  const necesitaFlota = form.rol === 'empresa_flota' || form.rol === 'ambas'

  function validarPaso2() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Obligatorio'
    if (!form.correo.includes('@')) e.correo = 'Correo inválido'
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres'
    if (form.password !== form.passwordConfirm) e.passwordConfirm = 'No coinciden'
    if (esEmpresa && !form.nit.trim()) e.nit = 'Obligatorio'
    if (!esEmpresa && !form.cedula.trim()) e.cedula = 'Obligatorio'
    return e
  }

  const obtenerDocsRequeridos = () => {
    if (esEmpresa) {
      const docs = [
        { key: 'rut', label: 'RUT activo' },
        { key: 'camaraComercio', label: 'Cámara de Comercio' },
        { key: 'certRepresentacion', label: 'Certificado Representación' },
        { key: 'cedulaRep', label: 'Cédula Rep. Legal' }
      ]
      if (necesitaFlota) {
        docs.push({ key: 'habilitacionMT', label: 'Habilitación MT' }, { key: 'polizaRC', label: 'Póliza RC' })
      }
      return docs
    }
    if (form.rol === 'independiente') {
      return [
        { key: 'fotoCedula', label: 'Foto Cédula' },
        { key: 'fotoLicencia', label: 'Licencia Conducción' },
        { key: 'tarjetaPropiedad', label: 'Tarjeta Propiedad' },
        { key: 'soat', label: 'SOAT' },
        { key: 'tecnicoMecanica', label: 'Técnico-Mecánica' },
        { key: 'fotoCamion', label: 'Foto del Vehículo' }
      ]
    }
    return [{ key: 'fotoCedula', label: 'Foto Cédula' }, { key: 'fotoLicencia', label: 'Licencia Conducción' }]
  }

  function siguientePaso() {
    if (paso === 1) {
      if (!form.rol) { setErrores({ rol: 'Selecciona un rol' }); return }
      setErrores({}); setPaso(2)
    } else if (paso === 2) {
      const e = validarPaso2()
      if (Object.keys(e).length > 0) { setErrores(e); return }
      setErrores({}); setPaso(3)
    } else if (paso === 3) { setPaso(4) }
  }

  async function enviarRegistro() {
    setCargando(true)
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
      Object.entries(archivos).forEach(([k, v]) => { if (v) formData.append(k, v) })
      const res = await fetch(`${API}/register`, { method: 'POST', body: formData })
      if (!res.ok) { const d = await res.json(); setErrorApi(d.error || 'Error'); setCargando(false); return }
      setEnviado(true)
    } catch { setErrorApi('Error de conexión') }
    setCargando(false)
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans,sans-serif', padding: '20px' },
    card: { background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '40px', width: '520px', maxWidth: '100%' },
    logo: { fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' },
    inp: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    lbl: { fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', display: 'block', marginBottom: '6px' },
    btn: { width: '100%', background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
    btnSec: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '12px', borderRadius: '10px', cursor: 'pointer' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    fileBox: (tiene) => ({ width: '100%', background: tiene ? 'rgba(16,185,129,.06)' : 'rgba(255,255,255,.03)', border: `2px dashed ${tiene ? '#10B981' : 'rgba(255,255,255,.15)'}`, borderRadius: '12px', padding: '12px', textAlign: 'center', cursor: 'pointer', display: 'block' }),
  }

  if (enviado) return <div style={s.wrap}><div style={s.card}><h2 style={{color:'white'}}>✅ ¡Solicitud Enviada!</h2><button onClick={()=>navigate('/')} style={s.btn}>Volver</button></div></div>

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
        <p style={{color:'#7A8FAD', marginBottom:'20px'}}>Paso {paso} de 4</p>

        {paso === 1 && (
          <div>
            {tiposEmpresa.map(t => (
              <div key={t.id} onClick={() => setForm({ ...form, rol: t.id })}
                style={{ padding: '14px', borderRadius: '12px', border: `2px solid ${form.rol === t.id ? '#F97316' : 'rgba(255,255,255,.1)'}`, cursor: 'pointer', marginBottom: '10px' }}>
                <span style={{fontSize:'20px'}}>{t.ic}</span> <strong style={{color:'white', marginLeft:'10px'}}>{t.titulo}</strong>
              </div>
            ))}
            <button onClick={siguientePaso} style={s.btn}>Continuar</button>
          </div>
        )}

        {paso === 2 && (
          <div>
            <div style={{marginBottom:'14px'}}><label style={s.lbl}>Nombre Completo</label>
            <input style={s.inp} value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} /></div>
            
            {!esEmpresa && (
              <div style={s.grid2}>
                <div style={{marginBottom:'14px'}}><label style={s.lbl}>Cédula</label><input style={s.inp} onChange={e => setForm({...form, cedula: e.target.value})} /></div>
                <div style={{marginBottom:'14px'}}><label style={s.lbl}>Teléfono</label><input style={s.inp} onChange={e => setForm({...form, telefono: e.target.value})} /></div>
              </div>
            )}

            {form.rol === 'conductor' && (
              <div style={{marginBottom:'14px'}}><label style={s.lbl}>Empresa Afiliada</label>
              <select style={s.inp} onChange={e => setForm({...form, empresaAfiliada: e.target.value})}>
                <option value="">Selecciona una empresa...</option>
                <option value="carrier_1">Transportes del Norte</option>
                <option value="carrier_2">Logística Central</option>
              </select></div>
            )}

            {form.rol === 'independiente' && (
              <div style={s.grid2}>
                <div style={{marginBottom:'14px'}}><label style={s.lbl}>Placa</label><input style={s.inp} onChange={e => setForm({...form, placa: e.target.value})} /></div>
                <div style={{marginBottom:'14px'}}><label style={s.lbl}>Tipo</label><input style={s.inp} placeholder="Camión, Furgón..." onChange={e => setForm({...form, tipoVehiculo: e.target.value})} /></div>
              </div>
            )}

            <div style={{marginBottom:'14px'}}><label style={s.lbl}>Correo</label><input style={s.inp} type="email" onChange={e => setForm({...form, correo: e.target.value})} /></div>
            <div style={s.grid2}>
              <input style={s.inp} type="password" placeholder="Contraseña" onChange={e => setForm({...form, password: e.target.value})} />
              <input style={s.inp} type="password" placeholder="Confirmar" onChange={e => setForm({...form, passwordConfirm: e.target.value})} />
            </div>

            <div style={{ ...s.grid2, marginTop: '20px' }}>
              <button onClick={()=>setPaso(1)} style={s.btnSec}>Atrás</button>
              <button onClick={siguientePaso} style={s.btn}>Siguiente</button>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div>
            {obtenerDocsRequeridos().map(doc => (
              <div key={doc.key} style={{marginBottom:'12px'}}>
                <label style={s.lbl}>{doc.label}</label>
                <label style={s.fileBox(!!archivos[doc.key])}>
                  <input type="file" style={{display:'none'}} onChange={e => setArchivos({...archivos, [doc.key]: e.target.files[0]})} />
                  <span style={{fontSize:'12px', color:'#7A8FAD'}}>{archivos[doc.key] ? '✅ Archivo cargado' : 'Haga clic para subir'}</span>
                </label>
              </div>
            ))}
            <button onClick={siguientePaso} style={s.btn}>Revisar Datos</button>
          </div>
        )}

        {paso === 4 && (
          <div>
            <div style={{color:'white', background:'rgba(255,255,255,.03)', padding:'15px', borderRadius:'10px', marginBottom:'20px'}}>
              <p><strong>Perfil:</strong> {form.rol.toUpperCase()}</p>
              <p><strong>Usuario:</strong> {form.nombre}</p>
            </div>
            {errorApi && <p style={{color:'#EF4444', fontSize:'12px'}}>⚠️ {errorApi}</p>}
            <button onClick={enviarRegistro} disabled={cargando} style={s.btn}>{cargando ? 'Registrando...' : 'Finalizar Registro'}</button>
          </div>
        )}
      </div>
    </div>
  )
}