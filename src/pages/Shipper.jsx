import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api/shipper'
const RUTAS_API = 'https://cargoshare-api-production.up.railway.app/api/rutas'

const TARIFAS = {
  camioneta:  { furgon_seco: 85, estacas: 75, refrigerado: 135, congelado: 170 },
  furgon:     { furgon_seco: 110, refrigerado: 175, congelado: 210 },
  camion:     { furgon_seco: 135, estacas: 90, refrigerado: 210, congelado: 255, cisterna: 225, cama_baja: 245 },
  tractomula: { furgon_seco: 160, estacas: 110, refrigerado: 255, congelado: 305, cisterna: 265, cama_baja: 290 },
}
const KM_EXTRA = { camioneta: 850, furgon: 3300, camion: 9450, tractomula: 24000 }

function calcularPrecio(pesoReal, largo, ancho, alto, tipoVehiculo, carroceria, distanciaKm, kmExtra) {
  const pesoVol = largo * ancho * alto * 400
  const pesoCobrable = Math.max(pesoReal, pesoVol)
  const tarifa = TARIFAS[tipoVehiculo]?.[carroceria] || 110
  const precioBase = pesoCobrable * (distanciaKm / 100) * tarifa
  const recargoPorKmExtra = (kmExtra || 0) * (KM_EXTRA[tipoVehiculo] || 3300)
  const totalBase = precioBase + recargoPorKmExtra
  const precioEmpresa = totalBase * 1.35
  const comision = totalBase * 0.35
  const iva = comision * 0.19
  return {
    pesoCobrable: Math.round(pesoCobrable),
    precioBase: Math.round(precioBase),
    recargoPorKmExtra: Math.round(recargoPorKmExtra),
    precioEmpresa: Math.round(precioEmpresa),
    precioCarrier: Math.round(totalBase),
    comision: Math.round(comision),
    iva: Math.round(iva),
    total: Math.round(precioEmpresa + iva),
  }
}

const CARROCERIAS = [
  ['furgon_seco','📦','Furgón Seco'],['estacas','🪵','Estacas'],
  ['refrigerado','❄️','Refrigerado'],['congelado','🧊','Congelado'],
  ['cisterna','🛢️','Cisterna'],['cama_baja','🔩','Cama Baja'],
]
const TIPOS_CARGA = [
  ['general','📦','General'],['fragil','🔮','Frágil'],
  ['maquinaria','🏗️','Maquinaria'],['refrigerado','❄️','Refrigerado'],['congelado','🧊','Congelado'],
]

export default function Shipper() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || 'Empresa'

  const [vista, setVista] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [envios, setEnvios] = useState([])
  const [cargando, setCargando] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const [busqueda, setBusqueda] = useState({
    direccionRecogida: '', origen: '', destino: '',
    fechaNecesaria: '', horaNecesaria: '',
    tipoCarga: 'general', carroceriaNecesaria: 'furgon_seco',
    pesoReal: '', largo: '', ancho: '', alto: '',
  })

  const [rutasMatch, setRutasMatch] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [buscado, setBuscado] = useState(false)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  const [rutaSeleccionada, setRutaSeleccionada] = useState(null)
  const [precioDesglose, setPrecioDesglose] = useState(null)
  const [reservando, setReservando] = useState(false)
  const [reservado, setReservado] = useState(false)
  const [errorReserva, setErrorReserva] = useState('')

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    cargarDashboard()
  }, [])

  useEffect(() => {
    if (vista === 'dashboard') cargarDashboard()
    if (vista === 'envios' || vista === 'historial') cargarEnvios()
  }, [vista])

  async function cargarDashboard() {
    setCargando(true)
    try { const res = await fetch(`${API}/dashboard`, { headers }); const data = await res.json(); if (res.ok) setDashboard(data) } catch {}
    setCargando(false)
  }

  async function cargarEnvios() {
    setCargando(true)
    try { const res = await fetch(`${API}/envios`, { headers }); const data = await res.json(); if (res.ok) setEnvios(data) } catch {}
    setCargando(false)
  }

  async function buscarRutas() {
    if (!busqueda.origen || !busqueda.destino || !busqueda.pesoReal || !busqueda.carroceriaNecesaria) {
      setErrorBusqueda('Origen, destino, peso y tipo de carrocería son obligatorios'); return
    }
    setBuscando(true); setErrorBusqueda(''); setRutasMatch([]); setBuscado(false)
    try {
      const params = new URLSearchParams({ origen: busqueda.origen, destino: busqueda.destino, carroceria: busqueda.carroceriaNecesaria, peso: busqueda.pesoReal, fecha: busqueda.fechaNecesaria || '' })
      const res = await fetch(`${RUTAS_API}/buscar?${params}`, { headers })
      const data = await res.json()
      if (res.ok) { setRutasMatch(data); setBuscado(true) }
      else { setErrorBusqueda(data.error || 'Error al buscar') }
    } catch { setErrorBusqueda('Error de conexión') }
    setBuscando(false)
  }

  function seleccionarRuta(ruta) {
    setRutaSeleccionada(ruta)
    const peso = Number(busqueda.pesoReal) || 0
    const largo = Number(busqueda.largo) || 0.1
    const ancho = Number(busqueda.ancho) || 0.1
    const alto = Number(busqueda.alto) || 0.1
    setPrecioDesglose(calcularPrecio(peso, largo, ancho, alto, ruta.tipoVehiculo, ruta.carroceria, ruta.distanciaKm || 400, ruta.kmExtraRecogida || 0))
    setVista('confirmar-reserva')
  }

  async function confirmarReserva() {
    if (!rutaSeleccionada) return
    setReservando(true); setErrorReserva('')
    try {
      const res = await fetch(`${RUTAS_API}/reservar`, { method: 'POST', headers, body: JSON.stringify({ rutaId: rutaSeleccionada._id, direccionRecogida: busqueda.direccionRecogida, carga: { tipo: busqueda.tipoCarga, carroceriaNecesaria: busqueda.carroceriaNecesaria, pesoReal: Number(busqueda.pesoReal), largo: Number(busqueda.largo), ancho: Number(busqueda.ancho), alto: Number(busqueda.alto) }, fechaNecesaria: busqueda.fechaNecesaria, horaNecesaria: busqueda.horaNecesaria, precioTotal: precioDesglose.total, precioCarrier: precioDesglose.precioCarrier, comisionPlataforma: precioDesglose.comision, kmExtra: rutaSeleccionada.kmExtraRecogida || 0 }) })
      const data = await res.json()
      if (res.ok) { setReservado(true); setTimeout(() => { setReservado(false); setVista('envios'); setBuscado(false); setRutaSeleccionada(null) }, 2500) }
      else { setErrorReserva(data.error || 'Error al reservar') }
    } catch { setErrorReserva('Error de conexión') }
    setReservando(false)
  }

  function logout() { localStorage.clear(); navigate('/') }

  const initials = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const pesoVol = Number(busqueda.largo) * Number(busqueda.ancho) * Number(busqueda.alto) * 400
  const pesoCobrable = Math.max(Number(busqueda.pesoReal) || 0, pesoVol || 0)

  const navItems = [
    { id: 'dashboard', ic: '📊', label: 'Dashboard' },
    { id: 'nuevo', ic: '🔍', label: 'Buscar rutas' },
    { id: 'envios', ic: '📍', label: 'Envíos activos' },
    { id: 'historial', ic: '📋', label: 'Historial' },
    { id: 'config', ic: '⚙️', label: 'Configuración' },
  ]
  const titles = { dashboard: 'Dashboard', nuevo: 'Buscar rutas', 'confirmar-reserva': 'Confirmar reserva', envios: 'Envíos activos', historial: 'Historial', config: 'Configuración' }

  const s = {
    wrap: { display: 'flex', minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', color: 'white' },
    sidebar: { width: '240px', flexShrink: 0, background: '#0B1628', borderRight: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' },
    sbLogo: { padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' },
    logo: { fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: '800' },
    roleBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(249,115,22,.12)', border: '1px solid rgba(249,115,22,.2)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', color: '#F97316', fontWeight: '600', marginTop: '8px' },
    nav: { padding: '16px 12px', flex: 1 },
    navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '10px', marginBottom: '2px', fontSize: '13.5px', fontWeight: '500', color: active ? 'white' : '#7A8FAD', cursor: 'pointer', background: active ? 'rgba(37,99,235,.15)' : 'transparent', transition: '.2s', borderLeft: active ? '3px solid #F97316' : '3px solid transparent' }),
    sbUser: { padding: '14px', borderTop: '1px solid rgba(255,255,255,.07)', position: 'relative' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    userAv: { width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(249,115,22,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#F97316', flexShrink: 0 },
    userMenu: (open) => ({ position: 'absolute', bottom: '72px', left: '14px', right: '14px', background: '#0C1B35', border: '1px solid rgba(255,255,255,.12)', borderRadius: '12px', padding: '8px', display: open ? 'block' : 'none', zIndex: 10 }),
    umItem: (red) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: red ? '#EF4444' : '#B8C8DC' }),
    main: { flex: 1, display: 'flex', flexDirection: 'column' },
    topbar: { padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,14,28,.8)', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'sticky', top: 0 },
    content: { padding: '28px 32px', flex: 1, overflowY: 'auto' },
    h2: { fontFamily: 'Syne,sans-serif', fontSize: '26px', fontWeight: '800', letterSpacing: '-.8px', marginBottom: '4px' },
    p: { fontSize: '14px', color: '#7A8FAD', marginBottom: '28px' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' },
    kpi: { background: '#0E1E38', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '20px' },
    kpiLabel: { fontSize: '11px', color: '#7A8FAD', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' },
    kpiVal: (color) => ({ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }),
    panel: { background: '#0E1E38', border: '1px solid rgba(255,255,255,.07)', borderRadius: '18px', padding: '22px', marginBottom: '20px' },
    emptyState: { textAlign: 'center', padding: '48px 20px', color: '#7A8FAD' },
    inp: { width: '100%', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' },
    lbl: { fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' },
    fg: { marginBottom: '16px' },
    tipoBtn: (sel) => ({ border: `2px solid ${sel ? '#F97316' : 'rgba(255,255,255,.1)'}`, background: sel ? 'rgba(249,115,22,.08)' : 'transparent', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: sel ? '#F97316' : '#7A8FAD', transition: '.2s' }),
    tipoOpt: (sel) => ({ border: `2px solid ${sel ? '#F97316' : 'rgba(255,255,255,.1)'}`, background: sel ? 'rgba(249,115,22,.08)' : 'transparent', borderRadius: '12px', padding: '14px 8px', textAlign: 'center', cursor: 'pointer', transition: '.2s', flex: 1 }),
    badge: (estado) => ({ display: 'inline-flex', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: estado === 'completado' ? 'rgba(16,185,129,.12)' : estado === 'en_transito' ? 'rgba(37,99,235,.12)' : 'rgba(245,158,11,.12)', color: estado === 'completado' ? '#10B981' : estado === 'en_transito' ? '#60A5FA' : '#F59E0B' }),
    envioCard: { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '16px', marginBottom: '10px' },
    rutaCard: { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '18px', marginBottom: '12px' },
    desglose: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,.04)' },
  }

  return (
    <div style={s.wrap}>
      <aside style={s.sidebar}>
        <div style={s.sbLogo}>
          <div style={s.logo}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
          <div style={s.roleBadge}>📦 Empresa remitente</div>
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <div key={item.id} style={s.navItem(vista === item.id || (item.id === 'nuevo' && vista === 'confirmar-reserva'))} onClick={() => setVista(item.id)}>
              <span style={{ fontSize: '17px', width: '20px', textAlign: 'center' }}>{item.ic}</span>
              {item.label}
            </div>
          ))}
        </nav>
        <div style={s.sbUser}>
          <div style={s.userRow} onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div style={s.userAv}>{initials}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: '13px', fontWeight: '700' }}>{nombre}</div><div style={{ fontSize: '11px', color: '#7A8FAD' }}>Empresa</div></div>
            <span style={{ fontSize: '11px', color: '#7A8FAD' }}>▲</span>
          </div>
          <div style={s.userMenu(userMenuOpen)}>
            <div style={s.umItem(false)} onClick={() => { setVista('config'); setUserMenuOpen(false) }}>⚙️ Configuración</div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,.07)', margin: '6px 0' }}></div>
            <div style={s.umItem(true)} onClick={logout}>🚪 Cerrar sesión</div>
          </div>
        </div>
      </aside>

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: '800' }}>{titles[vista] || 'CargoShare'}</div>
            <div style={{ fontSize: '12px', color: '#7A8FAD' }}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <button onClick={() => setVista('nuevo')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🔍 Buscar rutas</button>
        </div>

        <div style={s.content}>

          {vista === 'dashboard' && (
            <div>
              <div style={s.h2}>Buen día, {nombre.split(' ')[0]} 👋</div>
              <div style={s.p}>Aquí está el resumen de tu actividad.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando datos...</div>
                : dashboard ? (<>
                  <div style={s.kpiGrid}>
                    <div style={s.kpi}><div style={s.kpiLabel}>📦 Total envíos</div><div style={s.kpiVal('#60A5FA')}>{dashboard.totalEnvios}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>🚚 Activos</div><div style={s.kpiVal('#F59E0B')}>{dashboard.enviosActivos}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>✅ Completados</div><div style={s.kpiVal('#10B981')}>{dashboard.enviosCompletados}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>💸 Gasto total</div><div style={s.kpiVal('#F97316')}>${dashboard.gastoTotal?.toLocaleString('es-CO')}</div></div>
                  </div>
                  <div style={s.panel}>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>🚀 ¿Cómo funciona?</div>
                    <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: '1.8' }}>
                      1️⃣ Busca rutas disponibles que van a tu destino<br />
                      2️⃣ Ingresa tu carga — el precio se calcula automático<br />
                      3️⃣ Reserva la ruta que más te convenga<br />
                      4️⃣ La empresa transportadora acepta en máx. 6 horas
                    </div>
                  </div>
                </>) : (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>Sin datos aún</div>
                    <button onClick={() => setVista('nuevo')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🔍 Buscar rutas</button>
                  </div>
                )}
            </div>
          )}

          {vista === 'nuevo' && (
            <div>
              <div style={s.h2}>Buscar rutas 🔍</div>
              <div style={s.p}>Ingresa los datos de tu carga y te mostramos las rutas disponibles con precio automático.</div>

              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📍 ¿De dónde a dónde?</div>
                <div style={s.fg}>
                  <label style={s.lbl}>Dirección exacta de recogida *</label>
                  <input style={s.inp} placeholder="Ej: Cra 30 #10-45, Bogotá" value={busqueda.direccionRecogida} onChange={e => setBusqueda({ ...busqueda, direccionRecogida: e.target.value })} />
                  <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '5px' }}>Desde aquí se calcula si hay km extra de recogida</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Ciudad de origen *</label><input style={s.inp} placeholder="Bogotá" value={busqueda.origen} onChange={e => setBusqueda({ ...busqueda, origen: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Ciudad de destino *</label><input style={s.inp} placeholder="Medellín" value={busqueda.destino} onChange={e => setBusqueda({ ...busqueda, destino: e.target.value })} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Fecha que necesitas</label><input type="date" style={s.inp} value={busqueda.fechaNecesaria} onChange={e => setBusqueda({ ...busqueda, fechaNecesaria: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Hora aproximada</label><input type="time" style={s.inp} value={busqueda.horaNecesaria} onChange={e => setBusqueda({ ...busqueda, horaNecesaria: e.target.value })} /></div>
                </div>
              </div>

              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>🚛 ¿Qué tipo de vehículo necesitas? *</div>
                <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '14px' }}>Solo verás rutas con este tipo de carrocería</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {CARROCERIAS.map(([val, ic, label]) => (
                    <button key={val} style={s.tipoBtn(busqueda.carroceriaNecesaria === val)} onClick={() => setBusqueda({ ...busqueda, carroceriaNecesaria: val })}>{ic} {label}</button>
                  ))}
                </div>
              </div>

              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📦 Datos de tu carga *</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '8px', marginBottom: '16px' }}>
                  {TIPOS_CARGA.map(([val, ic, label]) => (
                    <div key={val} style={s.tipoOpt(busqueda.tipoCarga === val)} onClick={() => setBusqueda({ ...busqueda, tipoCarga: val })}>
                      <div style={{ fontSize: '22px', marginBottom: '4px' }}>{ic}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#B8C8DC' }}>{label}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '12px' }}>
                  <div style={s.fg}><label style={s.lbl}>Peso real (kg) *</label><input type="number" style={s.inp} placeholder="500" value={busqueda.pesoReal} onChange={e => setBusqueda({ ...busqueda, pesoReal: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Largo (m)</label><input type="number" style={s.inp} placeholder="2.0" value={busqueda.largo} onChange={e => setBusqueda({ ...busqueda, largo: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Ancho (m)</label><input type="number" style={s.inp} placeholder="1.5" value={busqueda.ancho} onChange={e => setBusqueda({ ...busqueda, ancho: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Alto (m)</label><input type="number" style={s.inp} placeholder="1.2" value={busqueda.alto} onChange={e => setBusqueda({ ...busqueda, alto: e.target.value })} /></div>
                </div>
                {busqueda.pesoReal && busqueda.largo && busqueda.ancho && busqueda.alto && (
                  <div style={{ background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.12)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#60A5FA' }}>
                    📐 Peso volumétrico: <strong>{Math.round(pesoVol).toLocaleString('es-CO')} kg</strong>
                    {' · '}Peso cobrable: <strong>{Math.round(pesoCobrable).toLocaleString('es-CO')} kg</strong>
                    {pesoVol > Number(busqueda.pesoReal) && <span style={{ color: '#F59E0B' }}> ⚠️ Se cobra por volumen</span>}
                  </div>
                )}
              </div>

              {errorBusqueda && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>⚠️ {errorBusqueda}</div>}

              <button onClick={buscarRutas} disabled={buscando} style={{ background: '#F97316', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: buscando ? 0.7 : 1, marginBottom: '32px' }}>
                {buscando ? 'Buscando...' : '🔍 Buscar rutas disponibles →'}
              </button>

              {buscado && (
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>
                    {rutasMatch.length === 0 ? '😔 No encontramos rutas disponibles' : `✅ ${rutasMatch.length} ruta${rutasMatch.length > 1 ? 's' : ''} encontrada${rutasMatch.length > 1 ? 's' : ''}`}
                  </div>
                  {rutasMatch.length === 0 ? (
                    <div style={{ ...s.panel, ...s.emptyState }}>
                      <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔍</div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>Sin rutas disponibles ahora</div>
                      <div style={{ fontSize: '13px' }}>Intenta con fechas más flexibles o revisa más tarde</div>
                    </div>
                  ) : rutasMatch.map(r => {
                    const precio = calcularPrecio(Number(busqueda.pesoReal)||0, Number(busqueda.largo)||0.1, Number(busqueda.ancho)||0.1, Number(busqueda.alto)||0.1, r.tipoVehiculo, r.carroceria, r.distanciaKm||400, r.kmExtraRecogida||0)
                    return (
                      <div key={r._id} style={s.rutaCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <div style={{ fontSize: '15px', fontWeight: '700' }}>📍 {r.origen} → {r.destino}</div>
                            <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '3px' }}>{r.fechaSalida ? new Date(r.fechaSalida).toLocaleDateString('es-CO') : ''} · {r.horaSalida}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>🏢 {r.empresa?.nombre || 'Empresa verificada'} · ⭐ {r.empresa?.calificacion || '5.0'} · 📅 {r.empresa?.añosOperacion || '1'} año(s)</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: '800', color: '#F97316' }}>${precio.total.toLocaleString('es-CO')}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FAD' }}>COP total</div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#7A8FAD', flexWrap: 'wrap', marginBottom: '14px' }}>
                          <span>⚖️ {r.espacio?.pesoDisponible?.toLocaleString('es-CO')} kg disponibles</span>
                          <span>🚛 {r.carroceria?.replace('_', ' ')}</span>
                          {(r.kmExtraRecogida||0) > 0 ? <span style={{ color: '#F59E0B' }}>⚠️ {r.kmExtraRecogida} km extra (+${precio.recargoPorKmExtra.toLocaleString('es-CO')})</span> : <span style={{ color: '#10B981' }}>✅ Dentro del rango</span>}
                          {r.esExacto === false && <span style={{ color: '#60A5FA' }}>📅 Fecha similar</span>}
                        </div>
                        <button onClick={() => seleccionarRuta(r)} style={{ width: '100%', background: '#F97316', color: 'white', border: 'none', padding: '11px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>
                          Reservar esta ruta →
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {vista === 'confirmar-reserva' && rutaSeleccionada && precioDesglose && (
            <div>
              <div style={s.h2}>Confirmar reserva ✅</div>
              <div style={s.p}>Revisa el desglose antes de enviar la solicitud a la empresa transportadora.</div>

              {reservado && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '12px', padding: '20px', marginBottom: '20px', fontSize: '14px', color: '#10B981', textAlign: 'center' }}>✅ ¡Solicitud enviada! La empresa tiene 6 horas para responder.</div>}

              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px' }}>🚛 Ruta seleccionada</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    ['Ruta', `${rutaSeleccionada.origen} → ${rutaSeleccionada.destino}`],
                    ['Fecha salida', rutaSeleccionada.fechaSalida ? new Date(rutaSeleccionada.fechaSalida).toLocaleDateString('es-CO') : '-'],
                    ['Hora salida', rutaSeleccionada.horaSalida || '-'],
                    ['Carrocería', rutaSeleccionada.carroceria?.replace('_', ' ') || '-'],
                    ['Empresa', rutaSeleccionada.empresa?.nombre || 'Empresa verificada'],
                    ['Tu dirección recogida', busqueda.direccionRecogida || '-'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,.03)', borderRadius: '8px', padding: '10px 12px' }}>
                      <div style={{ fontSize: '10px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', marginBottom: '3px' }}>{k}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>💰 Desglose de precio</div>
                <div style={s.desglose}><span style={{ fontSize: '13px', color: '#7A8FAD' }}>Peso cobrable</span><span style={{ fontSize: '13px', fontWeight: '600' }}>{precioDesglose.pesoCobrable.toLocaleString('es-CO')} kg</span></div>
                <div style={s.desglose}><span style={{ fontSize: '13px', color: '#7A8FAD' }}>Flete base</span><span style={{ fontSize: '13px', fontWeight: '600' }}>${precioDesglose.precioBase.toLocaleString('es-CO')} COP</span></div>
                {precioDesglose.recargoPorKmExtra > 0 && <div style={s.desglose}><span style={{ fontSize: '13px', color: '#F59E0B' }}>Recargo km extra</span><span style={{ fontSize: '13px', fontWeight: '600', color: '#F59E0B' }}>+${precioDesglose.recargoPorKmExtra.toLocaleString('es-CO')} COP</span></div>}
                <div style={s.desglose}><span style={{ fontSize: '13px', color: '#7A8FAD' }}>Comisión CargoShare (35%)</span><span style={{ fontSize: '13px', fontWeight: '600' }}>${precioDesglose.comision.toLocaleString('es-CO')} COP</span></div>
                <div style={s.desglose}><span style={{ fontSize: '13px', color: '#7A8FAD' }}>IVA sobre comisión (19%)</span><span style={{ fontSize: '13px', fontWeight: '600' }}>${precioDesglose.iva.toLocaleString('es-CO')} COP</span></div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,.08)', margin: '10px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '15px', fontWeight: '700' }}>Total a pagar</span>
                  <span style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', color: '#F97316' }}>${precioDesglose.total.toLocaleString('es-CO')} COP</span>
                </div>
                <div style={{ fontSize: '11px', color: '#7A8FAD', lineHeight: '1.7' }}>
                  * El pago se procesa solo cuando la empresa acepte.<br />
                  * La empresa transportadora recibe ${precioDesglose.precioCarrier.toLocaleString('es-CO')} COP.
                </div>
              </div>

              {errorReserva && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>⚠️ {errorReserva}</div>}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button onClick={() => setVista('nuevo')} style={{ flex: 1, background: 'rgba(255,255,255,.05)', color: '#7A8FAD', border: '1px solid rgba(255,255,255,.1)', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>← Volver</button>
                <button onClick={confirmarReserva} disabled={reservando || reservado} style={{ flex: 2, background: '#F97316', color: 'white', border: 'none', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: reservando ? 0.7 : 1 }}>
                  {reservando ? 'Enviando...' : '✅ Confirmar y enviar solicitud →'}
                </button>
              </div>
            </div>
          )}

          {vista === 'envios' && (
            <div>
              <div style={s.h2}>Envíos activos 📍</div>
              <div style={s.p}>Tus envíos en curso.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando...</div>
                : envios.filter(v => v.estado !== 'completado').length === 0 ? (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>No tienes envíos activos</div>
                    <button onClick={() => setVista('nuevo')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🔍 Buscar rutas</button>
                  </div>
                ) : envios.filter(v => v.estado !== 'completado').map(v => (
                  <div key={v._id} style={s.envioCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: '700' }}>{v.origen} → {v.destino}</div>
                        <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{v.carga?.tipo || 'General'} · {v.carga?.pesoReal?.toLocaleString('es-CO') || 0} kg</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={s.badge(v.estado)}>{v.estado === 'en_transito' ? 'En tránsito' : v.estado === 'pendiente' ? '⏳ Esperando respuesta' : 'Activo'}</div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: '#F97316', marginTop: '4px' }}>${v.precioTotal?.toLocaleString('es-CO')} COP</div>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {vista === 'historial' && (
            <div>
              <div style={s.h2}>Historial 📋</div>
              <div style={s.p}>Todos tus envíos completados.</div>
              <div style={s.panel}>
                {envios.filter(v => v.estado === 'completado').length === 0 ? (
                  <div style={s.emptyState}><div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div><div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Sin historial aún</div></div>
                ) : envios.filter(v => v.estado === 'completado').map(v => (
                  <div key={v._id} style={{ ...s.envioCard, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '24px' }}>✅</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '700' }}>{v.origen} → {v.destino}</div><div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{new Date(v.fecha).toLocaleDateString('es-CO')}</div></div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>${v.precioTotal?.toLocaleString('es-CO')} COP</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {vista === 'config' && (
            <div>
              <div style={s.h2}>Configuración ⚙️</div>
              <div style={s.p}>Ajusta tu cuenta.</div>
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>🏢 Datos de la empresa</div>
                <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '4px' }}>Nombre</div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>{nombre}</div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,.06)', marginBottom: '20px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '14px', fontWeight: '600' }}>Cerrar sesión</div><div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>Salir de tu cuenta</div></div>
                  <button onClick={logout} style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,.25)', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🚪 Cerrar sesión</button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}