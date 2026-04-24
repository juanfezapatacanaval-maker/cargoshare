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
  })

  const [archivos, setArchivos] = useState({
    rut: null,
    camaraComercio: null,
    certRepresentacion: null,
    cedulaRep: null,
    habilitacionMT: null,
    polizaRC: null,
  })

  const [errores, setErrores] = useState({})

  const tiposEmpresa = [
    { id: 'empresa_remitente', ic: '📦', titulo: 'Empresa remitente', desc: 'Necesito enviar carga' },
    { id: 'empresa_flota', ic: '🚛', titulo: 'Empresa con flota', desc: 'Tengo camiones disponibles' },
    { id: 'ambas', ic: '🔄', titulo: 'Ambas', desc: 'Envio carga y tengo flota' },
  ]

  const necesitaFlota = form.rol === 'empresa_flota' || form.rol === 'ambas'

  function validarPaso2() {
    const e = {}
    if (!form.nombre.trim()) e.nombre = 'Obligatorio'
    if (!form.correo.includes('@')) e.correo = 'Correo invalido'
    if (form.password.length < 8) e.password = 'Minimo 8 caracteres'
    if (form.password !== form.passwordConfirm) e.passwordConfirm = 'Las contrasenas no coinciden'
    if (!form.nit.trim()) e.nit = 'Obligatorio'
    if (!form.correoEmpresa.includes('@')) e.correoEmpresa = 'Correo invalido'
    if (!form.telefono.trim()) e.telefono = 'Obligatorio'
    if (!form.ciudad.trim()) e.ciudad = 'Obligatorio'
    if (!form.fechaConstitucion) e.fechaConstitucion = 'Obligatorio'
    if (!form.nombreRepLegal.trim()) e.nombreRepLegal = 'Obligatorio'
    if (!form.cedulaRepLegal.trim()) e.cedulaRepLegal = 'Obligatorio'
    if (form.fechaConstitucion) {
      const anos = Math.floor((new Date() - new Date(form.fechaConstitucion)) / (1000 * 60 * 60 * 24 * 365))
      if (anos < 1) e.fechaConstitucion = 'La empresa debe tener minimo 1 ano de constitucion'
    }
    return e
  }

  function validarPaso3() {
    const e = {}
    if (!archivos.rut) e.rut = 'El RUT es obligatorio'
    if (!archivos.camaraComercio) e.camaraComercio = 'La Camara de Comercio es obligatoria'
    if (!archivos.certRepresentacion) e.certRepresentacion = 'El certificado es obligatorio'
    if (!archivos.cedulaRep) e.cedulaRep = 'La cedula del representante es obligatoria'
    if (necesitaFlota && !archivos.habilitacionMT) e.habilitacionMT = 'La habilitacion MinTransporte es obligatoria'
    if (necesitaFlota && !archivos.polizaRC) e.polizaRC = 'La poliza es obligatoria'
    return e
  }

  function siguientePaso() {
    if (paso === 1) {
      if (!form.rol) { setErrores({ rol: 'Selecciona el tipo de empresa' }); return }
      setErrores({}); setPaso(2)
    } else if (paso === 2) {
      const e = validarPaso2()
      if (Object.keys(e).length > 0) { setErrores(e); return }
      setErrores({}); setPaso(3)
    } else if (paso === 3) {
      const e = validarPaso3()
      if (Object.keys(e).length > 0) { setErrores(e); return }
      setErrores({}); setPaso(4)
    }
  }

  async function enviarRegistro() {
    setCargando(true); setErrorApi('')
    try {
      const formData = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v) })
      Object.entries(archivos).forEach(([k, v]) => { if (v) formData.append(k, v) })
      const res = await fetch(`${API}/register`, { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) { setErrorApi(data.error || 'Error al registrar'); setCargando(false); return }
      setEnviado(true)
    } catch { setErrorApi('Error de conexion con el servidor') }
    setCargando(false)
  }

  const calcularAnos = () => {
    if (!form.fechaConstitucion) return null
    return Math.floor((new Date() - new Date(form.fechaConstitucion)) / (1000 * 60 * 60 * 24 * 365))
  }

  const s = {
    wrap: { minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans,sans-serif', padding: '20px' },
    card: { background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '40px', width: '520px', maxWidth: '100%' },
    logo: { fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', color: 'white', marginBottom: '4px' },
    sub: { fontSize: '14px', color: '#7A8FAD', marginBottom: '28px' },
    inp: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    inpErr: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid #EF4444', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    lbl: { fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' },
    err: { fontSize: '11px', color: '#EF4444', marginTop: '4px' },
    fg: { marginBottom: '14px' },
    btn: { width: '100%', background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '15px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' },
    btnSec: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '12px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
    grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' },
    stepBar: { display: 'flex', gap: '6px', marginBottom: '24px' },
    step: (activo, completado) => ({ flex: 1, height: '4px', borderRadius: '100px', background: completado ? '#F97316' : activo ? '#F97316' : 'rgba(255,255,255,.1)', opacity: activo ? 1 : completado ? 1 : 0.4 }),
    fileBox: (tieneArchivo, hayError) => ({ width: '100%', background: tieneArchivo ? 'rgba(16,185,129,.06)' : 'rgba(255,255,255,.03)', border: `2px dashed ${hayError ? '#EF4444' : tieneArchivo ? '#10B981' : 'rgba(255,255,255,.15)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: '.2s', boxSizing: 'border-box' }),
  }

  if (enviado) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '26px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Solicitud enviada</div>
          <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: '1.7', marginBottom: '28px' }}>
            Recibimos tu solicitud para unirte a <strong style={{ color: 'white' }}>CargoShare</strong>.<br />
            Revisaremos tu informacion y en <strong style={{ color: '#F97316' }}>24 a 48 horas habiles</strong> recibiras un correo con la confirmacion.
          </div>
          <div style={{ background: 'rgba(255,255,255,.04)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
            <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '12px', fontWeight: '700', textTransform: 'uppercase' }}>Resumen</div>
            {[
              ['Empresa', form.razonSocial || form.nombre],
              ['NIT', form.nit],
              ['Correo', form.correo],
              ['Tipo', tiposEmpresa.find(t => t.id === form.rol)?.titulo],
              ['Ciudad', form.ciudad],
              ['Anos de operacion', `${calcularAnos()} ano${calcularAnos() !== 1 ? 's' : ''}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                <span style={{ color: '#7A8FAD' }}>{k}</span>
                <span style={{ fontWeight: '700', color: 'white' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(249,115,22,.08)', border: '1px solid rgba(249,115,22,.18)', borderRadius: '12px', padding: '14px', marginBottom: '24px', fontSize: '13px', color: 'rgba(255,200,140,.9)' }}>
            Correo de confirmacion: <strong>{form.correo}</strong>
          </div>
          <button onClick={() => navigate('/')} style={s.btn}>Volver al inicio</button>
          <div style={{ marginTop: '12px', fontSize: '13px', color: '#7A8FAD' }}>
            Ya tienes cuenta? <span style={{ color: '#60A5FA', cursor: 'pointer' }} onClick={() => navigate('/login')}>Iniciar sesion</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.card}>
        <div style={s.logo}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
        <div style={s.sub}>Registro de empresa - Fase 1</div>

        <div style={s.stepBar}>
          {[1, 2, 3, 4].map(n => (
            <div key={n} style={s.step(paso === n, paso > n)} />
          ))}
        </div>
        <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '20px' }}>
          Paso {paso} de 4 - {['', 'Tipo de empresa', 'Datos empresariales', 'Documentos', 'Confirmar'][paso]}
        </div>

        {/* PASO 1 */}
        {paso === 1 && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Que tipo de empresa eres?</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '20px' }}>Solo empresas con minimo 1 ano de constitucion pueden registrarse en esta fase.</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {tiposEmpresa.map(t => (
                <div key={t.id} onClick={() => setForm({ ...form, rol: t.id })}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', borderRadius: '14px', border: `2px solid ${form.rol === t.id ? '#F97316' : 'rgba(255,255,255,.1)'}`, background: form.rol === t.id ? 'rgba(249,115,22,.08)' : 'transparent', cursor: 'pointer', transition: '.2s' }}>
                  <div style={{ fontSize: '28px' }}>{t.ic}</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'white' }}>{t.titulo}</div>
                    <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{t.desc}</div>
                  </div>
                  {form.rol === t.id && <div style={{ marginLeft: 'auto', color: '#F97316', fontSize: '18px' }}>✓</div>}
                </div>
              ))}
            </div>
            {errores.rol && <div style={{ ...s.err, marginBottom: '12px' }}>⚠️ {errores.rol}</div>}
            <button onClick={siguientePaso} style={s.btn}>Continuar →</button>
            <div style={{ textAlign: 'center', marginTop: '14px', fontSize: '13px', color: '#7A8FAD' }}>
              Ya tienes cuenta? <span style={{ color: '#60A5FA', cursor: 'pointer' }} onClick={() => navigate('/login')}>Iniciar sesion</span>
            </div>
            <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '13px' }}>
              <span style={{ color: '#7A8FAD' }}>Eres conductor? </span>
              <span style={{ color: '#F97316', cursor: 'pointer', fontWeight: '700' }} onClick={() => navigate('/conductor')}>Registrate como conductor →</span>
            </div>
          </div>
        )}

        {/* PASO 2 */}
        {paso === 2 && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>Datos de la empresa</div>
            <div style={s.fg}>
              <label style={s.lbl}>Razon social *</label>
              <input style={errores.nombre ? s.inpErr : s.inp} placeholder="Textiles del Valle S.A.S" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value, razonSocial: e.target.value })} />
              {errores.nombre && <div style={s.err}>⚠️ {errores.nombre}</div>}
            </div>
            <div style={s.grid2}>
              <div style={s.fg}>
                <label style={s.lbl}>NIT *</label>
                <input style={errores.nit ? s.inpErr : s.inp} placeholder="900.123.456-7" value={form.nit} onChange={e => setForm({ ...form, nit: e.target.value })} />
                {errores.nit && <div style={s.err}>⚠️ {errores.nit}</div>}
              </div>
              <div style={s.fg}>
                <label style={s.lbl}>Ciudad *</label>
                <input style={errores.ciudad ? s.inpErr : s.inp} placeholder="Bogota" value={form.ciudad} onChange={e => setForm({ ...form, ciudad: e.target.value })} />
                {errores.ciudad && <div style={s.err}>⚠️ {errores.ciudad}</div>}
              </div>
            </div>
            <div style={s.fg}>
              <label style={s.lbl}>Direccion</label>
              <input style={s.inp} placeholder="Calle 13 #86-60, Zona Industrial" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
            </div>
            <div style={s.fg}>
              <label style={s.lbl}>Fecha de constitucion *</label>
              <input type="date" style={errores.fechaConstitucion ? s.inpErr : s.inp} value={form.fechaConstitucion} onChange={e => setForm({ ...form, fechaConstitucion: e.target.value })} />
              {errores.fechaConstitucion && <div style={s.err}>⚠️ {errores.fechaConstitucion}</div>}
              {form.fechaConstitucion && calcularAnos() >= 1 && (
                <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px' }}>✅ {calcularAnos()} ano{calcularAnos() !== 1 ? 's' : ''} de operacion</div>
              )}
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>👤 Representante legal</div>
              <div style={s.grid2}>
                <div style={s.fg}>
                  <label style={s.lbl}>Nombre *</label>
                  <input style={errores.nombreRepLegal ? s.inpErr : s.inp} placeholder="Carlos Garcia" value={form.nombreRepLegal} onChange={e => setForm({ ...form, nombreRepLegal: e.target.value })} />
                  {errores.nombreRepLegal && <div style={s.err}>⚠️ {errores.nombreRepLegal}</div>}
                </div>
                <div style={s.fg}>
                  <label style={s.lbl}>Cedula *</label>
                  <input style={errores.cedulaRepLegal ? s.inpErr : s.inp} placeholder="1234567890" value={form.cedulaRepLegal} onChange={e => setForm({ ...form, cedulaRepLegal: e.target.value })} />
                  {errores.cedulaRepLegal && <div style={s.err}>⚠️ {errores.cedulaRepLegal}</div>}
                </div>
              </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '16px', marginBottom: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>🔐 Acceso a la plataforma</div>
              <div style={s.fg}>
                <label style={s.lbl}>Correo corporativo *</label>
                <input type="email" style={errores.correoEmpresa ? s.inpErr : s.inp} placeholder="contacto@tuempresa.com" value={form.correoEmpresa} onChange={e => setForm({ ...form, correoEmpresa: e.target.value, correo: e.target.value })} />
                {errores.correoEmpresa && <div style={s.err}>⚠️ {errores.correoEmpresa}</div>}
              </div>
              <div style={s.fg}>
                <label style={s.lbl}>Telefono *</label>
                <input style={errores.telefono ? s.inpErr : s.inp} placeholder="+57 300 123 4567" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                {errores.telefono && <div style={s.err}>⚠️ {errores.telefono}</div>}
              </div>
              <div style={s.grid2}>
                <div style={s.fg}>
                  <label style={s.lbl}>Contrasena *</label>
                  <input type="password" style={errores.password ? s.inpErr : s.inp} placeholder="Minimo 8 caracteres" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                  {errores.password && <div style={s.err}>⚠️ {errores.password}</div>}
                </div>
                <div style={s.fg}>
                  <label style={s.lbl}>Confirmar contrasena *</label>
                  <input type="password" style={errores.passwordConfirm ? s.inpErr : s.inp} placeholder="Repite la contrasena" value={form.passwordConfirm} onChange={e => setForm({ ...form, passwordConfirm: e.target.value })} />
                  {errores.passwordConfirm && <div style={s.err}>⚠️ {errores.passwordConfirm}</div>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPaso(1)} style={s.btnSec}>Atras</button>
              <button onClick={siguientePaso} style={{ ...s.btn, marginTop: '8px' }}>Continuar →</button>
            </div>
          </div>
        )}

        {/* PASO 3 */}
        {paso === 3 && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Documentos requeridos</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '20px' }}>Sube PDF o imagen de cada documento. Maximo 10MB por archivo.</div>
            {[
              { key: 'rut', label: 'RUT activo y vigente', obligatorio: true },
              { key: 'camaraComercio', label: 'Camara de Comercio (max. 90 dias)', obligatorio: true },
              { key: 'certRepresentacion', label: 'Certificado de existencia y representacion legal', obligatorio: true },
              { key: 'cedulaRep', label: 'Cedula del representante legal', obligatorio: true },
              ...(necesitaFlota ? [
                { key: 'habilitacionMT', label: 'Habilitacion MinTransporte', obligatorio: true },
                { key: 'polizaRC', label: 'Poliza de responsabilidad civil contractual', obligatorio: true },
              ] : []),
            ].map(doc => (
              <div key={doc.key} style={{ marginBottom: '14px' }}>
                <label style={s.lbl}>{doc.label} {doc.obligatorio ? '*' : ''}</label>
                <label style={s.fileBox(!!archivos[doc.key], !!errores[doc.key])}>
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
                    onChange={e => { const file = e.target.files[0]; if (file) setArchivos({ ...archivos, [doc.key]: file }) }} />
                  {archivos[doc.key] ? (
                    <div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div>
                      <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>{archivos[doc.key].name}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>Click para cambiar</div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>📄</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD' }}>Click para subir PDF o imagen</div>
                    </div>
                  )}
                </label>
                {errores[doc.key] && <div style={s.err}>⚠️ {errores[doc.key]}</div>}
              </div>
            ))}
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setPaso(2)} style={s.btnSec}>Atras</button>
              <button onClick={siguientePaso} style={{ ...s.btn, marginTop: '8px' }}>Revisar y enviar →</button>
            </div>
          </div>
        )}

        {/* PASO 4 */}
        {paso === 4 && (
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Confirma tu solicitud</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '20px' }}>Revisa que todo este correcto antes de enviar.</div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '18px', marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Datos de la empresa</div>
              {[
                ['Tipo', tiposEmpresa.find(t => t.id === form.rol)?.titulo],
                ['Razon social', form.nombre],
                ['NIT', form.nit],
                ['Ciudad', form.ciudad],
                ['Anos de operacion', `${calcularAnos()} ano${calcularAnos() !== 1 ? 's' : ''}`],
                ['Rep. legal', form.nombreRepLegal],
                ['Correo corporativo', form.correoEmpresa],
                ['Telefono', form.telefono],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,.05)', fontSize: '13px' }}>
                  <span style={{ color: '#7A8FAD' }}>{k}</span>
                  <span style={{ fontWeight: '600', color: 'white' }}>{v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '18px', marginBottom: '20px' }}>
              <div style={{ fontSize: '12px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', marginBottom: '12px' }}>Documentos adjuntos</div>
              {Object.entries(archivos).filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', fontSize: '13px' }}>
                  <span style={{ color: '#10B981' }}>✅</span>
                  <span style={{ color: 'white' }}>{v.name}</span>
                </div>
              ))}
            </div>
            {errorApi && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>⚠️ {errorApi}</div>}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setPaso(3)} style={s.btnSec}>Atras</button>
              <button onClick={enviarRegistro} disabled={cargando} style={{ ...s.btn, marginTop: '8px', opacity: cargando ? 0.7 : 1 }}>
                {cargando ? 'Enviando solicitud...' : '✅ Enviar solicitud →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}