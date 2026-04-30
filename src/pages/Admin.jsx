import { useState, useEffect } from 'react'

const API = 'https://cargoshare-api-production.up.railway.app/api/auth'
const VEHICULO_API = 'https://cargoshare-api-production.up.railway.app/api/vehiculo'
const CONDUCTOR_API = 'https://cargoshare-api-production.up.railway.app/api/conductor'
const CONDUCTOR_AFILIADO_API = 'https://cargoshare-api-production.up.railway.app/api/conductor-afiliado'
const INDEPENDIENTE_API = 'https://cargoshare-api-production.up.railway.app/api/independiente'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState('')
  const [passErr, setPassErr] = useState(false)
  const [vista, setVista] = useState('usuarios')
  const [solicitudes, setSolicitudes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [conductores, setConductores] = useState([])
  const [conductoresAfiliados, setConductoresAfiliados] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [cargando, setCargando] = useState(false)
  const [expandido, setExpandido] = useState(null)
  const [motivoRechazo, setMotivoRechazo] = useState({})
  const [checklists, setChecklists] = useState({})
  const [guardando, setGuardando] = useState({})

  // Buscadores
  const [buscarConductor, setBuscarConductor] = useState('')
  const [buscarAfiliado, setBuscarAfiliado] = useState('')
  const [motivoRechazoAfiliado, setMotivoRechazoAfiliado] = useState({})
  const [independientes, setIndependientes] = useState([])
  const [buscarIndependiente, setBuscarIndependiente] = useState('')
  const [motivoRechazoInd, setMotivoRechazoInd] = useState({})

  const ADMIN_PASS = import.meta.env.VITE_ADMIN_PASS

  function login() {
    if (pass === ADMIN_PASS) {
      setAuth(true)
      cargarSolicitudes()
      cargarVehiculos()
      cargarConductores()
      cargarConductoresAfiliados()
      cargarIndependientes()
    } else setPassErr(true)
  }

  async function cargarSolicitudes() {
    setCargando(true)
    try {
      const res = await fetch(`${API}/solicitudes`)
      const data = await res.json()
      setSolicitudes(data)
      const cl = {}
      data.forEach(u => { if (u.checklist) cl[u._id] = u.checklist })
      setChecklists(cl)
    } catch { }
    setCargando(false)
  }

  async function cargarVehiculos() {
    try {
      const res = await fetch(`${VEHICULO_API}/todos`)
      const data = await res.json()
      setVehiculos(data)
    } catch { }
  }

  async function cargarConductores() {
    try {
      const res = await fetch(`${CONDUCTOR_API}/todos`)
      const data = await res.json()
      setConductores(data)
    } catch { }
  }

  async function cargarConductoresAfiliados() {
    try {
      const res = await fetch(`${CONDUCTOR_AFILIADO_API}/todos`)
      const data = await res.json()
      setConductoresAfiliados(data)
    } catch { }
  }

  async function cargarIndependientes() {
    try {
      const res = await fetch(`${INDEPENDIENTE_API}/todos`)
      const data = await res.json()
      setIndependientes(data)
    } catch { }
  }

  async function cambiarEstadoIndependiente(id, estado) {
    try {
      await fetch(`${INDEPENDIENTE_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivoRechazo: motivoRechazoInd[id] || '' })
      })
      setIndependientes(c => c.map(i => i._id === id ? { ...i, estado } : i))
    } catch { }
  }

  async function cambiarEstadoAfiliado(id, estado) {
    try {
      await fetch(`${CONDUCTOR_AFILIADO_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivoRechazo: motivoRechazoAfiliado[id] || '' })
      })
      setConductoresAfiliados(c => c.map(cd => cd._id === id ? { ...cd, estado } : cd))
    } catch { }
  }

  async function cambiarEstado(id, estado) {
    setGuardando(g => ({ ...g, [id]: true }))
    try {
      await fetch(`${API}/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado, motivoRechazo: motivoRechazo[id] || '', checklist: checklists[id] || {} })
      })
      setSolicitudes(s => s.map(u => u._id === id ? { ...u, estado } : u))
    } catch { }
    setGuardando(g => ({ ...g, [id]: false }))
  }

  async function guardarChecklist(id) {
    setGuardando(g => ({ ...g, [id]: true }))
    try {
      await fetch(`${API}/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: checklists[id] || {} })
      })
    } catch { }
    setGuardando(g => ({ ...g, [id]: false }))
  }

  async function cambiarEstadoVehiculo(id, estado) {
    try {
      await fetch(`${VEHICULO_API}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })
      setVehiculos(v => v.map(vh => vh._id === id ? { ...vh, estado } : vh))
    } catch { }
  }

  function toggleChecklist(userId, campo) {
    setChecklists(cl => ({ ...cl, [userId]: { ...(cl[userId] || {}), [campo]: !cl[userId]?.[campo] } }))
  }

  function rolLabel(rol) {
    return { empresa_remitente: '📦 Empresa remitente', empresa_flota: '🚛 Empresa con flota', ambas: '🔄 Ambas' }[rol] || rol
  }

  const filtradas = solicitudes.filter(s => filtro === 'todas' ? true : s.estado === filtro)
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
  const vehiculosPendientes = vehiculos.filter(v => v.estado === 'pendiente').length
  const afiliadosPendientes = conductoresAfiliados.filter(c => c.estado === 'pendiente').length
  const independientesPendientes = independientes.filter(i => i.estado === 'pendiente').length
  const necesitaFlota = (u) => u.rol === 'empresa_flota' || u.rol === 'ambas'

  // Filtros de buscador
  const conductoresFiltrados = conductores.filter(c => {
    if (!buscarConductor) return true
    const q = buscarConductor.toLowerCase()
    return c.nombre?.toLowerCase().includes(q) ||
      c.cedula?.includes(q) ||
      c.empresa?.nombre?.toLowerCase().includes(q)
  })

  const afiliadosFiltrados = conductoresAfiliados.filter(c => {
    if (!buscarAfiliado) return true
    const q = buscarAfiliado.toLowerCase()
    return c.nombre?.toLowerCase().includes(q) ||
      c.cedula?.includes(q) ||
      c.nombreEmpresa?.toLowerCase().includes(q)
  })

  const s = {
    body: { minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', color: 'white' },
    center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card: { background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', padding: '40px', width: '400px' },
    title: { fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '6px' },
    sub: { fontSize: '13px', color: '#7A8FAD', marginBottom: '24px' },
    inp: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '14px', boxSizing: 'border-box' },
    btn: { width: '100%', background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    topbar: { padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,14,28,.9)', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'sticky', top: 0, zIndex: 10 },
    content: { padding: '28px 32px' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' },
    kpi: { background: '#0E1E38', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '20px' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' },
    filterBtn: (on) => ({ background: on ? 'rgba(37,99,235,.15)' : 'rgba(255,255,255,.05)', border: on ? '1px solid rgba(37,99,235,.3)' : '1px solid rgba(255,255,255,.07)', color: on ? '#60A5FA' : '#7A8FAD', padding: '7px 16px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }),
    tabBtn: (on) => ({ background: on ? '#F97316' : 'rgba(255,255,255,.05)', border: on ? 'none' : '1px solid rgba(255,255,255,.07)', color: on ? 'white' : '#7A8FAD', padding: '9px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }),
    solCard: (estado) => ({ background: 'rgba(255,255,255,.03)', border: `1px solid ${estado === 'pendiente' ? 'rgba(245,158,11,.2)' : estado === 'aprobado' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'}`, borderRadius: '14px', padding: '20px', marginBottom: '14px' }),
    badge: (estado) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: estado === 'pendiente' ? 'rgba(245,158,11,.12)' : estado === 'aprobado' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: estado === 'pendiente' ? '#F59E0B' : estado === 'aprobado' ? '#10B981' : '#EF4444' }),
    btnAprobar: { background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.25)', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
    btnRechazar: { background: 'rgba(239,68,68,.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)', padding: '10px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
    datoBox: { background: 'rgba(255,255,255,.04)', borderRadius: '8px', padding: '10px 12px' },
    checkItem: (marcado) => ({ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '9px', background: marcado ? 'rgba(16,185,129,.06)' : 'rgba(255,255,255,.03)', border: `1px solid ${marcado ? 'rgba(16,185,129,.2)' : 'rgba(255,255,255,.07)'}`, cursor: 'pointer', marginBottom: '6px', transition: '.2s' }),
    docBtn: { background: 'rgba(37,99,235,.12)', color: '#60A5FA', border: '1px solid rgba(37,99,235,.2)', padding: '7px 14px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textDecoration: 'none', display: 'inline-block' },
    searchInp: { background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '10px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', width: '320px', boxSizing: 'border-box' },
  }

  if (!auth) return (
    <div style={s.body}>
      <div style={s.center}>
        <div style={s.card}>
          <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🔐</div>
          <div style={{ ...s.title, textAlign: 'center' }}>Panel Admin</div>
          <div style={{ ...s.sub, textAlign: 'center' }}>CargoShare · Acceso restringido</div>
          <input type="password" placeholder="Contrasena de administrador"
            value={pass} onChange={e => { setPass(e.target.value); setPassErr(false) }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ ...s.inp, border: passErr ? '1px solid #EF4444' : '1px solid rgba(255,255,255,.1)' }} />
          {passErr && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '12px' }}>Contrasena incorrecta</div>}
          <button onClick={login} style={s.btn}>Entrar →</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={s.body}>
      <div style={s.topbar}>
        <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '18px', fontWeight: '800' }}>
          Cargo<span style={{ color: '#F97316' }}>Share</span> <span style={{ fontSize: '13px', color: '#7A8FAD', fontWeight: '400' }}>Admin</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {(pendientes > 0 || vehiculosPendientes > 0 || afiliadosPendientes > 0) && (
            <div style={{ background: '#F97316', color: 'white', fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px' }}>
              🔔 {pendientes + vehiculosPendientes + afiliadosPendientes + independientesPendientes} pendientes
            </div>
          )}
          <button onClick={() => setAuth(false)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '8px 16px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', cursor: 'pointer' }}>🚪 Salir</button>
        </div>
      </div>

      <div style={s.content}>
        {/* TABS */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <button onClick={() => setVista('usuarios')} style={s.tabBtn(vista === 'usuarios')}>
            👥 Empresas {pendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{pendientes}</span>}
          </button>
          <button onClick={() => { setVista('vehiculos'); cargarVehiculos() }} style={s.tabBtn(vista === 'vehiculos')}>
            🚛 Vehiculos {vehiculosPendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{vehiculosPendientes}</span>}
          </button>
          <button onClick={() => { setVista('conductores-registrados'); cargarConductores() }} style={s.tabBtn(vista === 'conductores-registrados')}>
            👤 Conductores registrados
          </button>
          <button onClick={() => { setVista('conductores-afiliados'); cargarConductoresAfiliados() }} style={s.tabBtn(vista === 'conductores-afiliados')}>
            🚗 Conductores afiliados {afiliadosPendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{afiliadosPendientes}</span>}
          </button>
          <button onClick={() => { setVista('independientes'); cargarIndependientes() }} style={s.tabBtn(vista === 'independientes')}>
            🚚 Independientes {independientesPendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{independientesPendientes}</span>}
          </button>
        </div>

        {/* ── EMPRESAS ── */}
        {vista === 'usuarios' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Solicitudes de registro</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Revisa la informacion de cada empresa y aprueba o rechaza su cuenta</div>
            </div>
            <div style={s.kpiGrid}>
              {[['Total', solicitudes.length, '#60A5FA', '📋'], ['Pendientes', pendientes, '#F59E0B', '⏳'], ['Aprobadas', solicitudes.filter(s => s.estado === 'aprobado').length, '#10B981', '✅'], ['Rechazadas', solicitudes.filter(s => s.estado === 'rechazado').length, '#EF4444', '❌']].map(([label, val, color, ic]) => (
                <div key={label} style={s.kpi}>
                  <div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{ic} {label}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={s.filterRow}>
              {[['todas', 'Todas'], ['pendiente', 'Pendientes'], ['aprobado', 'Aprobadas'], ['rechazado', 'Rechazadas']].map(([val, label]) => (
                <button key={val} onClick={() => setFiltro(val)} style={s.filterBtn(filtro === val)}>{label}</button>
              ))}
              <button onClick={cargarSolicitudes} style={{ ...s.filterBtn(false), marginLeft: 'auto' }}>🔄 Actualizar</button>
            </div>
            {cargando && <div style={{ textAlign: 'center', padding: '40px', color: '#7A8FAD' }}>Cargando...</div>}
            {!cargando && filtradas.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>No hay solicitudes</div>
            )}
            {filtradas.map(u => (
              <div key={u._id} style={s.solCard(u.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🏢</div>
                    <div>
                      <div style={{ fontSize: '16px', fontWeight: '700' }}>{u.razonSocial || u.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>
                        {rolLabel(u.rol)} · {new Date(u.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {u.añosOperacion && <span style={{ color: '#10B981', marginLeft: '8px' }}>· {u.añosOperacion} año{u.añosOperacion !== 1 ? 's' : ''} de operacion</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <div style={s.badge(u.estado)}>
                      <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                      {u.estado === 'pendiente' ? 'Pendiente' : u.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                    </div>
                    <button onClick={() => setExpandido(expandido === u._id ? null : u._id)}
                      style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '6px 12px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '12px', cursor: 'pointer' }}>
                      {expandido === u._id ? 'Cerrar' : 'Ver detalle'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[['NIT', u.nit], ['Ciudad', u.ciudad || '-'], ['Telefono', u.telefono || '-'], ['Correo', u.correoEmpresa || u.correo]].map(([k, v]) => (
                    <div key={k} style={s.datoBox}>
                      <div style={{ fontSize: '10px', color: '#7A8FAD', marginBottom: '3px', fontWeight: '700', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600', wordBreak: 'break-all' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {expandido === u._id && (
                  <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: '16px', marginTop: '4px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#7A8FAD', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Informacion completa</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
                      {[
                        ['Razon social', u.razonSocial || u.nombre], ['NIT', u.nit], ['Tipo de empresa', rolLabel(u.rol)], ['Ciudad', u.ciudad || '-'],
                        ['Direccion', u.direccion || '-'], ['Telefono', u.telefono || '-'], ['Correo corporativo', u.correoEmpresa || u.correo],
                        ['Fecha constitucion', u.fechaConstitucion ? new Date(u.fechaConstitucion).toLocaleDateString('es-CO') : '-'],
                        ['Anos de operacion', u.añosOperacion ? `${u.añosOperacion} ano${u.añosOperacion !== 1 ? 's' : ''}` : '-'],
                        ['Rep. legal', u.nombreRepLegal || '-'], ['Cedula rep. legal', u.cedulaRepLegal || '-'],
                      ].map(([k, v]) => (
                        <div key={k} style={s.datoBox}><div style={{ fontSize: '10px', color: '#7A8FAD', marginBottom: '3px', fontWeight: '700', textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div></div>
                      ))}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#7A8FAD', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Documentos adjuntos</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
                      {u.documentos?.rut && <a href={u.documentos.rut} target="_blank" rel="noreferrer" style={s.docBtn}>📄 Ver RUT</a>}
                      {u.documentos?.camaraComercio && <a href={u.documentos.camaraComercio} target="_blank" rel="noreferrer" style={s.docBtn}>🏛️ Camara de Comercio</a>}
                      {u.documentos?.certRepresentacion && <a href={u.documentos.certRepresentacion} target="_blank" rel="noreferrer" style={s.docBtn}>📋 Cert. Representacion</a>}
                      {u.documentos?.cedulaRep && <a href={u.documentos.cedulaRep} target="_blank" rel="noreferrer" style={s.docBtn}>🪪 Cedula Rep. Legal</a>}
                      {u.documentos?.habilitacionMT && <a href={u.documentos.habilitacionMT} target="_blank" rel="noreferrer" style={s.docBtn}>🚛 Habilitacion MinTransporte</a>}
                      {u.documentos?.polizaRC && <a href={u.documentos.polizaRC} target="_blank" rel="noreferrer" style={s.docBtn}>🛡️ Poliza RC</a>}
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#7A8FAD', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Checklist de verificacion</div>
                    <div style={{ marginBottom: '16px' }}>
                      {[
                        { key: 'rutActivo', label: 'RUT activo y vigente en DIAN', link: 'https://muisca.dian.gov.co/WebRutMuisca/DefConsultaEstadoRUT.faces' },
                        { key: 'camaraVigente', label: 'Camara de Comercio vigente (max. 90 dias)', link: 'https://www.rues.org.co' },
                        { key: 'repLegalOk', label: 'Representante legal verificado' },
                        { key: 'minimoUnAnio', label: `Minimo 1 ano de operacion ${u.añosOperacion ? `— ${u.añosOperacion} anos` : ''}` },
                        { key: 'correoCorpOk', label: 'Correo corporativo valido' },
                        ...(necesitaFlota(u) ? [
                          { key: 'minTransporteOk', label: 'Habilitacion MinTransporte verificada', link: 'https://www.mintransporte.gov.co' },
                          { key: 'polizaVigente', label: 'Poliza de responsabilidad civil vigente' },
                        ] : []),
                      ].map(item => (
                        <div key={item.key} style={s.checkItem(checklists[u._id]?.[item.key])} onClick={() => toggleChecklist(u._id, item.key)}>
                          <div style={{ width: '20px', height: '20px', borderRadius: '6px', border: `2px solid ${checklists[u._id]?.[item.key] ? '#10B981' : 'rgba(255,255,255,.2)'}`, background: checklists[u._id]?.[item.key] ? '#10B981' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '12px' }}>
                            {checklists[u._id]?.[item.key] ? '✓' : ''}
                          </div>
                          <span style={{ fontSize: '13px', color: checklists[u._id]?.[item.key] ? 'white' : '#7A8FAD', flex: 1 }}>{item.label}</span>
                          {item.link && <a href={item.link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontSize: '11px', color: '#60A5FA', textDecoration: 'none' }}>Verificar →</a>}
                        </div>
                      ))}
                    </div>
                    <button onClick={() => guardarChecklist(u._id)} disabled={guardando[u._id]}
                      style={{ background: 'rgba(37,99,235,.12)', color: '#60A5FA', border: '1px solid rgba(37,99,235,.2)', padding: '8px 16px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer', marginBottom: '20px' }}>
                      {guardando[u._id] ? 'Guardando...' : 'Guardar checklist'}
                    </button>
                    {u.estado === 'pendiente' && (
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#7A8FAD', textTransform: 'uppercase', letterSpacing: '.5px', marginBottom: '10px' }}>Acciones</div>
                        <div style={{ marginBottom: '10px' }}>
                          <input style={{ ...s.inp, marginBottom: '12px' }} placeholder="Motivo de rechazo (si aplica)"
                            value={motivoRechazo[u._id] || ''} onChange={e => setMotivoRechazo(m => ({ ...m, [u._id]: e.target.value }))} />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button onClick={() => cambiarEstado(u._id, 'aprobado')} disabled={guardando[u._id]} style={s.btnAprobar}>✅ Aprobar cuenta</button>
                          <button onClick={() => cambiarEstado(u._id, 'rechazado')} disabled={guardando[u._id]} style={s.btnRechazar}>❌ Rechazar</button>
                        </div>
                      </div>
                    )}
                    {u.estado !== 'pendiente' && (
                      <div style={{ fontSize: '13px', color: u.estado === 'aprobado' ? '#10B981' : '#EF4444', padding: '10px 0' }}>
                        {u.estado === 'aprobado' ? '✅ Cuenta aprobada' : `❌ Solicitud rechazada${u.motivoRechazo ? ` — ${u.motivoRechazo}` : ''}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── VEHICULOS ── */}
        {vista === 'vehiculos' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Vehiculos registrados</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Verifica y aprueba los vehiculos de las empresas con flota</div>
            </div>
            <div style={s.kpiGrid}>
              {[['Total', vehiculos.length, '#60A5FA', '🚛'], ['Pendientes', vehiculosPendientes, '#F59E0B', '⏳'], ['Aprobados', vehiculos.filter(v => v.estado === 'aprobado').length, '#10B981', '✅'], ['Rechazados', vehiculos.filter(v => v.estado === 'rechazado').length, '#EF4444', '❌']].map(([label, val, color, ic]) => (
                <div key={label} style={s.kpi}><div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{ic} {label}</div><div style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }}>{val}</div></div>
              ))}
            </div>
            <div style={{ ...s.filterRow, justifyContent: 'flex-end' }}>
              <button onClick={cargarVehiculos} style={s.filterBtn(false)}>🔄 Actualizar</button>
            </div>
            {vehiculos.length === 0 && <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>No hay vehiculos registrados aun</div>}
            {vehiculos.map(v => (
              <div key={v._id} style={s.solCard(v.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🚛</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{v.placa} — {v.tipo} {v.carroceria ? `· ${v.carroceria.replace('_', ' ')}` : ''}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{v.transportista?.nombre || 'Empresa'} · {v.marca} {v.modelo} {v.año}</div>
                    </div>
                  </div>
                  <div style={s.badge(v.estado)}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>{v.estado === 'pendiente' ? 'Pendiente' : v.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[['Peso max', `${v.capacidad?.pesoMax?.toLocaleString('es-CO')} kg`], ['Volumen', `${v.capacidad?.volumenMax || '-'} m³`], ['Dimensiones', `${v.capacidad?.largo || '-'}x${v.capacidad?.ancho || '-'}x${v.capacidad?.alto || '-'} m`], ['Carroceria', v.carroceria?.replace('_', ' ') || '-']].map(([k, val]) => (
                    <div key={k} style={s.datoBox}><div style={{ fontSize: '10px', color: '#7A8FAD', marginBottom: '3px', fontWeight: '700', textTransform: 'uppercase' }}>{k}</div><div style={{ fontSize: '12px', fontWeight: '600' }}>{val}</div></div>
                  ))}
                </div>
                {v.estado === 'pendiente' ? (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => cambiarEstadoVehiculo(v._id, 'aprobado')} style={s.btnAprobar}>✅ Aprobar vehiculo</button>
                    <button onClick={() => cambiarEstadoVehiculo(v._id, 'rechazado')} style={s.btnRechazar}>❌ Rechazar</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: v.estado === 'aprobado' ? '#10B981' : '#EF4444' }}>
                    {v.estado === 'aprobado' ? '✅ Vehiculo aprobado' : '❌ Vehiculo rechazado'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── CONDUCTORES REGISTRADOS (por empresa, solo lectura) ── */}
        {vista === 'conductores-registrados' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Conductores registrados 👤</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Conductores que las empresas han registrado. Solo lectura — no se aprueban aqui.</div>
            </div>

            {/* Buscador */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <input
                style={s.searchInp}
                placeholder="🔍 Buscar por nombre, cedula o empresa..."
                value={buscarConductor}
                onChange={e => setBuscarConductor(e.target.value)}
              />
              <button onClick={cargarConductores} style={s.filterBtn(false)}>🔄 Actualizar</button>
              <span style={{ fontSize: '13px', color: '#7A8FAD' }}>{conductoresFiltrados.length} resultado{conductoresFiltrados.length !== 1 ? 's' : ''}</span>
            </div>

            {conductoresFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>
                {buscarConductor ? `Sin resultados para "${buscarConductor}"` : 'No hay conductores registrados aun'}
              </div>
            )}

            {conductoresFiltrados.map(c => {
              const vencimiento = c.vencimientoLicencia ? new Date(c.vencimientoLicencia) : null
              const diasParaVencer = vencimiento ? Math.floor((vencimiento - new Date()) / (1000 * 60 * 60 * 24)) : null
              const proximoVencer = diasParaVencer !== null && diasParaVencer <= 60
              return (
                <div key={c._id} style={{ background: 'rgba(255,255,255,.03)', border: '1px solid rgba(255,255,255,.07)', borderRadius: '14px', padding: '18px', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {c.fotoConductor
                      ? <img src={c.fotoConductor} alt={c.nombre} style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>👤</div>
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{c.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>CC {c.cedula} · {c.telefono || 'Sin telefono'} · Lic. {c.categoriaLicencia}</div>
                      <div style={{ fontSize: '11px', color: '#60A5FA', marginTop: '2px' }}>Empresa: {c.empresa?.nombre || '-'}</div>
                      {vencimiento && (
                        <div style={{ fontSize: '11px', color: proximoVencer ? '#F59E0B' : '#10B981', marginTop: '2px' }}>
                          {proximoVencer ? `⚠️ Licencia vence en ${diasParaVencer} dias` : `✅ Licencia vigente hasta ${vencimiento.toLocaleDateString('es-CO')}`}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {c.fotoCedula && <a href={c.fotoCedula} target="_blank" rel="noreferrer" style={s.docBtn}>🪪 Ver cedula</a>}
                      {c.fotoLicencia && <a href={c.fotoLicencia} target="_blank" rel="noreferrer" style={s.docBtn}>📄 Ver licencia</a>}
                      {c.fotoConductor && <a href={c.fotoConductor} target="_blank" rel="noreferrer" style={s.docBtn}>📷 Ver foto</a>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ── CONDUCTORES AFILIADOS (se registran solos, aprobar/rechazar) ── */}
        {vista === 'conductores-afiliados' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Conductores afiliados 🚗</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Solicitudes de conductores que quieren acceso al panel. Compara con conductores registrados y aprueba o rechaza.</div>
            </div>

            <div style={s.kpiGrid}>
              {[['Total', conductoresAfiliados.length, '#60A5FA', '🚗'], ['Pendientes', afiliadosPendientes, '#F59E0B', '⏳'], ['Aprobados', conductoresAfiliados.filter(c => c.estado === 'aprobado').length, '#10B981', '✅'], ['Rechazados', conductoresAfiliados.filter(c => c.estado === 'rechazado').length, '#EF4444', '❌']].map(([label, val, color, ic]) => (
                <div key={label} style={s.kpi}><div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{ic} {label}</div><div style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }}>{val}</div></div>
              ))}
            </div>

            {/* Buscador */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <input
                style={s.searchInp}
                placeholder="🔍 Buscar por nombre, cedula o empresa..."
                value={buscarAfiliado}
                onChange={e => setBuscarAfiliado(e.target.value)}
              />
              <button onClick={cargarConductoresAfiliados} style={s.filterBtn(false)}>🔄 Actualizar</button>
              <span style={{ fontSize: '13px', color: '#7A8FAD' }}>{afiliadosFiltrados.length} resultado{afiliadosFiltrados.length !== 1 ? 's' : ''}</span>
            </div>

            {afiliadosFiltrados.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>
                {buscarAfiliado ? `Sin resultados para "${buscarAfiliado}"` : 'No hay solicitudes de afiliacion aun'}
              </div>
            )}

            {afiliadosFiltrados.map(c => (
              <div key={c._id} style={s.solCard(c.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🚗</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{c.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>CC {c.cedula} · {c.correo} · Lic. {c.categoriaLicencia}</div>
                      <div style={{ fontSize: '12px', color: '#F97316', marginTop: '2px', fontWeight: '600' }}>Empresa declarada: {c.nombreEmpresa}</div>
                      <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>
                        Vehiculo: {c.tipoVehiculo || '-'} · Solicitud: {new Date(c.fecha).toLocaleDateString('es-CO')}
                      </div>
                    </div>
                  </div>
                  <div style={s.badge(c.estado)}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>{c.estado === 'pendiente' ? 'Pendiente' : c.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}</div>
                </div>

                {/* Documentos */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {c.fotoCedula && <a href={c.fotoCedula} target="_blank" rel="noreferrer" style={s.docBtn}>🪪 Ver cedula</a>}
                  {c.fotoLicencia && <a href={c.fotoLicencia} target="_blank" rel="noreferrer" style={s.docBtn}>📄 Ver licencia</a>}
                  {!c.fotoCedula && !c.fotoLicencia && <span style={{ fontSize: '12px', color: '#F59E0B' }}>⚠️ Sin documentos</span>}
                </div>

                {/* Tip: buscar empresa */}
                <div style={{ background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.15)', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px', fontSize: '12px', color: '#60A5FA' }}>
                  💡 Para verificar: busca <strong>"{c.nombreEmpresa}"</strong> en la pestana "Conductores registrados" y compara los datos.
                </div>

                {/* Acciones */}
                {c.estado === 'pendiente' && (
                  <div>
                    <input
                      style={{ ...s.inp, marginBottom: '10px' }}
                      placeholder="Motivo de rechazo (si aplica)"
                      value={motivoRechazoAfiliado[c._id] || ''}
                      onChange={e => setMotivoRechazoAfiliado(m => ({ ...m, [c._id]: e.target.value }))}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => cambiarEstadoAfiliado(c._id, 'aprobado')} style={s.btnAprobar}>✅ Aprobar acceso</button>
                      <button onClick={() => cambiarEstadoAfiliado(c._id, 'rechazado')} style={s.btnRechazar}>❌ Rechazar</button>
                    </div>
                  </div>
                )}

                {c.estado !== 'pendiente' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: c.estado === 'aprobado' ? '#10B981' : '#EF4444' }}>
                      {c.estado === 'aprobado' ? '✅ Acceso aprobado — puede iniciar sesion en /conductor' : `❌ Rechazado${c.motivoRechazo ? ` — ${c.motivoRechazo}` : ''}`}
                    </div>
                    <button onClick={() => cambiarEstadoAfiliado(c._id, c.estado === 'aprobado' ? 'rechazado' : 'aprobado')}
                      style={{ fontSize: '11px', color: '#7A8FAD', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                      Cambiar estado
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── INDEPENDIENTES ── */}
        {vista === 'independientes' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Transportistas independientes 🚚</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Personas naturales con camion propio que quieren generar ingresos en CargoShare.</div>
            </div>
            <div style={s.kpiGrid}>
              {[['Total', independientes.length, '#60A5FA', '🚚'], ['Pendientes', independientesPendientes, '#F59E0B', '⏳'], ['Aprobados', independientes.filter(i => i.estado === 'aprobado').length, '#10B981', '✅'], ['Rechazados', independientes.filter(i => i.estado === 'rechazado').length, '#EF4444', '❌']].map(([label, val, color, ic]) => (
                <div key={label} style={s.kpi}><div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{ic} {label}</div><div style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }}>{val}</div></div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center' }}>
              <input style={s.searchInp} placeholder="🔍 Buscar por nombre, cedula o placa..." value={buscarIndependiente} onChange={e => setBuscarIndependiente(e.target.value)} />
              <button onClick={cargarIndependientes} style={s.filterBtn(false)}>🔄 Actualizar</button>
            </div>
            {independientes.filter(i => {
              if (!buscarIndependiente) return true
              const q = buscarIndependiente.toLowerCase()
              return i.nombre?.toLowerCase().includes(q) || i.cedula?.includes(q) || i.vehiculo?.placa?.toLowerCase().includes(q)
            }).map(ind => (
              <div key={ind._id} style={s.solCard(ind.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: 'rgba(16,185,129,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0 }}>🚚</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{ind.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>CC {ind.cedula} · {ind.correo} · {ind.ciudadBase}</div>
                      <div style={{ fontSize: '12px', color: '#10B981', marginTop: '2px', fontWeight: '600' }}>
                        {ind.vehiculo?.tipo} · Placa {ind.vehiculo?.placa} · {ind.vehiculo?.capacidadKg?.toLocaleString('es-CO')} kg
                      </div>
                    </div>
                  </div>
                  <div style={s.badge(ind.estado)}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>{ind.estado === 'pendiente' ? 'Pendiente' : ind.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}</div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  {ind.fotoCedula && <a href={ind.fotoCedula} target="_blank" rel="noreferrer" style={s.docBtn}>🪪 Cedula</a>}
                  {ind.fotoLicencia && <a href={ind.fotoLicencia} target="_blank" rel="noreferrer" style={s.docBtn}>📄 Licencia</a>}
                  {ind.tarjetaPropiedad && <a href={ind.tarjetaPropiedad} target="_blank" rel="noreferrer" style={s.docBtn}>📋 Tarjeta propiedad</a>}
                  {ind.soat && <a href={ind.soat} target="_blank" rel="noreferrer" style={s.docBtn}>🛡️ SOAT</a>}
                  {ind.tecnicoMecanica && <a href={ind.tecnicoMecanica} target="_blank" rel="noreferrer" style={s.docBtn}>🔧 Tec. Mecanica</a>}
                  {ind.vehiculo?.fotoVehiculo && <a href={ind.vehiculo.fotoVehiculo} target="_blank" rel="noreferrer" style={s.docBtn}>📷 Foto vehiculo</a>}
                  {!ind.fotoCedula && !ind.fotoLicencia && <span style={{ fontSize: '12px', color: '#F59E0B' }}>⚠️ Sin documentos</span>}
                </div>
                {ind.estado === 'pendiente' && (
                  <div>
                    <input style={{ ...s.inp, marginBottom: '10px' }} placeholder="Motivo de rechazo (si aplica)"
                      value={motivoRechazoInd[ind._id] || ''} onChange={e => setMotivoRechazoInd(m => ({ ...m, [ind._id]: e.target.value }))} />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => cambiarEstadoIndependiente(ind._id, 'aprobado')} style={s.btnAprobar}>✅ Aprobar</button>
                      <button onClick={() => cambiarEstadoIndependiente(ind._id, 'rechazado')} style={s.btnRechazar}>❌ Rechazar</button>
                    </div>
                  </div>
                )}
                {ind.estado !== 'pendiente' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '13px', color: ind.estado === 'aprobado' ? '#10B981' : '#EF4444' }}>
                      {ind.estado === 'aprobado' ? '✅ Aprobado — puede publicar rutas en /independiente' : `❌ Rechazado${ind.motivoRechazo ? ` — ${ind.motivoRechazo}` : ''}`}
                    </div>
                    <button onClick={() => cambiarEstadoIndependiente(ind._id, ind.estado === 'aprobado' ? 'rechazado' : 'aprobado')}
                      style={{ fontSize: '11px', color: '#7A8FAD', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontFamily: 'DM Sans,sans-serif' }}>
                      Cambiar estado
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}