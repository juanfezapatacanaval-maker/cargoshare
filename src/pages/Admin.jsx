import { useState, useEffect } from 'react'

const API = 'https://cargoshare-api-production.up.railway.app/api/auth'
const VEHICULO_API = 'https://cargoshare-api-production.up.railway.app/api/vehiculo'

export default function Admin() {
  const [auth, setAuth] = useState(false)
  const [pass, setPass] = useState('')
  const [passErr, setPassErr] = useState(false)
  const [vista, setVista] = useState('usuarios')
  const [solicitudes, setSolicitudes] = useState([])
  const [vehiculos, setVehiculos] = useState([])
  const [filtro, setFiltro] = useState('todas')
  const [cargando, setCargando] = useState(false)

  const ADMIN_PASS = 'cargoshare2025admin'

  function login() {
    if (pass === ADMIN_PASS) { setAuth(true); cargarSolicitudes(); cargarVehiculos() }
    else setPassErr(true)
  }

  async function cargarSolicitudes() {
    setCargando(true)
    try {
      const res = await fetch(`${API}/solicitudes`)
      const data = await res.json()
      setSolicitudes(data)
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

  async function cambiarEstado(id, estado) {
    try {
      await fetch(`${API}/solicitudes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })
      setSolicitudes(s => s.map(u => u._id === id ? { ...u, estado } : u))
    } catch { }
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

  const filtradas = solicitudes.filter(s => filtro === 'todas' ? true : s.estado === filtro)
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente').length
  const vehiculosPendientes = vehiculos.filter(v => v.estado === 'pendiente').length

  const s = {
    body: { minHeight: '100vh', background: '#060E1C', fontFamily: 'DM Sans,sans-serif', color: 'white' },
    center: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    card: { background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '20px', padding: '40px', width: '400px' },
    title: { fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '6px' },
    sub: { fontSize: '13px', color: '#7A8FAD', marginBottom: '24px' },
    inp: { width: '100%', background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', borderRadius: '9px', padding: '11px 14px', color: 'white', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', outline: 'none', marginBottom: '14px' },
    btn: { width: '100%', background: '#F97316', border: 'none', color: 'white', padding: '13px', borderRadius: '10px', fontFamily: 'DM Sans,sans-serif', fontSize: '14px', fontWeight: '700', cursor: 'pointer' },
    topbar: { padding: '0 32px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(6,14,28,.9)', borderBottom: '1px solid rgba(255,255,255,.07)', position: 'sticky', top: 0 },
    content: { padding: '28px 32px' },
    kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '16px', marginBottom: '28px' },
    kpi: { background: '#0E1E38', border: '1px solid rgba(255,255,255,.07)', borderRadius: '16px', padding: '20px' },
    filterRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    filterBtn: (on) => ({ background: on ? 'rgba(37,99,235,.15)' : 'rgba(255,255,255,.05)', border: on ? '1px solid rgba(37,99,235,.3)' : '1px solid rgba(255,255,255,.07)', color: on ? '#60A5FA' : '#7A8FAD', padding: '7px 16px', borderRadius: '8px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }),
    tabBtn: (on) => ({ background: on ? '#F97316' : 'rgba(255,255,255,.05)', border: on ? 'none' : '1px solid rgba(255,255,255,.07)', color: on ? 'white' : '#7A8FAD', padding: '9px 20px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }),
    solCard: (estado) => ({ background: 'rgba(255,255,255,.03)', border: `1px solid ${estado === 'pendiente' ? 'rgba(245,158,11,.2)' : estado === 'aprobado' ? 'rgba(16,185,129,.15)' : 'rgba(239,68,68,.15)'}`, borderRadius: '14px', padding: '20px', marginBottom: '14px' }),
    badge: (estado) => ({ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '100px', fontSize: '11px', fontWeight: '700', background: estado === 'pendiente' ? 'rgba(245,158,11,.12)' : estado === 'aprobado' ? 'rgba(16,185,129,.12)' : 'rgba(239,68,68,.12)', color: estado === 'pendiente' ? '#F59E0B' : estado === 'aprobado' ? '#10B981' : '#EF4444' }),
    btnAprobar: { background: 'rgba(16,185,129,.15)', color: '#10B981', border: '1px solid rgba(16,185,129,.25)', padding: '9px 18px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer', marginRight: '10px' },
    btnRechazar: { background: 'rgba(239,68,68,.1)', color: '#EF4444', border: '1px solid rgba(239,68,68,.2)', padding: '9px 18px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', fontWeight: '700', cursor: 'pointer' },
  }

  if (!auth) return (
    <div style={s.body}>
      <div style={s.center}>
        <div style={s.card}>
          <div style={{ fontSize: '48px', textAlign: 'center', marginBottom: '16px' }}>🔐</div>
          <div style={{ ...s.title, textAlign: 'center' }}>Panel Admin</div>
          <div style={{ ...s.sub, textAlign: 'center' }}>CargoShare · Acceso restringido</div>
          <input type="password" placeholder="Contraseña de administrador"
            value={pass} onChange={e => { setPass(e.target.value); setPassErr(false) }}
            onKeyDown={e => e.key === 'Enter' && login()}
            style={{ ...s.inp, border: passErr ? '1px solid #EF4444' : '1px solid rgba(255,255,255,.1)' }} />
          {passErr && <div style={{ fontSize: '12px', color: '#EF4444', marginBottom: '12px' }}>⚠️ Contraseña incorrecta</div>}
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
          {(pendientes > 0 || vehiculosPendientes > 0) && (
            <div style={{ background: '#F97316', color: 'white', fontSize: '12px', fontWeight: '700', padding: '5px 12px', borderRadius: '100px' }}>
              🔔 {pendientes + vehiculosPendientes} pendientes
            </div>
          )}
          <button onClick={() => setAuth(false)} style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)', color: '#7A8FAD', padding: '8px 16px', borderRadius: '9px', fontFamily: 'DM Sans,sans-serif', fontSize: '13px', cursor: 'pointer' }}>🚪 Salir</button>
        </div>
      </div>

      <div style={s.content}>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px' }}>
          <button onClick={() => setVista('usuarios')} style={s.tabBtn(vista === 'usuarios')}>
            👥 Usuarios {pendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{pendientes}</span>}
          </button>
          <button onClick={() => { setVista('vehiculos'); cargarVehiculos() }} style={s.tabBtn(vista === 'vehiculos')}>
            🚛 Vehículos {vehiculosPendientes > 0 && <span style={{ marginLeft: '6px', background: 'rgba(255,255,255,.2)', padding: '1px 6px', borderRadius: '100px', fontSize: '11px' }}>{vehiculosPendientes}</span>}
          </button>
        </div>

        {/* USUARIOS */}
        {vista === 'usuarios' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Solicitudes de registro</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Aprueba o rechaza cuentas nuevas</div>
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
              <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>
                📭 No hay solicitudes
              </div>
            )}
            {filtradas.map(u => (
              <div key={u._id} style={s.solCard(u.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                      {u.rol === 'empresa' ? '📦' : '🚛'}
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{u.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{u.rol === 'empresa' ? 'Empresa remitente' : 'Transportista'} · {new Date(u.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                  <div style={s.badge(u.estado)}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                    {u.estado === 'pendiente' ? 'Pendiente' : u.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', marginBottom: '14px' }}>
                  {[['Correo', u.correo], ['NIT', u.nit], ['Rol', u.rol]].map(([k, v]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,.04)', borderRadius: '8px', padding: '9px' }}>
                      <div style={{ fontSize: '10px', color: '#7A8FAD', marginBottom: '3px' }}>{k}</div>
                      <div style={{ fontSize: '13px', fontWeight: '600' }}>{v}</div>
                    </div>
                  ))}
                </div>
                {u.estado === 'pendiente' ? (
                  <div>
                    <button onClick={() => cambiarEstado(u._id, 'aprobado')} style={s.btnAprobar}>✅ Aprobar cuenta</button>
                    <button onClick={() => cambiarEstado(u._id, 'rechazado')} style={s.btnRechazar}>❌ Rechazar</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: u.estado === 'aprobado' ? '#10B981' : '#EF4444' }}>
                    {u.estado === 'aprobado' ? '✅ Cuenta aprobada' : '❌ Solicitud rechazada'}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* VEHÍCULOS */}
        {vista === 'vehiculos' && (
          <div>
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '4px' }}>Vehículos registrados</div>
              <div style={{ fontSize: '14px', color: '#7A8FAD' }}>Verifica y aprueba los vehículos de los transportistas</div>
            </div>
            <div style={s.kpiGrid}>
              {[['Total', vehiculos.length, '#60A5FA', '🚛'], ['Pendientes', vehiculosPendientes, '#F59E0B', '⏳'], ['Aprobados', vehiculos.filter(v => v.estado === 'aprobado').length, '#10B981', '✅'], ['Rechazados', vehiculos.filter(v => v.estado === 'rechazado').length, '#EF4444', '❌']].map(([label, val, color, ic]) => (
                <div key={label} style={s.kpi}>
                  <div style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: '10px' }}>{ic} {label}</div>
                  <div style={{ fontFamily: 'Syne,sans-serif', fontSize: '30px', fontWeight: '800', color }}>{val}</div>
                </div>
              ))}
            </div>
            <div style={{ ...s.filterRow, justifyContent: 'flex-end' }}>
              <button onClick={cargarVehiculos} style={s.filterBtn(false)}>🔄 Actualizar</button>
            </div>
            {vehiculos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: '#7A8FAD', background: 'rgba(255,255,255,.02)', borderRadius: '14px', border: '1px solid rgba(255,255,255,.05)' }}>
                🚛 No hay vehículos registrados aún
              </div>
            )}
            {vehiculos.map(v => (
              <div key={v._id} style={s.solCard(v.estado)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(37,99,235,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>🚛</div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '700' }}>{v.placa} — {v.tipo}</div>
                      <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{v.transportista?.nombre || 'Transportista'} · {v.marca} {v.modelo} {v.año}</div>
                    </div>
                  </div>
                  <div style={s.badge(v.estado)}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }}></div>
                    {v.estado === 'pendiente' ? 'Pendiente' : v.estado === 'aprobado' ? 'Aprobado' : 'Rechazado'}
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '8px', marginBottom: '14px' }}>
                  {[['Peso máx', `${v.capacidad?.pesoMax} kg`], ['Volumen', `${v.capacidad?.volumenMax || '-'} m³`], ['Dimensiones', `${v.capacidad?.largo || '-'}x${v.capacidad?.ancho || '-'}x${v.capacidad?.alto || '-'} m`], ['Tipos carga', v.tiposCarga?.join(', ') || 'General']].map(([k, val]) => (
                    <div key={k} style={{ background: 'rgba(255,255,255,.04)', borderRadius: '8px', padding: '9px' }}>
                      <div style={{ fontSize: '10px', color: '#7A8FAD', marginBottom: '3px' }}>{k}</div>
                      <div style={{ fontSize: '12px', fontWeight: '600' }}>{val}</div>
                    </div>
                  ))}
                </div>
                {v.estado === 'pendiente' ? (
                  <div>
                    <button onClick={() => cambiarEstadoVehiculo(v._id, 'aprobado')} style={s.btnAprobar}>✅ Aprobar vehículo</button>
                    <button onClick={() => cambiarEstadoVehiculo(v._id, 'rechazado')} style={s.btnRechazar}>❌ Rechazar</button>
                  </div>
                ) : (
                  <div style={{ fontSize: '13px', color: v.estado === 'aprobado' ? '#10B981' : '#EF4444' }}>
                    {v.estado === 'aprobado' ? '✅ Vehículo aprobado — puede publicar rutas' : '❌ Vehículo rechazado'}
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
