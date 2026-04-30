import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api/independiente'

function formatCOP(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

function formatTime(seg) {
  const h = Math.floor(seg / 3600)
  const m = Math.floor((seg % 3600) / 60)
  const s = seg % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

const COMISION = 0.20 // 20% CargoShare

const S = {
  page: { minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', color: 'white', maxWidth: '520px', margin: '0 auto' },
  nav: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'rgba(6,14,28,.95)', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'sticky', top: 0, zIndex: 100 },
  card: { background: '#0E1E38', border: '1px solid rgba(255,255,255,.08)', borderRadius: '16px', padding: '20px', marginBottom: '14px' },
  btn: (color = '#F97316', full = true) => ({ width: full ? '100%' : 'auto', background: color, border: 'none', color: 'white', padding: '13px 20px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', marginTop: '8px' }),
  btnOutline: { width: '100%', background: 'transparent', border: '1px solid rgba(255,255,255,.18)', color: 'white', padding: '12px 20px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer', marginTop: '8px' },
  inp: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '10px 13px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' },
  lbl: { fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '5px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid rgba(255,255,255,.05)' },
  tag: (c) => ({ display: 'inline-block', background: `${c}18`, border: `1px solid ${c}40`, color: c, fontSize: '11px', fontWeight: '700', padding: '3px 9px', borderRadius: '100px' }),
}

// ── REGISTRO ──────────────────────────────────────────────────────
function RegistroIndependiente({ onVolver }) {
  const [paso, setPaso] = useState(1)
  const [form, setForm] = useState({
    nombre: '', cedula: '', correo: '', telefono: '', ciudadBase: '',
    password: '', confirmar: '',
    placa: '', tipoVehiculo: 'camion_rigido', carroceria: '', marca: '', modelo: '', anio: '',
    capacidadKg: '', capacidadM3: '',
    categoriaLicencia: 'C1', vencimientoLicencia: '',
  })
  const [docs, setDocs] = useState({ fotoCedula: null, fotoLicencia: null, fotoVehiculo: null, tarjetaPropiedad: null, soat: null, tecnicoMecanica: null })
  const [error, setError] = useState('')
  const [exito, setExito] = useState(false)
  const [cargando, setCargando] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function enviar() {
    if (!form.nombre || !form.cedula || !form.correo || !form.password) { setError('Completa los campos obligatorios'); return }
    if (form.password !== form.confirmar) { setError('Las contrasenas no coinciden'); return }
    setCargando(true); setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v) })
      Object.entries(docs).forEach(([k, v]) => { if (v) fd.append(k, v) })
      const res = await fetch(`${API}/registro`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al enviar'); setCargando(false); return }
      setExito(true)
    } catch { setError('Error de conexion') }
    setCargando(false)
  }

  const fileField = (key, label) => (
    <div style={{ marginBottom: '12px' }}>
      <label style={S.lbl}>{label}</label>
      <div style={{ ...S.inp, padding: '10px', cursor: 'pointer', position: 'relative' }}>
        <input type="file" accept="image/*,.pdf" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} onChange={e => setDocs(d => ({ ...d, [key]: e.target.files[0] }))} />
        <span style={{ color: docs[key] ? '#10B981' : '#7A8FAD', fontSize: '13px' }}>{docs[key] ? `✅ ${docs[key].name}` : '📷 Subir archivo'}</span>
      </div>
    </div>
  )

  if (exito) return (
    <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'DM Sans,sans-serif' }}>
      <div style={{ textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Solicitud enviada!</div>
        <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: 1.6, marginBottom: '24px' }}>El admin revisara tu informacion. Te notificaremos por correo cuando seas aprobado.</div>
        <button onClick={onVolver} style={S.btn()}>Volver al login</button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', padding: '20px' }}>
      <div style={{ maxWidth: '460px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px', paddingTop: '20px' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', color: 'white' }}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
          <div style={{ fontSize: '13px', color: '#7A8FAD', marginTop: '4px' }}>Registro transportista independiente</div>
        </div>

        {/* Barra de pasos */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '20px' }}>
          {[1,2,3].map(n => <div key={n} style={{ flex: 1, height: '4px', borderRadius: '100px', background: paso >= n ? '#10B981' : 'rgba(255,255,255,.1)' }} />)}
        </div>
        <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '20px' }}>
          Paso {paso} de 3 — {['','Datos personales','Tu vehiculo','Documentos'][paso]}
        </div>

        <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '28px' }}>

          {/* PASO 1 — Datos personales */}
          {paso === 1 && (
            <>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Datos personales</div>
              {[['nombre','Nombre completo','text','Tu nombre completo'],['cedula','Cedula','number','1234567890'],['correo','Correo','email','tu@correo.com'],['telefono','Telefono','tel','3001234567'],['ciudadBase','Ciudad base','text','Bogota']].map(([k,lbl,type,ph]) => (
                <div key={k} style={{ marginBottom: '12px' }}>
                  <label style={S.lbl}>{lbl}</label>
                  <input style={S.inp} type={type} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '20px 0 16px' }}>Contrasena</div>
              {[['password','Contrasena','Minimo 8 caracteres'],['confirmar','Confirmar','Repite la contrasena']].map(([k,lbl,ph]) => (
                <div key={k} style={{ marginBottom: '12px' }}>
                  <label style={S.lbl}>{lbl}</label>
                  <input style={S.inp} type="password" placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <button onClick={() => { if (!form.nombre || !form.cedula || !form.correo || !form.password) { setError('Completa los campos'); return } if (form.password !== form.confirmar) { setError('Las contrasenas no coinciden'); return } setError(''); setPaso(2) }} style={S.btn('#10B981')}>Continuar →</button>
            </>
          )}

          {/* PASO 2 — Vehiculo */}
          {paso === 2 && (
            <>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Tu vehiculo</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={S.lbl}>Tipo de vehiculo</label>
                <select style={{ ...S.inp }} value={form.tipoVehiculo} onChange={e => set('tipoVehiculo', e.target.value)}>
                  <option value="camioneta">Camioneta</option>
                  <option value="furgon">Furgon</option>
                  <option value="camion_rigido">Camion rigido</option>
                  <option value="tractomula">Tractomula</option>
                </select>
              </div>
              {[['placa','Placa','ABC123'],['marca','Marca','Kenworth'],['modelo','Modelo','T800'],['anio','Ano','2018'],['capacidadKg','Capacidad en kg','10000'],['capacidadM3','Capacidad en m3','40']].map(([k,lbl,ph]) => (
                <div key={k} style={{ marginBottom: '12px' }}>
                  <label style={S.lbl}>{lbl}</label>
                  <input style={S.inp} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
                </div>
              ))}
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', margin: '20px 0 16px' }}>Licencia de conduccion</div>
              <div style={{ marginBottom: '12px' }}>
                <label style={S.lbl}>Categoria</label>
                <input style={S.inp} placeholder="C1, C2..." value={form.categoriaLicencia} onChange={e => set('categoriaLicencia', e.target.value)} />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={S.lbl}>Fecha de vencimiento</label>
                <input type="date" style={S.inp} value={form.vencimientoLicencia} onChange={e => set('vencimientoLicencia', e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPaso(1)} style={{ ...S.btnOutline, marginTop: '8px' }}>Atras</button>
                <button onClick={() => { setError(''); setPaso(3) }} style={S.btn('#10B981')}>Continuar →</button>
              </div>
            </>
          )}

          {/* PASO 3 — Documentos */}
          {paso === 3 && (
            <>
              <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Documentos</div>
              {fileField('fotoCedula', 'Foto de la cedula *')}
              {fileField('fotoLicencia', 'Foto de la licencia *')}
              {fileField('fotoVehiculo', 'Foto del vehiculo *')}
              {fileField('tarjetaPropiedad', 'Tarjeta de propiedad *')}
              {fileField('soat', 'SOAT vigente *')}
              {fileField('tecnicoMecanica', 'Revision tecnico-mecanica *')}
              {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '9px', padding: '11px', fontSize: '13px', color: '#EF4444', marginBottom: '12px' }}>{error}</div>}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPaso(2)} style={{ ...S.btnOutline, marginTop: '8px' }}>Atras</button>
                <button onClick={enviar} disabled={cargando} style={S.btn('#10B981')}>{cargando ? 'Enviando...' : 'Enviar solicitud →'}</button>
              </div>
            </>
          )}

          {error && paso < 3 && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '8px' }}>{error}</div>}
        </div>
        <button onClick={onVolver} style={{ ...S.btnOutline, marginTop: '12px' }}>← Volver al login</button>
      </div>
    </div>
  )
}

// ── CRONOMETRO ────────────────────────────────────────────────────
function Cronometro({ label, onStop }) {
  const [seg, setSeg] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [pausado, setPausado] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (corriendo && !pausado) { ref.current = setInterval(() => setSeg(s => s + 1), 1000) }
    else clearInterval(ref.current)
    return () => clearInterval(ref.current)
  }, [corriendo, pausado])

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '48px', fontWeight: '800', color: '#10B981', letterSpacing: '2px', marginBottom: '8px' }}>{formatTime(seg)}</div>
      <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '16px' }}>{label}</div>
      {!corriendo && <button onClick={() => setCorriendo(true)} style={S.btn('#10B981')}>▶ Iniciar</button>}
      {corriendo && !pausado && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <button onClick={() => setPausado(true)} style={{ ...S.btn('#FBBF24', false), width: '100%', marginTop: 0 }}>Pausar</button>
          <button onClick={() => { setCorriendo(false); clearInterval(ref.current); onStop(seg) }} style={{ ...S.btn('#EF4444', false), width: '100%', marginTop: 0 }}>STOP</button>
        </div>
      )}
      {pausado && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <button onClick={() => setPausado(false)} style={{ ...S.btn('#10B981', false), width: '100%', marginTop: 0 }}>▶ Reanudar</button>
          <button onClick={() => { setCorriendo(false); clearInterval(ref.current); onStop(seg) }} style={{ ...S.btn('#EF4444', false), width: '100%', marginTop: 0 }}>STOP</button>
        </div>
      )}
    </div>
  )
}

// ── GPS TRACKER ───────────────────────────────────────────────────
function GPSTracker({ solicitudId }) {
  useEffect(() => {
    if (!navigator.geolocation) return
    const id = navigator.geolocation.watchPosition(
      async (pos) => {
        try {
          await fetch(`${API}/solicitudes/${solicitudId}/ubicacion`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          })
        } catch (e) { }
      },
      (err) => console.log('GPS error:', err),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    )
    return () => navigator.geolocation.clearWatch(id)
  }, [solicitudId])

  return (
    <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '12px', padding: '10px 14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>📡</span>
      <span style={{ fontSize: '12px', color: '#10B981', fontWeight: '600' }}>GPS activo — ubicacion en tiempo real</span>
    </div>
  )
}

// ── PANEL PRINCIPAL ───────────────────────────────────────────────
function PanelIndependiente({ independiente, rutasActivas, token, onRefresh, onLogout }) {
  const [vista, setVista] = useState('inicio') // inicio | publicar | mis-rutas | viaje
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [reservaActiva, setReservaActiva] = useState(null)
  const [faseViaje, setFaseViaje] = useState('codigos') // codigos | cargue | ruta | entrega | descargue | cobro
  const [codigoInput, setCodigoInput] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [pagoInfo, setPagoInfo] = useState(null)

  // Calcular ingresos estimados de una ruta
  function calcularIngresos(ruta) {
    const reservasAceptadas = ruta.reservas?.filter(r => r.estado === 'aceptado' || r.estado === 'recogido') || []
    const totalBruto = reservasAceptadas.reduce((s, r) => s + (r.precioTotal || 0), 0)
    const totalNeto = reservasAceptadas.reduce((s, r) => s + (r.precioIndependiente || r.precioTotal * (1 - COMISION) || 0), 0)
    return { totalBruto, totalNeto, n: reservasAceptadas.length }
  }

  async function aceptarReserva(solicitudId, reservaId) {
    setCargando(true)
    try {
      const res = await fetch(`${API}/reservas/${solicitudId}/${reservaId}/aceptar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) onRefresh()
    } catch (e) { }
    setCargando(false)
  }

  async function rechazarReserva(solicitudId, reservaId) {
    setCargando(true)
    try {
      await fetch(`${API}/reservas/${solicitudId}/${reservaId}/rechazar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      onRefresh()
    } catch (e) { }
    setCargando(false)
  }

  async function verificarCodigo(solicitudId, reservaId, tipo) {
    setCargando(true); setError('')
    try {
      const res = await fetch(`${API}/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ solicitudId, reservaId, codigo: codigoInput.toUpperCase(), tipo })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Codigo incorrecto'); setCargando(false); return }
      if (tipo === 'recogida') setFaseViaje('cargue')
      if (tipo === 'entrega') {
        setPagoInfo(data.pagoUrl)
        setFaseViaje('cobro')
      }
      setCodigoInput('')
    } catch { setError('Error de conexion') }
    setCargando(false)
  }

  const veh = independiente.vehiculo

  return (
    <div style={{ padding: '16px 20px' }}>

      {/* TABS */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        {[['inicio','🏠','Inicio'],['publicar','➕','Publicar'],['mis-rutas','📋','Mis rutas']].map(([id,ic,lbl]) => (
          <button key={id} onClick={() => setVista(id)} style={{ background: vista === id ? '#F97316' : 'rgba(255,255,255,.06)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            {ic} {lbl}
          </button>
        ))}
      </div>

      {/* INICIO */}
      {vista === 'inicio' && (
        <>
          <div style={{ ...S.card, background: 'linear-gradient(135deg,#0E2B70,#0C1830)', border: '1px solid rgba(96,165,250,.2)', marginBottom: '16px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>👋</div>
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>Hola, {independiente.nombre}</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD' }}>{veh?.tipo} · Placa {veh?.placa} · {independiente.ciudadBase}</div>
          </div>

          {/* Resumen vehiculo */}
          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: '#F97316' }}>🚛 Mi vehiculo</div>
            {[['Tipo', veh?.tipo],['Placa', veh?.placa],['Marca/Modelo', `${veh?.marca || ''} ${veh?.modelo || ''}`],['Capacidad', `${veh?.capacidadKg} kg · ${veh?.capacidadM3} m³`]].map(([k,v]) => (
              <div key={k} style={S.row}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>{k}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Rutas activas resumen */}
          {rutasActivas.length > 0 && (
            <div style={S.card}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px', color: '#10B981' }}>📍 Rutas activas</div>
              {rutasActivas.map((sol, i) => {
                const ing = calcularIngresos(sol)
                const pendientes = sol.reservas?.filter(r => r.estado === 'pendiente').length || 0
                return (
                  <div key={i} style={{ background: 'rgba(255,255,255,.04)', borderRadius: '10px', padding: '12px', marginBottom: '10px', cursor: 'pointer' }}
                    onClick={() => { setRutaSeleccionada(sol); setVista('mis-rutas') }}>
                    <div style={{ fontWeight: '700', fontSize: '14px' }}>{sol.ruta?.origen} → {sol.ruta?.destino}</div>
                    <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '4px' }}>{ing.n} empresa{ing.n !== 1 ? 's' : ''} aceptada{ing.n !== 1 ? 's' : ''} · {pendientes > 0 ? <span style={{ color: '#FBBF24' }}>{pendientes} pendiente{pendientes !== 1 ? 's' : ''}</span> : 'Sin pendientes'}</div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginTop: '6px' }}>Ingresos estimados: {formatCOP(ing.totalNeto)}</div>
                  </div>
                )
              })}
            </div>
          )}

          <button onClick={onLogout} style={{ ...S.btnOutline, marginTop: '8px' }}>Cerrar sesion</button>
        </>
      )}

      {/* PUBLICAR RUTA */}
      {vista === 'publicar' && (
        <PublicarRuta token={token} onPublicado={() => { onRefresh(); setVista('mis-rutas') }} />
      )}

      {/* MIS RUTAS */}
      {vista === 'mis-rutas' && (
        <MisRutas
          token={token}
          rutasActivas={rutasActivas}
          onAceptar={aceptarReserva}
          onRechazar={rechazarReserva}
          onIniciarViaje={(sol, res) => { setRutaSeleccionada(sol); setReservaActiva(res); setFaseViaje('codigos'); setVista('viaje') }}
          cargando={cargando}
        />
      )}

      {/* VIAJE ACTIVO */}
      {vista === 'viaje' && rutaSeleccionada && reservaActiva && (
        <ViajeActivo
          solicitud={rutaSeleccionada}
          reserva={reservaActiva}
          fase={faseViaje}
          codigoInput={codigoInput}
          setCodigoInput={setCodigoInput}
          onVerificar={verificarCodigo}
          onCargueStop={(seg) => setFaseViaje('ruta')}
          onDescargueStop={(seg) => { }}
          pagoInfo={pagoInfo}
          error={error}
          cargando={cargando}
          onVolver={() => { setVista('mis-rutas'); setReservaActiva(null); onRefresh() }}
        />
      )}
    </div>
  )
}

// ── PUBLICAR RUTA ─────────────────────────────────────────────────
function PublicarRuta({ token, onPublicado }) {
  const [form, setForm] = useState({
    origen: '', destino: '', fechaSalida: '', horaSalida: '',
    direccionSalida: '', rangoRecogida: '10',
    pesoMax: '', volumenMax: '',
  })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const [modal, setModal] = useState(null) // null | 'pregunta' | 'form'
  const [rutaData, setRutaData] = useState(null)
  const [formRetorno, setFormRetorno] = useState({ fechaSalida: '', horaSalida: '', direccionSalida: '', rangoRecogida: 10 })
  const [publicandoRetorno, setPublicandoRetorno] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  async function publicar() {
    if (!form.origen || !form.destino || !form.fechaSalida || !form.horaSalida || !form.pesoMax) {
      setError('Completa los campos obligatorios'); return
    }
    setCargando(true); setError('')
    try {
      const res = await fetch(`${API}/publicar-ruta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Error al publicar'); setCargando(false); return }
      setRutaData({ origen: form.origen, destino: form.destino })
      setForm({ origen: '', destino: '', fechaSalida: '', horaSalida: '', direccionSalida: '', rangoRecogida: '10', pesoMax: '', volumenMax: '' })
      setModal('pregunta')
    } catch { setError('Error de conexion') }
    setCargando(false)
  }

  async function publicarRetorno() {
    if (!formRetorno.fechaSalida || !formRetorno.horaSalida) { alert('Ingresa fecha y hora de regreso'); return }
    setPublicandoRetorno(true)
    try {
      await fetch(`${API}/publicar-ruta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          origen: rutaData.destino,
          destino: rutaData.origen,
          fechaSalida: formRetorno.fechaSalida,
          horaSalida: formRetorno.horaSalida,
          direccionSalida: formRetorno.direccionSalida || rutaData.destino,
          rangoRecogida: String(formRetorno.rangoRecogida),
          pesoMax: form.pesoMax || '10000',
          volumenMax: form.volumenMax || '',
        })
      })
    } catch (e) { console.log(e) }
    setPublicandoRetorno(false)
    setModal(null)
    onPublicado()
  }

  const inp = { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 13px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
  const lbl = { fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }

  return (
    <>
      <div style={S.card}>
        <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '20px' }}>📍 Publicar nueva ruta</div>
        {[['origen','Origen *','Bogota'],['destino','Destino *','Medellin'],['direccionSalida','Direccion exacta de salida','Calle 13 #86-60']].map(([k,lb,ph]) => (
          <div key={k} style={{ marginBottom: '12px' }}>
            <label style={S.lbl}>{lb}</label>
            <input style={S.inp} placeholder={ph} value={form[k]} onChange={e => set(k, e.target.value)} />
          </div>
        ))}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div><label style={S.lbl}>Fecha *</label><input type="date" style={S.inp} value={form.fechaSalida} onChange={e => set('fechaSalida', e.target.value)} /></div>
          <div><label style={S.lbl}>Hora *</label><input type="time" style={S.inp} value={form.horaSalida} onChange={e => set('horaSalida', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <div><label style={S.lbl}>Rango (km)</label><input style={S.inp} type="number" placeholder="10" value={form.rangoRecogida} onChange={e => set('rangoRecogida', e.target.value)} /></div>
          <div><label style={S.lbl}>Peso max (kg) *</label><input style={S.inp} type="number" placeholder="10000" value={form.pesoMax} onChange={e => set('pesoMax', e.target.value)} /></div>
          <div><label style={S.lbl}>Volumen (m3)</label><input style={S.inp} type="number" placeholder="40" value={form.volumenMax} onChange={e => set('volumenMax', e.target.value)} /></div>
        </div>
        {error && <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '12px' }}>{error}</div>}
        <button onClick={publicar} disabled={cargando} style={S.btn()}>{cargando ? 'Publicando...' : 'Publicar ruta →'}</button>
      </div>

      {/* MODAL RETORNO */}
      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '32px', width: '100%', maxWidth: '420px' }}>

            {modal === 'pregunta' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔄</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '20px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Ruta publicada!</div>
                  <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: 1.6 }}>
                    Tu ruta <strong style={{ color: 'white' }}>{rutaData?.origen} → {rutaData?.destino}</strong> ya esta disponible.
                  </div>
                </div>
                <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: '14px', padding: '18px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981', marginBottom: '6px' }}>🚚 Aprovecha el regreso</div>
                  <div style={{ fontSize: '13px', color: '#7A8FAD', lineHeight: 1.6 }}>
                    Publica tambien <strong style={{ color: 'white' }}>{rutaData?.destino} → {rutaData?.origen}</strong> y llena tu camion de vuelta. La mayoria de camiones regresan vacios.
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => { setModal(null); onPublicado() }} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    No, gracias
                  </button>
                  <button onClick={() => setModal('form')} style={{ background: '#10B981', border: 'none', color: 'white', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
                    Si, publicar retorno →
                  </button>
                </div>
              </>
            )}

            {modal === 'form' && (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'Syne,sans-serif', color: 'white', marginBottom: '4px' }}>Datos del retorno</div>
                  <div style={{ fontSize: '13px', color: '#7A8FAD' }}>Ruta: <strong style={{ color: '#10B981' }}>{rutaData?.destino} → {rutaData?.origen}</strong></div>
                </div>
                <div style={{ marginBottom: '13px' }}>
                  <label style={lbl}>Fecha de regreso *</label>
                  <input type="date" style={inp} value={formRetorno.fechaSalida} onChange={e => setFormRetorno(f => ({ ...f, fechaSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '13px' }}>
                  <label style={lbl}>Hora de salida *</label>
                  <input type="time" style={inp} value={formRetorno.horaSalida} onChange={e => setFormRetorno(f => ({ ...f, horaSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '13px' }}>
                  <label style={lbl}>Direccion desde {rutaData?.destino}</label>
                  <input style={inp} placeholder={'Ej: Calle 50 #30-10, ' + (rutaData?.destino || '')} value={formRetorno.direccionSalida} onChange={e => setFormRetorno(f => ({ ...f, direccionSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '22px' }}>
                  <label style={lbl}>Rango de recogida: <strong style={{ color: 'white' }}>{formRetorno.rangoRecogida} km</strong></label>
                  <input type="range" min="0" max="80" step="5" value={formRetorno.rangoRecogida} onChange={e => setFormRetorno(f => ({ ...f, rangoRecogida: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#10B981', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => setModal('pregunta')} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                    ← Atras
                  </button>
                  <button onClick={publicarRetorno} disabled={publicandoRetorno} style={{ background: publicandoRetorno ? 'rgba(16,185,129,.5)' : '#10B981', border: 'none', color: 'white', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: publicandoRetorno ? 'not-allowed' : 'pointer' }}>
                    {publicandoRetorno ? 'Publicando...' : 'Publicar retorno →'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}

// ── MIS RUTAS ─────────────────────────────────────────────────────
function MisRutas({ rutasActivas, onAceptar, onRechazar, onIniciarViaje, cargando }) {
  if (rutasActivas.length === 0) {
    return (
      <div style={{ ...S.card, textAlign: 'center', color: '#7A8FAD', padding: '40px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>📭</div>
        <div style={{ fontSize: '14px' }}>No tienes rutas activas aun</div>
        <div style={{ fontSize: '12px', marginTop: '6px' }}>Publica tu primera ruta para empezar a recibir solicitudes</div>
      </div>
    )
  }

  return (
    <>
      {rutasActivas.map((sol, i) => {
        const reservasPendientes = sol.reservas?.filter(r => r.estado === 'pendiente') || []
        const reservasAceptadas = sol.reservas?.filter(r => ['aceptado','recogido'].includes(r.estado)) || []
        const totalNeto = reservasAceptadas.reduce((s, r) => s + (r.precioIndependiente || (r.precioTotal * (1 - COMISION)) || 0), 0)

        return (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
              <div>
                <div style={{ fontWeight: '800', fontSize: '16px' }}>{sol.ruta?.origen} → {sol.ruta?.destino}</div>
                <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '3px' }}>
                  {sol.ruta?.fechaSalida ? new Date(sol.ruta.fechaSalida).toLocaleDateString('es-CO') : ''} · {sol.ruta?.horaSalida}
                </div>
              </div>
              <span style={S.tag('#10B981')}>Activa</span>
            </div>

            {/* Ingresos estimados */}
            {reservasAceptadas.length > 0 && (
              <div style={{ background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.2)', borderRadius: '10px', padding: '12px', marginBottom: '14px' }}>
                <div style={{ fontSize: '11px', color: '#7A8FAD', marginBottom: '4px' }}>💰 Tus ingresos estimados ({reservasAceptadas.length} empresa{reservasAceptadas.length !== 1 ? 's' : ''})</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: '#10B981' }}>{formatCOP(totalNeto)}</div>
                <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>CargoShare ya descontio su comision</div>
              </div>
            )}

            {/* Solicitudes pendientes */}
            {reservasPendientes.length > 0 && (
              <div style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', color: '#FBBF24', fontWeight: '700', marginBottom: '8px' }}>⏳ {reservasPendientes.length} solicitud{reservasPendientes.length !== 1 ? 'es' : ''} pendiente{reservasPendientes.length !== 1 ? 's' : ''}</div>
                {reservasPendientes.map((r, j) => (
                  <div key={j} style={{ background: 'rgba(251,191,36,.06)', border: '1px solid rgba(251,191,36,.2)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Empresa solicitante</div>
                    <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '2px' }}>Recogida: {r.direccionRecogida}</div>
                    <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '10px' }}>Recibirias: <strong style={{ color: '#10B981' }}>{formatCOP((r.precioTotal || 0) * (1 - COMISION))}</strong></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <button onClick={() => onAceptar(sol._id, r._id)} disabled={cargando} style={{ ...S.btn('#10B981', false), width: '100%', marginTop: 0, fontSize: '12px', padding: '8px' }}>✅ Aceptar</button>
                      <button onClick={() => onRechazar(sol._id, r._id)} disabled={cargando} style={{ ...S.btn('#EF4444', false), width: '100%', marginTop: 0, fontSize: '12px', padding: '8px' }}>❌ Rechazar</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Empresas aceptadas — ir a viaje */}
            {reservasAceptadas.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', color: '#10B981', fontWeight: '700', marginBottom: '8px' }}>✅ {reservasAceptadas.length} empresa{reservasAceptadas.length !== 1 ? 's' : ''} aceptada{reservasAceptadas.length !== 1 ? 's' : ''}</div>
                {reservasAceptadas.map((r, j) => (
                  <div key={j} style={{ background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.15)', borderRadius: '10px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', marginBottom: '4px' }}>Empresa {j + 1}</div>
                    <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '8px' }}>Recogida: {r.direccionRecogida}</div>
                    {r.estado === 'aceptado' && (
                      <button onClick={() => onIniciarViaje(sol, r)} style={{ ...S.btn('#F97316'), marginTop: 0, fontSize: '12px', padding: '9px' }}>
                        🔑 Iniciar recogida empresa {j + 1}
                      </button>
                    )}
                    {r.estado === 'recogido' && <span style={S.tag('#60A5FA')}>En ruta ✓</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

// ── VIAJE ACTIVO ──────────────────────────────────────────────────
function ViajeActivo({ solicitud, reserva, fase, codigoInput, setCodigoInput, onVerificar, onCargueStop, pagoInfo, error, cargando, onVolver }) {
  const abrirMaps = (dir) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dir)}`, '_blank')
  const abrirWaze = (dir) => window.open(`https://waze.com/ul?q=${encodeURIComponent(dir)}`, '_blank')

  return (
    <div>
      {fase === 'ruta' && <GPSTracker solicitudId={solicitud._id} />}

      {/* CODIGO RECOGIDA */}
      {fase === 'codigos' && (
        <>
          <div style={{ ...S.card, textAlign: 'center', background: 'rgba(37,99,235,.1)', border: '1px solid rgba(96,165,250,.25)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔑</div>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Codigo de recogida</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '16px' }}>Pideselo a la empresa cuando llegues</div>
            <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '12px' }}>📍 {reserva.direccionRecogida}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              <button onClick={() => abrirMaps(reserva.direccionRecogida)} style={{ ...S.btn('#2563EB', false), width: '100%', marginTop: 0, fontSize: '12px' }}>🗺 Maps</button>
              <button onClick={() => abrirWaze(reserva.direccionRecogida)} style={{ ...S.btn('#00CAFF', false), width: '100%', marginTop: 0, fontSize: '12px', color: '#060E1C' }}>🚗 Waze</button>
            </div>
            <input
              style={{ ...S.inp, fontSize: '20px', fontFamily: 'monospace', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center', marginBottom: '8px' }}
              placeholder="XXXXXX" maxLength={8}
              value={codigoInput} onChange={e => setCodigoInput(e.target.value.toUpperCase())}
            />
            {error && <div style={{ color: '#EF4444', fontSize: '12px', marginBottom: '8px' }}>{error}</div>}
            <button onClick={() => onVerificar(solicitud._id, reserva._id, 'recogida')} disabled={cargando} style={S.btn()}>
              {cargando ? 'Verificando...' : 'Confirmar codigo →'}
            </button>
          </div>
        </>
      )}

      {/* CARGUE */}
      {fase === 'cargue' && (
        <div style={S.card}>
          <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px', textAlign: 'center', color: '#10B981' }}>✅ Codigo verificado — Cronometro de cargue</div>
          <Cronometro label="Tiempo de cargue" onStop={onCargueStop} />
        </div>
      )}

      {/* EN RUTA */}
      {fase === 'ruta' && (
        <>
          <div style={{ ...S.card, background: 'linear-gradient(135deg,rgba(37,99,235,.15),rgba(6,14,28,.9))', border: '1px solid rgba(96,165,250,.25)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚛</div>
            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>En ruta</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD' }}>{solicitud.ruta?.origen} → {solicitud.ruta?.destino}</div>
          </div>
          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🏁 Punto de entrega</div>
            <div style={{ fontSize: '14px', color: '#C8D4E3', marginBottom: '12px' }}>{reserva.direccionEntrega}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => abrirMaps(reserva.direccionEntrega)} style={{ ...S.btn('#2563EB', false), width: '100%', marginTop: 0, fontSize: '13px' }}>🗺 Google Maps</button>
              <button onClick={() => abrirWaze(reserva.direccionEntrega)} style={{ ...S.btn('#00CAFF', false), width: '100%', marginTop: 0, fontSize: '13px', color: '#060E1C' }}>🚗 Waze</button>
            </div>
          </div>
          <button onClick={() => { /* cambiar fase a entrega */ onVerificar && setCodigoInput && null }} style={S.btn('#10B981')}>Llegue al destino →</button>
        </>
      )}

      {/* COBRO */}
      {fase === 'cobro' && (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: '800', marginBottom: '8px' }}>Entrega completada!</div>
          <div style={{ fontSize: '14px', color: '#7A8FAD', marginBottom: '24px' }}>Muestra el link de pago a la empresa</div>
          {pagoInfo && (
            <a href={pagoInfo} target="_blank" rel="noreferrer"
              style={{ display: 'block', background: '#10B981', color: 'white', padding: '16px', borderRadius: '12px', fontFamily: 'DM Sans,sans-serif', fontSize: '16px', fontWeight: '800', textDecoration: 'none', textAlign: 'center', marginBottom: '12px' }}>
              💳 Pagar con Wompi →
            </a>
          )}
          <button onClick={onVolver} style={S.btn()}>Volver a mis rutas →</button>
        </div>
      )}

      <button onClick={onVolver} style={{ ...S.btnOutline, marginTop: '12px' }}>← Volver</button>
    </div>
  )
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────
export default function Independiente() {
  const [estado, setEstado] = useState('loading')
  const [independiente, setIndependiente] = useState(null)
  const [rutasActivas, setRutasActivas] = useState([])
  const [token, setToken] = useState(null)
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('registro') === 'true') { setEstado('registro'); return }
    const t = localStorage.getItem('independiente_token')
    if (t) { setToken(t); cargarPerfil(t) }
    else setEstado('login')
  }, [])

  async function cargarPerfil(t) {
    try {
      const res = await fetch(`${API}/perfil`, { headers: { 'Authorization': `Bearer ${t}` } })
      if (!res.ok) { localStorage.removeItem('independiente_token'); setEstado('login'); return }
      const data = await res.json()
      setIndependiente(data.independiente)
      setRutasActivas(data.rutasActivas || [])
      setEstado('panel')
    } catch { setEstado('login') }
  }

  async function handleLogin() {
    if (!cedula || !password) { setError('Ingresa tu cedula y contrasena'); return }
    setCargando(true); setError('')
    try {
      const res = await fetch(`${API}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password })
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.error === 'pendiente') setError('Tu solicitud esta pendiente de aprobacion.')
        else if (data.error === 'rechazado') setError('Tu solicitud fue rechazada.')
        else setError(data.error || 'Credenciales incorrectas')
        setCargando(false); return
      }
      localStorage.setItem('independiente_token', data.token)
      setToken(data.token)
      await cargarPerfil(data.token)
      setCargando(false)
    } catch { setError('Error de conexion'); setCargando(false) }
  }

  function handleLogout() {
    localStorage.removeItem('independiente_token')
    setEstado('login'); setIndependiente(null); setToken(null)
  }

  if (estado === 'registro') return <RegistroIndependiente onVolver={() => setEstado('login')} />

  if (estado === 'login') return (
    <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'DM Sans,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '28px', fontWeight: '800', color: 'white' }}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
          <div style={{ fontSize: '14px', color: '#7A8FAD', marginTop: '4px' }}>Panel Transportista Independiente</div>
        </div>
        <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚚</div>
            <div style={{ fontSize: '18px', fontWeight: '700' }}>Acceso independiente</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', marginTop: '4px' }}>Ingresa con tu cedula</div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={S.lbl}>Numero de cedula</label>
            <input style={S.inp} type="number" placeholder="1234567890" value={cedula} onChange={e => setCedula(e.target.value)} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={S.lbl}>Contrasena</label>
            <input style={S.inp} type="password" placeholder="Tu contrasena" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          {error && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '9px', padding: '11px', fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>{error}</div>}
          <button onClick={handleLogin} disabled={cargando} style={S.btn('#10B981')}>
            {cargando ? 'Iniciando sesion...' : 'Entrar →'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#7A8FAD' }}>
            Primera vez?{' '}
            <span style={{ color: '#10B981', cursor: 'pointer', fontWeight: '700' }} onClick={() => setEstado('registro')}>Solicitar acceso →</span>
          </div>
          <button onClick={() => navigate('/login')} style={{ ...S.btnOutline, marginTop: '12px', fontSize: '13px' }}>← Volver al login</button>
        </div>
      </div>
    </div>
  )

  if (estado === 'loading') return (
    <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8FAD' }}>Cargando...</div>
  )

  return (
    <div style={S.page}>
      <div style={S.nav}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '16px', fontWeight: '800' }}>
          Cargo<span style={{ color: '#F97316' }}>Share</span>
          <span style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '400', marginLeft: '8px' }}>Independiente</span>
        </div>
        {independiente && (
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16,185,129,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#10B981' }}>
            {independiente.nombre?.[0]?.toUpperCase()}
          </div>
        )}
      </div>
      {estado === 'panel' && independiente && (
        <PanelIndependiente
          independiente={independiente}
          rutasActivas={rutasActivas}
          token={token}
          onRefresh={() => cargarPerfil(token)}
          onLogout={handleLogout}
        />
      )}
    </div>
  )
}