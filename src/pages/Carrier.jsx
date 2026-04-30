import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api/carrier'
const RUTAS_API = 'https://cargoshare-api-production.up.railway.app/api/rutas'
const VEHICULO_API = 'https://cargoshare-api-production.up.railway.app/api/vehiculo'
const CONDUCTOR_API = 'https://cargoshare-api-production.up.railway.app/api/conductor'
const CONDUCTOR_AFILIADO_API = 'https://cargoshare-api-production.up.railway.app/api/conductor-afiliado'

const CARROCERIAS_POR_TIPO = {
  camioneta:  [['furgon_seco','📦 Furgon Seco'], ['estacas','🪵 Estacas'], ['refrigerado','❄️ Refrigerado'], ['congelado','🧊 Congelado']],
  furgon:     [['furgon_seco','📦 Furgon Seco'], ['refrigerado','❄️ Refrigerado'], ['congelado','🧊 Congelado']],
  camion:     [['furgon_seco','📦 Furgon Seco'], ['estacas','🪵 Estacas'], ['refrigerado','❄️ Refrigerado'], ['congelado','🧊 Congelado'], ['cisterna','🛢️ Cisterna'], ['cama_baja','🔩 Cama Baja']],
  tractomula: [['furgon_seco','📦 Furgon Seco'], ['estacas','🪵 Estacas'], ['refrigerado','❄️ Refrigerado'], ['congelado','🧊 Congelado'], ['cisterna','🛢️ Cisterna'], ['cama_baja','🔩 Cama Baja']],
}

// ─── MAPA GPS LEAFLET ─────────────────────────────────────────────
function MapaGPS({ solicitudId, origen, destino }) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markerRef = useRef(null)
  const [ubicacion, setUbicacion] = useState(null)
  const [sinSenal, setSinSenal] = useState(false)

  useEffect(() => {
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link')
      link.id = 'leaflet-css'
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(link)
    }
  }, [])

  useEffect(() => {
    let cancelado = false
    async function fetchUbicacion() {
      try {
        const res = await fetch(`${RUTAS_API}/solicitudes/${solicitudId}/ubicacion`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
        if (!res.ok) return
        const data = await res.json()
        if (!cancelado && data.ubicacionActual?.lat) {
          setUbicacion(data.ubicacionActual)
          setSinSenal(false)
        } else if (!cancelado) {
          setSinSenal(true)
        }
      } catch { }
    }
    fetchUbicacion()
    const interval = setInterval(fetchUbicacion, 5000)
    return () => { cancelado = true; clearInterval(interval) }
  }, [solicitudId])

  useEffect(() => {
    if (!ubicacion || !mapRef.current) return
    import('leaflet').then(L => {
      const Lm = L.default || L
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = Lm.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([ubicacion.lat, ubicacion.lng], 13)
        Lm.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(mapInstanceRef.current)
        const icono = Lm.divIcon({
          className: '',
          html: `<div style="background:#F97316;width:36px;height:36px;border-radius:50%;border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:18px;box-shadow:0 2px 8px rgba(0,0,0,.4)">🚛</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        })
        markerRef.current = Lm.marker([ubicacion.lat, ubicacion.lng], { icon: icono }).addTo(mapInstanceRef.current)
          .bindPopup(`<b>Conductor en ruta</b><br>${origen} → ${destino}`)
      } else {
        markerRef.current?.setLatLng([ubicacion.lat, ubicacion.lng])
        mapInstanceRef.current.panTo([ubicacion.lat, ubicacion.lng])
      }
    })
  }, [ubicacion])

  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ marginTop: '14px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,.1)' }}>
      <div style={{ background: 'rgba(249,115,22,.08)', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
        <span style={{ fontSize: '14px' }}>📡</span>
        <span style={{ fontSize: '12px', fontWeight: '700', color: '#F97316' }}>
          {sinSenal ? 'Esperando senal GPS del conductor...' : 'Conductor en tiempo real'}
        </span>
        {!sinSenal && ubicacion && (
          <span style={{ marginLeft: 'auto', fontSize: '10px', color: '#7A8FAD' }}>
            Actualizado hace {Math.round((Date.now() - new Date(ubicacion.actualizadoEn)) / 1000)}s
          </span>
        )}
      </div>
      {sinSenal ? (
        <div style={{ background: '#0C1B35', padding: '32px', textAlign: 'center', color: '#7A8FAD', fontSize: '13px' }}>
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>🚛</div>
          El conductor aun no ha activado el GPS o esta fuera de cobertura
        </div>
      ) : (
        <div ref={mapRef} style={{ height: '280px', width: '100%', background: '#0C1B35' }} />
      )}
    </div>
  )
}

export default function Carrier() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')
  const nombre = localStorage.getItem('nombre') || 'Transportista'

  const [vista, setVista] = useState('dashboard')
  const [dashboard, setDashboard] = useState(null)
  const [viajes, setViajes] = useState([])
  const [pagos, setPagos] = useState([])
  const [misRutas, setMisRutas] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [vehiculoSeleccionado, setVehiculoSeleccionado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [solicitudes, setSolicitudes] = useState([])
  const [conductores, setConductores] = useState([])
  const [conductoresAfiliados, setConductoresAfiliados] = useState([])

  const [cForm, setCForm] = useState({ nombre: '', cedula: '', telefono: '', categoriaLicencia: 'C2', vencimientoLicencia: '' })
  const [archivosC, setArchivosC] = useState({ fotoConductor: null, fotoCedula: null, fotoLicencia: null })
  const [guardandoC, setGuardandoC] = useState(false)
  const [guardadoC, setGuardadoC] = useState(false)
  const [errorC, setErrorC] = useState('')

  const [vForm, setVForm] = useState({ placa: '', tipo: 'camion', carroceria: '', marca: '', modelo: '', año: '', pesoMax: '', volumenMax: '', largo: '', ancho: '', alto: '' })
  const [guardandoV, setGuardandoV] = useState(false)
  const [guardadoV, setGuardadoV] = useState(false)
  const [errorV, setErrorV] = useState('')

  const [ruta, setRuta] = useState({ direccionSalida: '', origen: '', destino: '', fechaSalida: '', horaSalida: '', rangoRecogida: 10, pesoDisponible: '', vehiculoId: '', conductorId: '' })
  const [publicando, setPublicando] = useState(false)
  const [publicado, setPublicado] = useState(false)
  const [errorRuta, setErrorRuta] = useState('')
  const [modalRetorno, setModalRetorno] = useState(null)
  const [formRetorno, setFormRetorno] = useState({ fechaSalida: '', horaSalida: '', direccionSalida: '', rangoRecogida: 10 })
  const [rutaPublicadaData, setRutaPublicadaData] = useState(null)
  const [publicandoRetorno, setPublicandoRetorno] = useState(false)

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }

  useEffect(() => {
    if (!token) { navigate('/login'); return }
    cargarDashboard()
    cargarVehiculos()
    cargarConductores()
    cargarConductoresAfiliados()
  }, [])

  useEffect(() => {
    if (vista === 'dashboard') cargarDashboard()
    if (vista === 'viajes') cargarViajes()
    if (vista === 'historial') cargarViajes()
    if (vista === 'pagos') cargarPagos()
    if (vista === 'mis-rutas') cargarMisRutas()
    if (vista === 'vehiculo') cargarVehiculos()
    if (vista === 'solicitudes') { cargarSolicitudes(); cargarConductoresAfiliados() }
    if (vista === 'conductores') cargarConductores()
  }, [vista])

  async function cargarDashboard() {
    setCargando(true)
    try { const res = await fetch(`${API}/dashboard`, { headers }); const data = await res.json(); if (res.ok) setDashboard(data) } catch { }
    setCargando(false)
  }
  async function cargarViajes() {
    setCargando(true)
    try { const res = await fetch(`${API}/viajes`, { headers }); const data = await res.json(); if (res.ok) setViajes(data) } catch { }
    setCargando(false)
  }
  async function cargarPagos() {
    setCargando(true)
    try { const res = await fetch(`${API}/pagos`, { headers }); const data = await res.json(); if (res.ok) setPagos(data) } catch { }
    setCargando(false)
  }
  async function cargarMisRutas() {
    setCargando(true)
    try { const res = await fetch(`${RUTAS_API}/mis-rutas`, { headers }); const data = await res.json(); if (res.ok) setMisRutas(data) } catch { }
    setCargando(false)
  }
  async function cargarVehiculos() {
    try { const res = await fetch(`${VEHICULO_API}/mis-vehiculos`, { headers }); const data = await res.json(); if (res.ok) { setVehiculos(data); if (data.length > 0 && !vehiculoSeleccionado) setVehiculoSeleccionado(data.find(v => v.estado === 'aprobado') || null) } } catch { }
  }
  async function cargarSolicitudes() {
    setCargando(true)
    try { const res = await fetch(`${RUTAS_API}/solicitudes`, { headers }); const data = await res.json(); if (res.ok) setSolicitudes(data) } catch { }
    setCargando(false)
  }
  async function cargarConductores() {
    setCargando(true)
    try { const res = await fetch(`${CONDUCTOR_API}/mis-conductores`, { headers }); const data = await res.json(); if (res.ok) setConductores(data) } catch { }
    setCargando(false)
  }
  async function cargarConductoresAfiliados() {
    try {
      const res = await fetch(`${CONDUCTOR_AFILIADO_API}/todos`, { headers })
      const data = await res.json()
      if (res.ok) setConductoresAfiliados(data.filter(c => c.estado === 'aprobado'))
    } catch { }
  }

  async function asignarConductor(solicitudId, conductorAfiliadoId) {
    try {
      await fetch(`${RUTAS_API}/solicitudes/${solicitudId}/asignar-conductor`, {
        method: 'POST', headers,
        body: JSON.stringify({ conductorAfiliadoId })
      })
      cargarSolicitudes()
    } catch (e) { console.log(e) }
  }

  async function registrarConductor() {
    if (!cForm.nombre || !cForm.cedula || !cForm.categoriaLicencia || !cForm.vencimientoLicencia) { setErrorC('Nombre, cedula, categoria y vencimiento de licencia son obligatorios'); return }
    if (!archivosC.fotoConductor || !archivosC.fotoCedula || !archivosC.fotoLicencia) { setErrorC('Debes subir la foto del conductor, la cedula y la licencia'); return }
    setGuardandoC(true); setErrorC('')
    try {
      const formData = new FormData()
      Object.entries(cForm).forEach(([k, v]) => { if (v) formData.append(k, v) })
      if (archivosC.fotoConductor) formData.append('fotoConductor', archivosC.fotoConductor)
      if (archivosC.fotoCedula) formData.append('fotoCedula', archivosC.fotoCedula)
      if (archivosC.fotoLicencia) formData.append('fotoLicencia', archivosC.fotoLicencia)
      const res = await fetch(CONDUCTOR_API, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData })
      const data = await res.json()
      if (res.ok) {
        setGuardadoC(true); cargarConductores()
        setCForm({ nombre: '', cedula: '', telefono: '', categoriaLicencia: 'C2', vencimientoLicencia: '' })
        setArchivosC({ fotoConductor: null, fotoCedula: null, fotoLicencia: null })
        setTimeout(() => setGuardadoC(false), 3000)
      } else { setErrorC(data.error || 'Error al registrar') }
    } catch { setErrorC('Error de conexion') }
    setGuardandoC(false)
  }

  async function responderSolicitud(id, accion) {
    try { const res = await fetch(`${RUTAS_API}/solicitudes/${id}/${accion}`, { method: 'POST', headers }); if (res.ok) cargarSolicitudes() } catch { }
  }

  async function registrarVehiculo() {
    if (!vForm.placa || !vForm.tipo || !vForm.pesoMax) { setErrorV('Placa, tipo y peso maximo son obligatorios'); return }
    if (!vForm.carroceria) { setErrorV('Selecciona el tipo de carroceria'); return }
    setGuardandoV(true); setErrorV('')
    try {
      const res = await fetch(VEHICULO_API, { method: 'POST', headers, body: JSON.stringify({ placa: vForm.placa, tipo: vForm.tipo, carroceria: vForm.carroceria, marca: vForm.marca, modelo: vForm.modelo, año: Number(vForm.año), capacidad: { pesoMax: Number(vForm.pesoMax), volumenMax: Number(vForm.volumenMax), largo: Number(vForm.largo), ancho: Number(vForm.ancho), alto: Number(vForm.alto) } }) })
      const data = await res.json()
      if (res.ok) { setGuardadoV(true); cargarVehiculos(); setVForm({ placa: '', tipo: 'camion', carroceria: '', marca: '', modelo: '', año: '', pesoMax: '', volumenMax: '', largo: '', ancho: '', alto: '' }); setTimeout(() => setGuardadoV(false), 3000) } else { setErrorV(data.error || 'Error al registrar') }
    } catch { setErrorV('Error de conexion') }
    setGuardandoV(false)
  }

  async function publicarRuta() {
    const veh = vehiculos.find(v => v._id === ruta.vehiculoId)
    if (!veh) { setErrorRuta('Selecciona un vehiculo'); return }
    if (veh.estado !== 'aprobado') { setErrorRuta('El vehiculo debe estar aprobado'); return }
    if (!ruta.direccionSalida || !ruta.origen || !ruta.destino || !ruta.fechaSalida || !ruta.horaSalida || !ruta.pesoDisponible) { setErrorRuta('Completa todos los campos obligatorios'); return }
    setPublicando(true); setErrorRuta('')
    try {
      const pesoMax = veh.capacidad?.pesoMax || 0
      const pesoDisponible = Number(ruta.pesoDisponible)
      const res = await fetch(RUTAS_API, { method: 'POST', headers, body: JSON.stringify({ direccionSalida: ruta.direccionSalida, origen: ruta.origen, destino: ruta.destino, fechaSalida: ruta.fechaSalida, horaSalida: ruta.horaSalida, rangoRecogida: Number(ruta.rangoRecogida), carroceria: veh.carroceria, tipoVehiculo: veh.tipo, vehiculoId: veh._id, conductorId: ruta.conductorId || null, espacio: { pesoMax, pesoDisponible, porcentajeDisponible: Math.round((pesoDisponible / pesoMax) * 100), volumenMax: veh.capacidad?.volumenMax, largo: veh.capacidad?.largo, ancho: veh.capacidad?.ancho, alto: veh.capacidad?.alto } }) })
      const data = await res.json()
      if (res.ok) { setRutaPublicadaData({ origen: ruta.origen, destino: ruta.destino, veh }); setRuta({ direccionSalida: '', origen: '', destino: '', fechaSalida: '', horaSalida: '', rangoRecogida: 10, pesoDisponible: '', vehiculoId: '', conductorId: '' }); setModalRetorno('pregunta') }
      else { setErrorRuta(data.error || 'Error al publicar') }
    } catch { setErrorRuta('Error de conexion') }
    setPublicando(false)
  }

  async function publicarRetorno() {
    if (!formRetorno.fechaSalida || !formRetorno.horaSalida) { alert('Ingresa fecha y hora de regreso'); return }
    setPublicandoRetorno(true)
    try {
      const veh = rutaPublicadaData?.veh
      const pesoMax = veh?.capacidad?.pesoMax || 0
      await fetch(RUTAS_API, { method: 'POST', headers, body: JSON.stringify({ direccionSalida: formRetorno.direccionSalida || rutaPublicadaData?.destino, origen: rutaPublicadaData?.destino, destino: rutaPublicadaData?.origen, fechaSalida: formRetorno.fechaSalida, horaSalida: formRetorno.horaSalida, rangoRecogida: formRetorno.rangoRecogida, carroceria: veh?.carroceria, tipoVehiculo: veh?.tipo, vehiculoId: veh?._id, espacio: { pesoMax, pesoDisponible: pesoMax, porcentajeDisponible: 100, volumenMax: veh?.capacidad?.volumenMax } }) })
    } catch (e) { console.log(e) }
    setPublicandoRetorno(false)
    setModalRetorno(null)
    setVista('mis-rutas')
  }

  function logout() { localStorage.clear(); navigate('/') }

  const vehActual = vehiculos.find(v => v._id === ruta.vehiculoId)
  const pesoMax = vehActual?.capacidad?.pesoMax || 0
  const pesoDisp = Number(ruta.pesoDisponible) || 0
  const porcentajeDisp = pesoMax > 0 ? Math.min(100, Math.round((pesoDisp / pesoMax) * 100)) : 0
  const vehiculosAprobados = vehiculos.filter(v => v.estado === 'aprobado')
  const initials = nombre.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length

  const navItems = [
    { id: 'dashboard', ic: '📊', label: 'Dashboard' },
    { id: 'vehiculo', ic: '🚛', label: 'Mi flota' },
    { id: 'conductores', ic: '👤', label: 'Mis conductores' },
    { id: 'publicar-ruta', ic: '➕', label: 'Publicar ruta' },
    { id: 'mis-rutas', ic: '🗺️', label: 'Mis rutas' },
    { id: 'solicitudes', ic: '📬', label: 'Solicitudes', badge: pendientes },
    { id: 'viajes', ic: '📍', label: 'Viajes activos' },
    { id: 'historial', ic: '📋', label: 'Historial' },
    { id: 'pagos', ic: '💰', label: 'Pagos y retiros' },
    { id: 'config', ic: '⚙️', label: 'Configuracion' },
  ]

  const titles = { dashboard: 'Dashboard', vehiculo: 'Mi flota', conductores: 'Mis conductores', 'publicar-ruta': 'Publicar ruta', 'mis-rutas': 'Mis rutas', solicitudes: 'Solicitudes', viajes: 'Viajes activos', historial: 'Historial', pagos: 'Pagos y retiros', config: 'Configuracion' }
  const estadoV = (e) => ({ aprobado: { color: '#10B981', bg: 'rgba(16,185,129,.12)', label: '✅ Aprobado' }, pendiente: { color: '#F59E0B', bg: 'rgba(245,158,11,.12)', label: '⏳ Pendiente de aprobacion' }, rechazado: { color: '#EF4444', bg: 'rgba(239,68,68,.12)', label: '❌ Rechazado' } }[e] || {})

  const s = {
    wrap: { display: 'flex', minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', color: 'white' },
    sidebar: { width: '240px', flexShrink: 0, background: '#0B1628', borderRight: '1px solid rgba(255,255,255,.07)', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' },
    sbLogo: { padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,.07)' },
    logo: { fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: '800' },
    roleBadge: { display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'rgba(37,99,235,.12)', border: '1px solid rgba(37,99,235,.2)', padding: '3px 10px', borderRadius: '100px', fontSize: '11px', color: '#60A5FA', fontWeight: '600', marginTop: '8px' },
    nav: { padding: '16px 12px', flex: 1, overflowY: 'auto' },
    navItem: (active) => ({ display: 'flex', alignItems: 'center', gap: '11px', padding: '10px 12px', borderRadius: '10px', marginBottom: '2px', fontSize: '13.5px', fontWeight: '500', color: active ? 'white' : '#7A8FAD', cursor: 'pointer', background: active ? 'rgba(37,99,235,.15)' : 'transparent', transition: '.2s', borderLeft: active ? '3px solid #F97316' : '3px solid transparent' }),
    sbUser: { padding: '14px', borderTop: '1px solid rgba(255,255,255,.07)', position: 'relative' },
    userRow: { display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '10px', cursor: 'pointer' },
    userAv: { width: '36px', height: '36px', borderRadius: '9px', background: 'rgba(37,99,235,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: '#60A5FA', flexShrink: 0 },
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
    rutaCard: { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '12px', padding: '16px', marginBottom: '10px' },
    tipoBtn: (sel) => ({ border: `2px solid ${sel ? '#F97316' : 'rgba(255,255,255,.1)'}`, background: sel ? 'rgba(249,115,22,.08)' : 'transparent', borderRadius: '10px', padding: '10px 14px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', color: sel ? '#F97316' : '#7A8FAD', transition: '.2s' }),
    pagoRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,.04)' },
    tipoVehiculo: (sel) => ({ border: `2px solid ${sel ? '#F97316' : 'rgba(255,255,255,.1)'}`, background: sel ? 'rgba(249,115,22,.08)' : 'transparent', borderRadius: '12px', padding: '16px 10px', textAlign: 'center', cursor: 'pointer', transition: '.2s', flex: 1 }),
    solCard: { background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.08)', borderRadius: '14px', padding: '20px', marginBottom: '12px' },
  }

  return (
    <div style={s.wrap}>
      <aside style={s.sidebar}>
        <div style={s.sbLogo}>
          <div style={s.logo}>Cargo<span style={{ color: '#F97316' }}>Share</span></div>
          <div style={s.roleBadge}>🚛 Empresa transportadora</div>
        </div>
        <nav style={s.nav}>
          {navItems.map(item => (
            <div key={item.id} style={s.navItem(vista === item.id)} onClick={() => setVista(item.id)}>
              <span style={{ fontSize: '17px', width: '20px', textAlign: 'center' }}>{item.ic}</span>
              {item.label}
              {item.badge > 0 && <span style={{ marginLeft: 'auto', background: '#F97316', color: 'white', borderRadius: '100px', fontSize: '10px', fontWeight: '800', padding: '2px 7px' }}>{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={s.sbUser}>
          <div style={s.userRow} onClick={() => setUserMenuOpen(!userMenuOpen)}>
            <div style={s.userAv}>{initials}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '13px', fontWeight: '700' }}>{nombre}</div>
              <div style={{ fontSize: '11px', color: '#7A8FAD' }}>Transportadora</div>
            </div>
            <span style={{ fontSize: '11px', color: '#7A8FAD' }}>▲</span>
          </div>
          <div style={s.userMenu(userMenuOpen)}>
            <div style={s.umItem(false)} onClick={() => { setVista('config'); setUserMenuOpen(false) }}>⚙️ Configuracion</div>
            <div style={{ height: '1px', background: 'rgba(255,255,255,.07)', margin: '6px 0' }}></div>
            <div style={s.umItem(true)} onClick={logout}>🚪 Cerrar sesion</div>
          </div>
        </div>
      </aside>

      <div style={s.main}>
        <div style={s.topbar}>
          <div>
            <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: '800' }}>{titles[vista]}</div>
            <div style={{ fontSize: '12px', color: '#7A8FAD' }}>{new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
          </div>
          <button onClick={() => setVista('publicar-ruta')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '9px 18px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Publicar ruta</button>
        </div>

        <div style={s.content}>

          {/* DASHBOARD */}
          {vista === 'dashboard' && (
            <div>
              <div style={s.h2}>Buen dia, {nombre.split(' ')[0]} 👋</div>
              <div style={s.p}>Aqui esta el resumen de tu actividad.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando datos...</div>
                : dashboard ? (<>
                  <div style={s.kpiGrid}>
                    <div style={s.kpi}><div style={s.kpiLabel}>💰 Saldo disponible</div><div style={s.kpiVal('#F97316')}>${dashboard.saldoDisponible?.toFixed(0)}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>📦 Viajes activos</div><div style={s.kpiVal('#60A5FA')}>{dashboard.viajesActivos}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>✅ Completados</div><div style={s.kpiVal('#10B981')}>{dashboard.viajesCompletados}</div></div>
                    <div style={s.kpi}><div style={s.kpiLabel}>💵 Ganancia mes</div><div style={s.kpiVal('#F59E0B')}>${dashboard.gananciaMes?.toFixed(0)}</div></div>
                  </div>
                  <div style={s.panel}>
                    <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px' }}>🚀 Primeros pasos</div>
                    <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: '1.8' }}>
                      ✅ Cuenta creada y aprobada<br />
                      {vehiculos.length > 0 ? '✅' : '⬜'} Registra tu vehiculo<br />
                      {vehiculos.some(v => v.estado === 'aprobado') ? '✅' : '⬜'} Vehiculo aprobado<br />
                      ⬜ Publica tu primera ruta
                    </div>
                  </div>
                </>) : (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📊</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Sin datos aun</div>
                    <button onClick={() => setVista('vehiculo')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🚛 Registrar vehiculo</button>
                  </div>
                )}
            </div>
          )}

          {/* MI FLOTA */}
          {vista === 'vehiculo' && (
            <div>
              <div style={s.h2}>Mi flota 🚛</div>
              <div style={s.p}>Registra y gestiona todos los vehiculos de tu empresa.</div>
              {vehiculos.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {vehiculos.map(v => (
                    <div key={v._id} style={{ ...s.rutaCard, marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ fontSize: '15px', fontWeight: '700' }}>🚛 {v.placa} — {v.tipo} {v.carroceria ? `· ${v.carroceria.replace('_',' ')}` : ''}</div>
                          <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '3px' }}>{v.marca} {v.modelo} {v.año ? `· ${v.año}` : ''} · {v.capacidad?.pesoMax?.toLocaleString('es-CO')} kg</div>
                        </div>
                        <span style={{ padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: estadoV(v.estado).bg, color: estadoV(v.estado).color }}>{estadoV(v.estado).label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px', color: 'white' }}>➕ Añadir vehiculo</div>
              {guardadoV && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#10B981', textAlign: 'center' }}>✅ Vehiculo registrado. Pendiente de aprobacion.</div>}
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>🚛 Tipo de vehiculo</div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  {[['camion','🚛','Camion'], ['tractomula','🚚','Tractomula'], ['camioneta','🚐','Camioneta'], ['furgon','📦','Furgon']].map(([val, ic, label]) => (
                    <div key={val} style={s.tipoVehiculo(vForm.tipo === val)} onClick={() => setVForm({ ...vForm, tipo: val, carroceria: '' })}>
                      <div style={{ fontSize: '24px', marginBottom: '6px' }}>{ic}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#B8C8DC' }}>{label}</div>
                    </div>
                  ))}
                </div>
                {vForm.tipo && CARROCERIAS_POR_TIPO[vForm.tipo] && (
                  <div>
                    <div style={{ ...s.lbl, marginBottom: '10px' }}>Tipo de carroceria *</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {CARROCERIAS_POR_TIPO[vForm.tipo].map(([val, label]) => (
                        <button key={val} style={s.tipoBtn(vForm.carroceria === val)} onClick={() => setVForm({ ...vForm, carroceria: val })}>{label}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📋 Datos basicos</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Placa *</label><input style={s.inp} placeholder="ABC123" value={vForm.placa} onChange={e => setVForm({ ...vForm, placa: e.target.value.toUpperCase() })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Año</label><input type="number" style={s.inp} placeholder="2020" value={vForm.año} onChange={e => setVForm({ ...vForm, año: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Marca</label><input style={s.inp} placeholder="Kenworth" value={vForm.marca} onChange={e => setVForm({ ...vForm, marca: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Modelo</label><input style={s.inp} placeholder="T800" value={vForm.modelo} onChange={e => setVForm({ ...vForm, modelo: e.target.value })} /></div>
                </div>
              </div>
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📐 Capacidad total</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Peso maximo (kg) *</label><input type="number" style={s.inp} placeholder="15000" value={vForm.pesoMax} onChange={e => setVForm({ ...vForm, pesoMax: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Volumen maximo (m³)</label><input type="number" style={s.inp} placeholder="60" value={vForm.volumenMax} onChange={e => setVForm({ ...vForm, volumenMax: e.target.value })} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Largo (m)</label><input type="number" style={s.inp} placeholder="12" value={vForm.largo} onChange={e => setVForm({ ...vForm, largo: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Ancho (m)</label><input type="number" style={s.inp} placeholder="2.4" value={vForm.ancho} onChange={e => setVForm({ ...vForm, ancho: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Alto (m)</label><input type="number" style={s.inp} placeholder="2.6" value={vForm.alto} onChange={e => setVForm({ ...vForm, alto: e.target.value })} /></div>
                </div>
              </div>
              {errorV && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>⚠️ {errorV}</div>}
              <button onClick={registrarVehiculo} disabled={guardandoV} style={{ background: '#F97316', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: guardandoV ? 0.7 : 1 }}>
                {guardandoV ? 'Registrando...' : '🚛 Registrar vehiculo →'}
              </button>
            </div>
          )}

          {/* MIS CONDUCTORES */}
          {vista === 'conductores' && (
            <div>
              <div style={s.h2}>Mis conductores 👤</div>
              <div style={s.p}>Registra los conductores de tu empresa. La empresa responde legalmente por ellos.</div>
              {conductores.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  {conductores.map(c => {
                    const vencimiento = c.vencimientoLicencia ? new Date(c.vencimientoLicencia) : null
                    const diasParaVencer = vencimiento ? Math.floor((vencimiento - new Date()) / (1000 * 60 * 60 * 24)) : null
                    const proximoVencer = diasParaVencer !== null && diasParaVencer <= 60
                    return (
                      <div key={c._id} style={{ background: 'rgba(255,255,255,.03)', border: `1px solid ${proximoVencer ? 'rgba(245,158,11,.3)' : 'rgba(255,255,255,.07)'}`, borderRadius: '12px', padding: '16px', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            {c.fotoConductor ? <img src={c.fotoConductor} alt={c.nombre} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} /> : <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>👤</div>}
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: '700' }}>{c.nombre}</div>
                              <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>CC {c.cedula} · {c.telefono || 'Sin telefono'} · Lic. {c.categoriaLicencia}</div>
                              {vencimiento && <div style={{ fontSize: '11px', color: proximoVencer ? '#F59E0B' : '#10B981', marginTop: '2px' }}>{proximoVencer ? `⚠️ Licencia vence en ${diasParaVencer} dias` : `✅ Licencia vigente hasta ${vencimiento.toLocaleDateString('es-CO')}`}</div>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {c.fotoCedula && <a href={c.fotoCedula} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#60A5FA', background: 'rgba(37,99,235,.1)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none' }}>Ver cedula</a>}
                            {c.fotoLicencia && <a href={c.fotoLicencia} target="_blank" rel="noreferrer" style={{ fontSize: '11px', color: '#60A5FA', background: 'rgba(37,99,235,.1)', padding: '4px 10px', borderRadius: '6px', textDecoration: 'none' }}>Ver licencia</a>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>➕ Añadir conductor</div>
              {guardadoC && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#10B981', textAlign: 'center' }}>✅ Conductor registrado. El admin recibira los datos para revision.</div>}
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📋 Datos del conductor</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div style={s.fg}><label style={s.lbl}>Nombre completo *</label><input style={s.inp} placeholder="Carlos Garcia" value={cForm.nombre} onChange={e => setCForm({ ...cForm, nombre: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Cedula *</label><input style={s.inp} placeholder="1234567890" value={cForm.cedula} onChange={e => setCForm({ ...cForm, cedula: e.target.value })} /></div>
                  <div style={s.fg}><label style={s.lbl}>Telefono</label><input style={s.inp} placeholder="+57 300 123 4567" value={cForm.telefono} onChange={e => setCForm({ ...cForm, telefono: e.target.value })} /></div>
                  <div style={s.fg}>
                    <label style={s.lbl}>Categoria licencia *</label>
                    <select style={{ ...s.inp, cursor: 'pointer' }} value={cForm.categoriaLicencia} onChange={e => setCForm({ ...cForm, categoriaLicencia: e.target.value })}>
                      {['B1','B2','B3','C1','C2','C3','C4'].map(c => <option key={c} value={c} style={{ background: '#0C1B35' }}>{c}</option>)}
                    </select>
                  </div>
                  <div style={{ ...s.fg, gridColumn: '1 / -1' }}>
                    <label style={s.lbl}>Vencimiento de licencia *</label>
                    <input type="date" style={s.inp} value={cForm.vencimientoLicencia} onChange={e => setCForm({ ...cForm, vencimientoLicencia: e.target.value })} />
                  </div>
                </div>
              </div>
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>📸 Documentos *</div>
                <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '16px' }}>Sube foto o PDF de cada documento. Maximo 10MB.</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  {[{ key: 'fotoConductor', label: 'Foto del conductor', ic: '📷' }, { key: 'fotoCedula', label: 'Foto de la cedula', ic: '🪪' }, { key: 'fotoLicencia', label: 'Foto de la licencia', ic: '📄' }].map(doc => (
                    <div key={doc.key}>
                      <label style={s.lbl}>{doc.label} *</label>
                      <label style={{ display: 'block', background: archivosC[doc.key] ? 'rgba(16,185,129,.06)' : 'rgba(255,255,255,.03)', border: `2px dashed ${archivosC[doc.key] ? '#10B981' : 'rgba(255,255,255,.15)'}`, borderRadius: '12px', padding: '16px', textAlign: 'center', cursor: 'pointer' }}>
                        <input type="file" accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) setArchivosC({ ...archivosC, [doc.key]: f }) }} />
                        {archivosC[doc.key] ? <div><div style={{ fontSize: '20px', marginBottom: '4px' }}>✅</div><div style={{ fontSize: '11px', color: '#10B981' }}>{archivosC[doc.key].name}</div></div> : <div><div style={{ fontSize: '24px', marginBottom: '6px' }}>{doc.ic}</div><div style={{ fontSize: '11px', color: '#7A8FAD' }}>Subir archivo</div></div>}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              {errorC && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>⚠️ {errorC}</div>}
              <button onClick={registrarConductor} disabled={guardandoC} style={{ background: '#F97316', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: guardandoC ? 0.7 : 1 }}>
                {guardandoC ? 'Registrando...' : '👤 Registrar conductor →'}
              </button>
            </div>
          )}

          {/* PUBLICAR RUTA */}
          {vista === 'publicar-ruta' && (
            <div>
              <div style={s.h2}>Publicar ruta ➕</div>
              <div style={s.p}>Ingresa los datos de tu ruta para que las empresas te encuentren.</div>
              {vehiculosAprobados.length === 0 && <div style={{ background: 'rgba(245,158,11,.1)', border: '1px solid rgba(245,158,11,.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#F59E0B' }}>⚠️ No tienes vehiculos aprobados. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setVista('vehiculo')}>Registra un vehiculo</span> primero.</div>}
              {publicado && <div style={{ background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.25)', borderRadius: '12px', padding: '16px', marginBottom: '20px', fontSize: '14px', color: '#10B981', textAlign: 'center' }}>✅ Ruta publicada exitosamente!</div>}
              {vehiculosAprobados.length > 0 && (<>
                <div style={s.panel}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>🚛 Selecciona el vehiculo para este viaje *</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {vehiculosAprobados.map(v => (
                      <div key={v._id} onClick={() => setRuta({ ...ruta, vehiculoId: v._id, pesoDisponible: '' })}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', borderRadius: '12px', border: `2px solid ${ruta.vehiculoId === v._id ? '#F97316' : 'rgba(255,255,255,.08)'}`, background: ruta.vehiculoId === v._id ? 'rgba(249,115,22,.06)' : 'rgba(255,255,255,.02)', cursor: 'pointer', transition: '.2s' }}>
                        <div style={{ fontSize: '28px' }}>{v.tipo === 'tractomula' ? '🚚' : v.tipo === 'camioneta' ? '🚐' : v.tipo === 'furgon' ? '📦' : '🚛'}</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', fontWeight: '700' }}>{v.placa} — {v.tipo}</div>
                          <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{v.carroceria?.replace('_', ' ')} · {v.capacidad?.pesoMax?.toLocaleString('es-CO')} kg · {v.marca} {v.modelo}</div>
                        </div>
                        {ruta.vehiculoId === v._id && <span style={{ color: '#F97316', fontSize: '18px' }}>✓</span>}
                      </div>
                    ))}
                  </div>
                  {ruta.vehiculoId && <div style={{ marginTop: '12px', background: 'rgba(37,99,235,.08)', border: '1px solid rgba(37,99,235,.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#60A5FA' }}>🚛 Carroceria: <strong>{vehActual?.carroceria?.replace('_', ' ')}</strong> — se asigna automaticamente a la ruta</div>}
                </div>
                <div style={s.panel}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>👤 Conductor asignado para este viaje *</div>
                  <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '14px' }}>La empresa remitente vera el perfil de este conductor antes de que salga el camion.</div>
                  {conductores.filter(c => c.estado === 'aprobado').length === 0 ? (
                    <div style={{ background: 'rgba(245,158,11,.08)', border: '1px solid rgba(245,158,11,.2)', borderRadius: '10px', padding: '14px', fontSize: '13px', color: '#F59E0B' }}>⚠️ No tienes conductores aprobados. <span style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={() => setVista('conductores')}>Añade un conductor</span> primero.</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {conductores.filter(c => c.estado === 'aprobado').map(c => (
                        <div key={c._id} onClick={() => setRuta({ ...ruta, conductorId: c._id })}
                          style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '10px', border: `2px solid ${ruta.conductorId === c._id ? '#F97316' : 'rgba(255,255,255,.08)'}`, background: ruta.conductorId === c._id ? 'rgba(249,115,22,.06)' : 'rgba(255,255,255,.02)', cursor: 'pointer', transition: '.2s' }}>
                          {c.fotoConductor ? <img src={c.fotoConductor} alt={c.nombre} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover' }} /> : <div style={{ width: '38px', height: '38px', borderRadius: '8px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>👤</div>}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', fontWeight: '700' }}>{c.nombre}</div>
                            <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '1px' }}>CC {c.cedula} · Lic. {c.categoriaLicencia}</div>
                          </div>
                          {ruta.conductorId === c._id && <span style={{ color: '#F97316', fontSize: '16px' }}>✓</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div style={s.panel}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>📍 Punto de salida y ruta</div>
                  <div style={s.fg}><label style={s.lbl}>Direccion exacta de salida de tu flota *</label><input style={s.inp} placeholder="Ej: Calle 13 #86-60, Zona Industrial, Bogota" value={ruta.direccionSalida} onChange={e => setRuta({ ...ruta, direccionSalida: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={s.fg}><label style={s.lbl}>Ciudad de origen *</label><input style={s.inp} placeholder="Bogota" value={ruta.origen} onChange={e => setRuta({ ...ruta, origen: e.target.value })} /></div>
                    <div style={s.fg}><label style={s.lbl}>Ciudad de destino *</label><input style={s.inp} placeholder="Medellin" value={ruta.destino} onChange={e => setRuta({ ...ruta, destino: e.target.value })} /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={s.fg}><label style={s.lbl}>Fecha de salida *</label><input type="date" style={s.inp} value={ruta.fechaSalida} onChange={e => setRuta({ ...ruta, fechaSalida: e.target.value })} /></div>
                    <div style={s.fg}><label style={s.lbl}>Hora de salida *</label><input type="time" style={s.inp} value={ruta.horaSalida} onChange={e => setRuta({ ...ruta, horaSalida: e.target.value })} /></div>
                  </div>
                  <div style={s.fg}>
                    <label style={s.lbl}>Rango maximo de recogida: <strong style={{ color: 'white' }}>{ruta.rangoRecogida} km</strong></label>
                    <input type="range" min="0" max="80" step="5" value={ruta.rangoRecogida} onChange={e => setRuta({ ...ruta, rangoRecogida: Number(e.target.value) })} style={{ width: '100%', accentColor: '#F97316', cursor: 'pointer', marginBottom: '4px' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A8FAD' }}><span>Solo en la direccion</span><span>80 km</span></div>
                  </div>
                </div>
                <div style={s.panel}>
                  <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>⚖️ Espacio disponible en este viaje *</div>
                  <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '16px' }}>Cuantos kg te sobran? El precio se calculara automaticamente.</div>
                  <div style={s.fg}>
                    <label style={s.lbl}>Peso disponible (kg) *</label>
                    <input type="number" style={s.inp} placeholder={pesoMax ? `Max ${pesoMax.toLocaleString('es-CO')} kg` : 'Selecciona un vehiculo primero'} value={ruta.pesoDisponible} disabled={!ruta.vehiculoId} onChange={e => setRuta({ ...ruta, pesoDisponible: Math.min(Number(e.target.value), pesoMax) || '' })} />
                  </div>
                  {ruta.pesoDisponible > 0 && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: '#7A8FAD' }}>Capacidad disponible</span>
                        <span style={{ fontSize: '15px', fontWeight: '800', color: porcentajeDisp >= 70 ? '#10B981' : porcentajeDisp >= 40 ? '#F59E0B' : '#F97316' }}>{porcentajeDisp}%</span>
                      </div>
                      <div style={{ background: 'rgba(255,255,255,.08)', borderRadius: '100px', height: '12px', overflow: 'hidden' }}>
                        <div style={{ width: `${porcentajeDisp}%`, height: '100%', borderRadius: '100px', background: porcentajeDisp >= 70 ? '#10B981' : porcentajeDisp >= 40 ? '#F59E0B' : '#F97316', transition: 'width .4s ease' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#7A8FAD', marginTop: '6px' }}>
                        <span>Disponible: <strong style={{ color: 'white' }}>{Number(ruta.pesoDisponible).toLocaleString('es-CO')} kg</strong></span>
                        <span>Total camion: <strong style={{ color: 'white' }}>{pesoMax.toLocaleString('es-CO')} kg</strong></span>
                      </div>
                    </div>
                  )}
                </div>
                {errorRuta && <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.25)', borderRadius: '9px', padding: '11px 14px', fontSize: '13px', color: '#EF4444', marginBottom: '16px' }}>⚠️ {errorRuta}</div>}
                <button onClick={publicarRuta} disabled={publicando} style={{ background: '#F97316', color: 'white', border: 'none', padding: '13px 28px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer', opacity: publicando ? 0.7 : 1 }}>
                  {publicando ? 'Publicando...' : 'Publicar ruta →'}
                </button>
              </>)}
            </div>
          )}

          {/* MIS RUTAS */}
          {vista === 'mis-rutas' && (
            <div>
              <div style={s.h2}>Mis rutas 🗺️</div>
              <div style={s.p}>Rutas que has publicado.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando...</div>
                : misRutas.length === 0 ? (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🗺️</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '16px' }}>No has publicado rutas</div>
                    <button onClick={() => setVista('publicar-ruta')} style={{ background: '#F97316', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>+ Publicar ruta</button>
                  </div>
                ) : misRutas.map(r => (
                  <div key={r._id} style={s.rutaCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>📍 {r.origen} → {r.destino}</div>
                        <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '3px' }}>{r.fechaSalida ? new Date(r.fechaSalida).toLocaleDateString('es-CO') : ''} · {r.horaSalida} · Recogida hasta {r.rangoRecogida} km</div>
                        {r.direccionSalida && <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>📌 {r.direccionSalida}</div>}
                      </div>
                      <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: r.estado === 'disponible' ? 'rgba(16,185,129,.12)' : 'rgba(37,99,235,.12)', color: r.estado === 'disponible' ? '#10B981' : '#60A5FA' }}>
                        {r.estado === 'disponible' ? 'Disponible' : 'Reservado'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#7A8FAD', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span>⚖️ {r.espacio?.pesoDisponible?.toLocaleString('es-CO')} kg disponibles</span>
                      <span>· 🚛 {r.carroceria?.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          )}

          {/* SOLICITUDES */}
          {vista === 'solicitudes' && (
            <div>
              <div style={s.h2}>Solicitudes 📬</div>
              <div style={s.p}>Tienes <strong style={{ color: 'white' }}>6 horas</strong> para responder cada solicitud antes de que se cancele automaticamente.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando...</div>
                : solicitudes.length === 0 ? (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📬</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>Sin solicitudes aun</div>
                    <div>Cuando una empresa reserve tu ruta aparecera aqui</div>
                  </div>
                ) : solicitudes.map(sol => (
                  <div key={sol._id} style={s.solCard}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>🏢 {sol.empresaRemitente?.nombre || 'Empresa remitente'}</div>
                        <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '3px' }}>{sol.ruta?.origen} → {sol.ruta?.destino} · {sol.ruta?.fechaSalida ? new Date(sol.ruta.fechaSalida).toLocaleDateString('es-CO') : ''}</div>
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: sol.estado === 'pendiente' ? 'rgba(245,158,11,.12)' : sol.estado === 'aceptado' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: sol.estado === 'pendiente' ? '#F59E0B' : sol.estado === 'aceptado' ? '#10B981' : '#EF4444' }}>
                        {sol.estado === 'pendiente' ? '⏳ Pendiente' : sol.estado === 'aceptado' ? '✅ Aceptado' : '❌ Rechazado'}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                      {[['Tipo de carga', `${sol.carga?.tipo || '-'}`], ['Peso real', `${sol.carga?.pesoReal?.toLocaleString('es-CO') || '-'} kg`], ['Direccion recogida', sol.direccionRecogida || '-'], ['Km extra', sol.kmExtra > 0 ? `${sol.kmExtra} km fuera del rango` : '✅ Dentro del rango'], ['Recibes tu', `$${sol.precioCarrier?.toLocaleString('es-CO') || '-'} COP`], ['Total al cliente', `$${sol.precioTotal?.toLocaleString('es-CO') || '-'} COP`]].map(([k, v]) => (
                        <div key={k} style={{ background: 'rgba(255,255,255,.03)', borderRadius: '8px', padding: '10px 12px' }}>
                          <div style={{ fontSize: '10px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '3px' }}>{k}</div>
                          <div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {sol.estado === 'pendiente' && (
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => responderSolicitud(sol._id, 'aceptar')} style={{ flex: 1, background: 'rgba(16,185,129,.12)', color: '#10B981', border: '1px solid rgba(16,185,129,.3)', padding: '12px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>✅ Aceptar reserva</button>
                        <button onClick={() => responderSolicitud(sol._id, 'rechazar')} style={{ flex: 1, background: 'rgba(239,68,68,.08)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)', padding: '12px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>❌ Rechazar</button>
                      </div>
                    )}
                    {sol.estado === 'aceptado' && (
                      <div style={{ marginTop: '12px', background: 'rgba(16,185,129,.06)', border: '1px solid rgba(16,185,129,.2)', borderRadius: '10px', padding: '16px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#10B981', marginBottom: '4px' }}>👤 Asignar conductor afiliado a este viaje</div>
                        <div style={{ fontSize: '11px', color: '#7A8FAD', marginBottom: '12px' }}>El conductor asignado vera este viaje en su panel y podra ingresar el codigo de recogida.</div>
                        {sol.conductorAfiliadoId && (
                          <div style={{ background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)', borderRadius: '8px', padding: '10px 12px', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>✅</span>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: '700', color: '#10B981' }}>{sol.conductorAfiliadoId?.nombre || 'Conductor asignado'}</div>
                              <div style={{ fontSize: '11px', color: '#7A8FAD' }}>CC {sol.conductorAfiliadoId?.cedula} · Lic. {sol.conductorAfiliadoId?.categoriaLicencia}</div>
                            </div>
                          </div>
                        )}
                        {conductoresAfiliados.length === 0 ? (
                          <div style={{ fontSize: '12px', color: '#7A8FAD' }}>No hay conductores afiliados aprobados disponibles.</div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {conductoresAfiliados.map(c => {
                              const asignado = sol.conductorAfiliadoId?._id === c._id || sol.conductorAfiliadoId === c._id
                              return (
                                <div key={c._id} onClick={() => asignarConductor(sol._id, c._id)}
                                  style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '9px', border: `1px solid ${asignado ? 'rgba(16,185,129,.4)' : 'rgba(255,255,255,.08)'}`, background: asignado ? 'rgba(16,185,129,.08)' : 'transparent', cursor: 'pointer', transition: '.15s' }}>
                                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>👤</div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: '600' }}>{c.nombre}</div>
                                    <div style={{ fontSize: '11px', color: '#7A8FAD' }}>CC {c.cedula} · {c.nombreEmpresa} · Lic. {c.categoriaLicencia}</div>
                                  </div>
                                  {asignado && <span style={{ color: '#10B981', fontSize: '14px', fontWeight: '700' }}>✓ Asignado</span>}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* VIAJES ACTIVOS — con mapa GPS */}
          {vista === 'viajes' && (
            <div>
              <div style={s.h2}>Viajes activos 📍</div>
              <div style={s.p}>Tus envios en curso. Cuando el conductor este en ruta veras su ubicacion en tiempo real.</div>
              {cargando ? <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD' }}>Cargando...</div>
                : viajes.filter(v => v.estado === 'activo' || v.estado === 'en_transito').length === 0 ? (
                  <div style={{ ...s.panel, ...s.emptyState }}>
                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>📍</div>
                    <div style={{ fontSize: '16px', fontWeight: '700', color: 'white', marginBottom: '6px' }}>No tienes viajes activos</div>
                    <div>Acepta una solicitud para empezar</div>
                  </div>
                ) : viajes.filter(v => v.estado === 'activo' || v.estado === 'en_transito').map(v => (
                  <div key={v._id} style={{ ...s.panel, marginBottom: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>🚛 {v.origen} → {v.destino}</div>
                        <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{new Date(v.fecha).toLocaleDateString('es-CO')}</div>
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#F97316' }}>${v.precio?.toLocaleString('es-CO')}</div>
                    </div>

                    {/* MAPA GPS — se activa cuando el conductor esta en ruta */}
                    {(v.estado === 'en_transito' || v.estado === 'en_ruta') && v._id && (
                      <MapaGPS
                        solicitudId={v._id}
                        origen={v.origen}
                        destino={v.destino}
                      />
                    )}
                  </div>
                ))
              }
            </div>
          )}

          {/* HISTORIAL */}
          {vista === 'historial' && (
            <div>
              <div style={s.h2}>Historial 📋</div>
              <div style={s.p}>Todos tus viajes completados.</div>
              <div style={s.panel}>
                {viajes.filter(v => v.estado === 'completado').length === 0 ? (
                  <div style={s.emptyState}><div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div><div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Sin historial aun</div></div>
                ) : viajes.filter(v => v.estado === 'completado').map(v => (
                  <div key={v._id} style={{ ...s.rutaCard, display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ fontSize: '24px' }}>✅</div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: '14px', fontWeight: '700' }}>{v.origen} → {v.destino}</div><div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{new Date(v.fecha).toLocaleDateString('es-CO')}</div></div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#10B981' }}>${v.precio?.toLocaleString('es-CO')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAGOS */}
          {vista === 'pagos' && (
            <div>
              <div style={s.h2}>Pagos y retiros 💰</div>
              <div style={s.p}>Tu historial de ingresos y retiros.</div>
              <div style={s.panel}>
                {pagos.length === 0 ? (
                  <div style={s.emptyState}><div style={{ fontSize: '48px', marginBottom: '12px' }}>💰</div><div style={{ fontSize: '16px', fontWeight: '700', color: 'white' }}>Sin movimientos aun</div></div>
                ) : pagos.map(p => (
                  <div key={p._id} style={s.pagoRow}>
                    <div><div style={{ fontSize: '13px', fontWeight: '700' }}>{p.descripcion || (p.tipo === 'ingreso' ? 'Ingreso por viaje' : 'Retiro')}</div><div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>{new Date(p.fecha).toLocaleDateString('es-CO')}</div></div>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: p.tipo === 'ingreso' ? '#10B981' : '#EF4444' }}>{p.tipo === 'ingreso' ? '+' : '-'}${p.monto?.toLocaleString('es-CO')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CONFIG */}
          {vista === 'config' && (
            <div>
              <div style={s.h2}>Configuracion ⚙️</div>
              <div style={s.p}>Ajusta tu cuenta.</div>
              <div style={s.panel}>
                <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px' }}>🏢 Datos de la empresa</div>
                <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '4px' }}>Nombre</div>
                <div style={{ fontSize: '15px', fontWeight: '600', marginBottom: '20px' }}>{nombre}</div>
                <div style={{ height: '1px', background: 'rgba(255,255,255,.06)', marginBottom: '20px' }}></div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div><div style={{ fontSize: '14px', fontWeight: '600' }}>Cerrar sesion</div><div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>Salir de tu cuenta</div></div>
                  <button onClick={logout} style={{ background: 'rgba(239,68,68,.12)', color: '#EF4444', border: '1px solid rgba(239,68,68,.25)', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}>🚪 Cerrar sesion</button>
                </div>
              </div>
            </div>
          )}

        </div>
      {/* MODAL RETORNO */}
      {modalRetorno && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.12)', borderRadius: '22px', padding: '36px', width: '100%', maxWidth: '480px' }}>
            {modalRetorno === 'pregunta' && (
              <>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <div style={{ fontSize: '52px', marginBottom: '12px' }}>🔄</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '22px', fontWeight: '800', color: 'white', marginBottom: '8px' }}>Ruta publicada!</div>
                  <div style={{ fontSize: '14px', color: '#7A8FAD', lineHeight: 1.6 }}>Tu ruta <strong style={{ color: 'white' }}>{rutaPublicadaData?.origen} → {rutaPublicadaData?.destino}</strong> ya esta disponible.</div>
                </div>
                <div style={{ background: 'rgba(96,165,250,.08)', border: '1px solid rgba(96,165,250,.2)', borderRadius: '16px', padding: '20px', marginBottom: '24px' }}>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: 'white', marginBottom: '8px' }}>🚛 Aprovecha el regreso</div>
                  <div style={{ fontSize: '13px', color: '#7A8FAD', lineHeight: 1.6 }}>Publicas tambien <strong style={{ color: '#60A5FA' }}>{rutaPublicadaData?.destino} → {rutaPublicadaData?.origen}</strong>? La mayoria de camiones regresan vacios.</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => { setModalRetorno(null); setVista('mis-rutas') }} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>No, gracias</button>
                  <button onClick={() => setModalRetorno('form')} style={{ background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>Si, publicar retorno →</button>
                </div>
              </>
            )}
            {modalRetorno === 'form' && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'Syne,sans-serif', color: 'white', marginBottom: '6px' }}>Datos del retorno</div>
                  <div style={{ fontSize: '13px', color: '#7A8FAD' }}>Ruta: <strong style={{ color: '#60A5FA' }}>{rutaPublicadaData?.destino} → {rutaPublicadaData?.origen}</strong></div>
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Fecha de regreso *</label>
                  <input type="date" style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={formRetorno.fechaSalida} onChange={e => setFormRetorno(f => ({ ...f, fechaSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Hora de salida *</label>
                  <input type="time" style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} value={formRetorno.horaSalida} onChange={e => setFormRetorno(f => ({ ...f, horaSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Direccion de salida desde {rutaPublicadaData?.destino}</label>
                  <input style={{ width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} placeholder={'Ej: Calle 50 #30-10, ' + (rutaPublicadaData?.destino || '')} value={formRetorno.direccionSalida} onChange={e => setFormRetorno(f => ({ ...f, direccionSalida: e.target.value }))} />
                </div>
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.7px', display: 'block', marginBottom: '6px' }}>Rango de recogida: <strong style={{ color: 'white' }}>{formRetorno.rangoRecogida} km</strong></label>
                  <input type="range" min="0" max="80" step="5" value={formRetorno.rangoRecogida} onChange={e => setFormRetorno(f => ({ ...f, rangoRecogida: Number(e.target.value) }))} style={{ width: '100%', accentColor: '#F97316', cursor: 'pointer' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <button onClick={() => setModalRetorno('pregunta')} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>← Atras</button>
                  <button onClick={publicarRetorno} disabled={publicandoRetorno} style={{ background: publicandoRetorno ? 'rgba(249,115,22,.5)' : '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '11px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: publicandoRetorno ? 'not-allowed' : 'pointer' }}>{publicandoRetorno ? 'Publicando...' : 'Publicar retorno →'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      </div>
    </div>
  )
}