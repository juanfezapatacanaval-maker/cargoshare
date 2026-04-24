import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

const API = 'https://cargoshare-api-production.up.railway.app/api'

// Tarifas hora extra por tipo de vehículo (2026)
const TARIFAS_HORA_EXTRA = {
  camioneta:      { diurna: 9635,  nocturna: 13489, festivo: 15417 },
  furgon:         { diurna: 14094, nocturna: 19719, festivo: 22550 },
  camion_rigido:  { diurna: 19219, nocturna: 26906, festivo: 30750 },
  tractomula:     { diurna: 22422, nocturna: 31395, festivo: 35875 },
}

const TIEMPO_GRATIS_MIN = 45 // primeros 45 min gratis

function calcularHorasExtra(segundos, tipoVehiculo = 'camion_rigido') {
  const minutos = Math.floor(segundos / 60)
  if (minutos <= TIEMPO_GRATIS_MIN) return { horas: 0, costo: 0 }
  const minutosExtra = minutos - TIEMPO_GRATIS_MIN
  const horasExtra = Math.ceil(minutosExtra / 60) // mínimo 1 hora completa
  const ahora = new Date()
  const hora = ahora.getHours()
  const esFestivo = false // TODO: integrar calendario festivos Colombia
  const esNocturna = hora >= 21 || hora < 6
  const tarifa = TARIFAS_HORA_EXTRA[tipoVehiculo] || TARIFAS_HORA_EXTRA.camion_rigido
  const costoXHora = esFestivo ? tarifa.festivo : esNocturna ? tarifa.nocturna : tarifa.diurna
  return { horas: horasExtra, costo: horasExtra * costoXHora, costoXHora }
}

function formatTime(segundos) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  const s = segundos % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

function formatCOP(n) {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

// ─── ESTILOS BASE ───────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: '#060E1C',
    fontFamily: 'DM Sans, sans-serif',
    color: 'white',
    maxWidth: '480px',
    margin: '0 auto',
    position: 'relative',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    background: 'rgba(6,14,28,.95)',
    borderBottom: '1px solid rgba(255,255,255,.07)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  card: {
    background: '#0E1E38',
    border: '1px solid rgba(255,255,255,.08)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '14px',
  },
  btn: (color = '#F97316', full = true) => ({
    width: full ? '100%' : 'auto',
    background: color,
    border: 'none',
    color: 'white',
    padding: '14px 20px',
    borderRadius: '12px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '8px',
  }),
  btnOutline: {
    width: '100%',
    background: 'transparent',
    border: '1px solid rgba(255,255,255,.18)',
    color: 'white',
    padding: '13px 20px',
    borderRadius: '12px',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
  label: {
    fontSize: '11px',
    color: '#7A8FAD',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '.7px',
    display: 'block',
    marginBottom: '6px',
  },
  inp: {
    width: '100%',
    background: 'rgba(255,255,255,.06)',
    border: '1px solid rgba(255,255,255,.1)',
    borderRadius: '9px',
    padding: '11px 14px',
    color: 'white',
    fontFamily: 'DM Sans, sans-serif',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tag: (color) => ({
    display: 'inline-block',
    background: `${color}18`,
    border: `1px solid ${color}40`,
    color: color,
    fontSize: '11px',
    fontWeight: '700',
    padding: '3px 10px',
    borderRadius: '100px',
  }),
  row: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,.05)',
  },
}

// ─── COMPONENTE CRONÓMETRO ───────────────────────────────────────
function Cronometro({ fase, tipoVehiculo, onStop }) {
  const [segundos, setSegundos] = useState(0)
  const [corriendo, setCorriendo] = useState(false)
  const [pausado, setPausado] = useState(false)
  const intervalo = useRef(null)

  useEffect(() => {
    if (corriendo && !pausado) {
      intervalo.current = setInterval(() => setSegundos(s => s + 1), 1000)
    } else {
      clearInterval(intervalo.current)
    }
    return () => clearInterval(intervalo.current)
  }, [corriendo, pausado])

  const horasExtra = calcularHorasExtra(segundos, tipoVehiculo)
  const minutos = Math.floor(segundos / 60)
  const enGratis = minutos <= TIEMPO_GRATIS_MIN
  const colorCrono = enGratis ? '#10B981' : '#F97316'

  function iniciar() { setCorriendo(true); setPausado(false) }
  function pausar() { setPausado(true) }
  function reanudar() { setPausado(false) }
  function detener() {
    setCorriendo(false)
    clearInterval(intervalo.current)
    onStop({ segundos, horasExtra })
  }

  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      {/* Display */}
      <div style={{
        fontFamily: 'monospace',
        fontSize: '52px',
        fontWeight: '800',
        color: colorCrono,
        letterSpacing: '2px',
        marginBottom: '6px',
        transition: 'color .5s',
      }}>
        {formatTime(segundos)}
      </div>

      {/* Estado */}
      <div style={{ marginBottom: '16px' }}>
        {!corriendo && !pausado && (
          <span style={S.tag('#7A8FAD')}>Esperando inicio</span>
        )}
        {corriendo && !pausado && enGratis && (
          <span style={S.tag('#10B981')}>✅ Tiempo gratuito — {TIEMPO_GRATIS_MIN - minutos} min restantes</span>
        )}
        {corriendo && !pausado && !enGratis && (
          <span style={S.tag('#F97316')}>⏱ Generando horas extra</span>
        )}
        {pausado && (
          <span style={S.tag('#FBBF24')}>⏸ Pausado</span>
        )}
      </div>

      {/* Costo acumulado */}
      {!enGratis && horasExtra.horas > 0 && (
        <div style={{
          background: 'rgba(249,115,22,.1)',
          border: '1px solid rgba(249,115,22,.3)',
          borderRadius: '12px',
          padding: '12px 16px',
          marginBottom: '16px',
          textAlign: 'left',
        }}>
          <div style={{ fontSize: '11px', color: '#7A8FAD', marginBottom: '4px' }}>Horas extra acumuladas</div>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#F97316' }}>
            {formatCOP(horasExtra.costo)}
          </div>
          <div style={{ fontSize: '11px', color: '#7A8FAD', marginTop: '2px' }}>
            {horasExtra.horas}h × {formatCOP(horasExtra.costoXHora)}/h · 100% para el transportista
          </div>
        </div>
      )}

      {/* Botones */}
      {!corriendo && (
        <button onClick={iniciar} style={S.btn('#10B981')}>
          ▶ Iniciar {fase === 'cargue' ? 'Cargue' : 'Descargue'}
        </button>
      )}
      {corriendo && !pausado && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <button onClick={pausar} style={{ ...S.btn('#FBBF24', false), width: '100%', marginTop: 0 }}>
            ⏸ Pausar
          </button>
          <button onClick={detener} style={{ ...S.btn('#EF4444', false), width: '100%', marginTop: 0 }}>
            ⏹ STOP
          </button>
        </div>
      )}
      {pausado && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
          <button onClick={reanudar} style={{ ...S.btn('#10B981', false), width: '100%', marginTop: 0 }}>
            ▶ Reanudar
          </button>
          <button onClick={detener} style={{ ...S.btn('#EF4444', false), width: '100%', marginTop: 0 }}>
            ⏹ STOP
          </button>
        </div>
      )}
    </div>
  )
}

// ─── COMPONENTE CÓDIGO PIN ───────────────────────────────────────
function InputCodigo({ titulo, descripcion, onConfirm, cargando }) {
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState('')

  function handleConfirm() {
    if (codigo.trim().length < 4) { setError('Ingresa el código completo'); return }
    setError('')
    onConfirm(codigo.trim().toUpperCase())
  }

  return (
    <div style={S.card}>
      <div style={{ fontSize: '16px', fontWeight: '700', marginBottom: '6px' }}>{titulo}</div>
      <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '16px', lineHeight: 1.5 }}>{descripcion}</div>
      <label style={S.label}>Código</label>
      <input
        style={{ ...S.inp, fontSize: '20px', fontFamily: 'monospace', letterSpacing: '4px', textTransform: 'uppercase', textAlign: 'center' }}
        placeholder="XXXX"
        maxLength={8}
        value={codigo}
        onChange={e => setCodigo(e.target.value.toUpperCase())}
        onKeyDown={e => e.key === 'Enter' && handleConfirm()}
      />
      {error && <div style={{ color: '#EF4444', fontSize: '12px', marginTop: '6px' }}>{error}</div>}
      <button onClick={handleConfirm} style={S.btn()} disabled={cargando}>
        {cargando ? 'Verificando...' : 'Confirmar código →'}
      </button>
    </div>
  )
}

// ─── PANEL SIN VIAJE ─────────────────────────────────────────────
function SinViaje({ conductor, historial, onLogout }) {
  return (
    <div style={{ padding: '20px' }}>
      {/* Bienvenida */}
      <div style={{ ...S.card, background: 'linear-gradient(135deg, #0E2B70, #0C1830)', border: '1px solid rgba(96,165,250,.2)' }}>
        <div style={{ fontSize: '28px', marginBottom: '10px' }}>👋</div>
        <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '4px' }}>
          Hola, {conductor.nombre}
        </div>
        <div style={{ fontSize: '13px', color: '#7A8FAD', marginBottom: '14px' }}>
          {conductor.empresa} · {conductor.categoriaLicencia}
        </div>
        <div style={{ ...S.tag('#7A8FAD'), fontSize: '12px' }}>
          📭 Sin viajes asignados por ahora
        </div>
      </div>

      {/* Alerta licencia */}
      {conductor.diasLicencia <= 60 && (
        <div style={{
          background: 'rgba(249,115,22,.1)',
          border: '1px solid rgba(249,115,22,.35)',
          borderRadius: '14px',
          padding: '16px',
          marginBottom: '14px',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
        }}>
          <div style={{ fontSize: '24px' }}>⚠️</div>
          <div>
            <div style={{ fontWeight: '700', fontSize: '14px', color: '#F97316' }}>
              Licencia vence en {conductor.diasLicencia} días
            </div>
            <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>
              Vence el {conductor.vencimientoLicencia}. Renuévala a tiempo.
            </div>
          </div>
        </div>
      )}

      {/* Historial */}
      <div style={{ fontSize: '13px', fontWeight: '700', color: '#7A8FAD', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
        Historial de viajes
      </div>

      {historial.length === 0 ? (
        <div style={{ ...S.card, textAlign: 'center', color: '#7A8FAD', fontSize: '14px', padding: '32px' }}>
          🚛 Aún no tienes viajes registrados
        </div>
      ) : (
        historial.map((v, i) => (
          <div key={i} style={S.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <div>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>{v.origen} → {v.destino}</div>
                <div style={{ fontSize: '12px', color: '#7A8FAD', marginTop: '2px' }}>{v.fecha}</div>
              </div>
              <span style={S.tag('#10B981')}>✅ Completado</span>
            </div>
            {v.horasExtraCargue > 0 && (
              <div style={{ fontSize: '12px', color: '#F97316' }}>
                +{v.horasExtraCargue}h extra cargue · {formatCOP(v.costoExtraCargue)}
              </div>
            )}
            {v.horasExtraDescargue > 0 && (
              <div style={{ fontSize: '12px', color: '#F97316' }}>
                +{v.horasExtraDescargue}h extra descargue · {formatCOP(v.costoExtraDescargue)}
              </div>
            )}
          </div>
        ))
      )}

      <button onClick={onLogout} style={{ ...S.btnOutline, marginTop: '24px' }}>
        Cerrar sesión
      </button>
    </div>
  )
}

// ─── PANEL CON VIAJE ─────────────────────────────────────────────
function ConViaje({ viaje, conductor, token, onViajeTerminado }) {
  const [fase, setFase] = useState('inicio') 
  // fases: inicio → cargue_codigo → cargue_cronometro → en_ruta → entrega_codigo → descargue_cronometro → terminado
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')
  const [resultadoCargue, setResultadoCargue] = useState(null)
  const [resultadoDescargue, setResultadoDescargue] = useState(null)

  async function verificarCodigo(codigo, tipo) {
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API}/viaje/verificar-codigo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ viajeId: viaje._id, codigo, tipo })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Código incorrecto'); setCargando(false); return }
      setCargando(false)
      if (tipo === 'recogida') setFase('cargue_cronometro')
      else setFase('descargue_cronometro')
    } catch {
      setError('Error de conexión')
      setCargando(false)
    }
  }

  async function finalizarCargue(resultado) {
    setResultadoCargue(resultado)
    // Registrar en backend
    try {
      await fetch(`${API}/viaje/registrar-cargue`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ viajeId: viaje._id, ...resultado })
      })
    } catch (e) { console.log(e) }
    setFase('en_ruta')
  }

  async function finalizarDescargue(resultado) {
    setResultadoDescargue(resultado)
    setCargando(true)
    try {
      await fetch(`${API}/viaje/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ viajeId: viaje._id, ...resultado })
      })
    } catch (e) { console.log(e) }
    setCargando(false)
    setFase('terminado')
  }

  function abrirMaps(dir) {
    const q = encodeURIComponent(dir)
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
  }

  function abrirWaze(dir) {
    const q = encodeURIComponent(dir)
    window.open(`https://waze.com/ul?q=${q}`, '_blank')
  }

  return (
    <div style={{ padding: '20px' }}>

      {/* ── FASE: INICIO ── */}
      {fase === 'inicio' && (
        <>
          {/* Notificación de viaje asignado */}
          <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(16,185,129,.15), rgba(6,14,28,.9))', border: '1px solid rgba(16,185,129,.3)', marginBottom: '16px' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>¡Tienes un viaje asignado!</div>
            <div style={{ fontSize: '14px', color: '#7A8FAD' }}>{viaje.origen} → {viaje.destino}</div>
          </div>

          {/* Info del viaje */}
          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: '#F97316' }}>📋 Detalles del viaje</div>
            {[
              ['Origen', viaje.origen],
              ['Destino', viaje.destino],
              ['Vehículo', viaje.vehiculo],
              ['Tipo de carga', viaje.tipoCarga],
              ['Empresa remitente', viaje.empresaRemitente],
              ['Fecha', viaje.fecha],
            ].map(([k, v]) => (
              <div key={k} style={{ ...S.row }}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>{k}</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Punto de recogida */}
          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>📍 Punto de recogida</div>
            <div style={{ fontSize: '14px', color: '#C8D4E3', marginBottom: '14px', lineHeight: 1.5 }}>
              {viaje.direccionRecogida}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => abrirMaps(viaje.direccionRecogida)} style={{ ...S.btn('#2563EB', false), width: '100%', marginTop: 0, fontSize: '13px' }}>
                🗺 Google Maps
              </button>
              <button onClick={() => abrirWaze(viaje.direccionRecogida)} style={{ ...S.btn('#00CAFF', false), width: '100%', marginTop: 0, fontSize: '13px', color: '#060E1C' }}>
                🚗 Waze
              </button>
            </div>
          </div>

          {/* Lista de cargas a recoger */}
          {viaje.cargas && viaje.cargas.length > 0 && (
            <div style={S.card}>
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '12px' }}>📦 Carga a recoger</div>
              {viaje.cargas.map((c, i) => (
                <div key={i} style={{ ...S.row, flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <div style={{ fontWeight: '600', fontSize: '13px' }}>{c.empresa}</div>
                  <div style={{ fontSize: '12px', color: '#7A8FAD' }}>{c.descripcion} · {c.peso} kg</div>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => setFase('cargue_codigo')} style={S.btn()}>
            Llegar al punto de recogida →
          </button>
        </>
      )}

      {/* ── FASE: CÓDIGO RECOGIDA ── */}
      {fase === 'cargue_codigo' && (
        <>
          <div style={{ ...S.card, textAlign: 'center', padding: '24px', marginBottom: '16px', background: 'rgba(37,99,235,.1)', border: '1px solid rgba(96,165,250,.25)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>🔑</div>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Código de recogida</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', lineHeight: 1.5 }}>
              El remitente tiene un código generado por CargoShare. Pídeselo e ingrésalo aquí para iniciar el cargue.
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: '#EF4444' }}>
              ❌ {error}
            </div>
          )}

          <InputCodigo
            titulo="Ingresa el código del remitente"
            descripcion="El remitente tiene este código en su panel de CargoShare. Al confirmarlo iniciará el cronómetro de cargue."
            onConfirm={(codigo) => verificarCodigo(codigo, 'recogida')}
            cargando={cargando}
          />
        </>
      )}

      {/* ── FASE: CRONÓMETRO CARGUE ── */}
      {fase === 'cargue_cronometro' && (
        <>
          <div style={{ ...S.card, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', marginBottom: '4px' }}>✅ Código verificado</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD' }}>Inicia el cronómetro cuando comience el cargue. Pausa cuando termines.</div>
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>⏱ Cronómetro de cargue</div>
            <Cronometro
              fase="cargue"
              tipoVehiculo={viaje.tipoVehiculo || 'camion_rigido'}
              onStop={finalizarCargue}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: '12px', padding: '14px', fontSize: '12px', color: '#7A8FAD', lineHeight: 1.6 }}>
            💡 <strong style={{ color: 'white' }}>Recuerda:</strong> Los primeros 45 minutos son gratis. Después se cobra por hora completa. El pago va 100% a la empresa transportista.
          </div>
        </>
      )}

      {/* ── FASE: EN RUTA ── */}
      {fase === 'en_ruta' && (
        <>
          {resultadoCargue && (
            <div style={{ ...S.card, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', marginBottom: '16px' }}>
              <div style={{ fontWeight: '700', color: '#10B981', marginBottom: '4px' }}>✅ Cargue completado</div>
              {resultadoCargue.horasExtra.horas > 0 ? (
                <div style={{ fontSize: '13px', color: '#7A8FAD' }}>
                  Horas extra: {resultadoCargue.horasExtra.horas}h · {formatCOP(resultadoCargue.horasExtra.costo)}
                </div>
              ) : (
                <div style={{ fontSize: '13px', color: '#7A8FAD' }}>Sin horas extra — cargue en tiempo estándar</div>
              )}
            </div>
          )}

          {/* En ruta */}
          <div style={{ ...S.card, background: 'linear-gradient(135deg, rgba(37,99,235,.15), rgba(6,14,28,.9))', border: '1px solid rgba(96,165,250,.25)' }}>
            <div style={{ fontSize: '24px', marginBottom: '8px' }}>🚛</div>
            <div style={{ fontWeight: '800', fontSize: '18px', marginBottom: '4px' }}>En ruta</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD' }}>{viaje.origen} → {viaje.destino}</div>
          </div>

          {/* Destino */}
          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '10px' }}>🏁 Punto de entrega</div>
            <div style={{ fontSize: '14px', color: '#C8D4E3', marginBottom: '14px', lineHeight: 1.5 }}>
              {viaje.direccionEntrega || viaje.destino}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button onClick={() => abrirMaps(viaje.direccionEntrega || viaje.destino)} style={{ ...S.btn('#2563EB', false), width: '100%', marginTop: 0, fontSize: '13px' }}>
                🗺 Google Maps
              </button>
              <button onClick={() => abrirWaze(viaje.direccionEntrega || viaje.destino)} style={{ ...S.btn('#00CAFF', false), width: '100%', marginTop: 0, fontSize: '13px', color: '#060E1C' }}>
                🚗 Waze
              </button>
            </div>
          </div>

          <button onClick={() => setFase('entrega_codigo')} style={S.btn('#10B981')}>
            Llegué al destino →
          </button>
        </>
      )}

      {/* ── FASE: CÓDIGO ENTREGA ── */}
      {fase === 'entrega_codigo' && (
        <>
          <div style={{ ...S.card, textAlign: 'center', padding: '24px', marginBottom: '16px', background: 'rgba(16,185,129,.1)', border: '1px solid rgba(16,185,129,.3)' }}>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>📬</div>
            <div style={{ fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Código de entrega</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD', lineHeight: 1.5 }}>
              El receptor tiene un código generado automáticamente. Pídeselo e ingrésalo para iniciar el descargue.
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '10px', padding: '12px', marginBottom: '12px', fontSize: '13px', color: '#EF4444' }}>
              ❌ {error}
            </div>
          )}

          <InputCodigo
            titulo="Ingresa el código del receptor"
            descripcion="El receptor tiene este código en su panel. Al confirmarlo iniciará el cronómetro de descargue."
            onConfirm={(codigo) => verificarCodigo(codigo, 'entrega')}
            cargando={cargando}
          />
        </>
      )}

      {/* ── FASE: CRONÓMETRO DESCARGUE ── */}
      {fase === 'descargue_cronometro' && (
        <>
          <div style={{ ...S.card, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', textAlign: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '13px', color: '#10B981', fontWeight: '700', marginBottom: '4px' }}>✅ Código de entrega verificado</div>
            <div style={{ fontSize: '13px', color: '#7A8FAD' }}>Inicia el cronómetro cuando comience el descargue. Presiona STOP cuando termines.</div>
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '16px', textAlign: 'center' }}>⏱ Cronómetro de descargue</div>
            <Cronometro
              fase="descargue"
              tipoVehiculo={viaje.tipoVehiculo || 'camion_rigido'}
              onStop={finalizarDescargue}
            />
          </div>

          <div style={{ background: 'rgba(255,255,255,.04)', borderRadius: '12px', padding: '14px', fontSize: '12px', color: '#7A8FAD', lineHeight: 1.6 }}>
            💡 Al presionar STOP el viaje quedará marcado como completado y se procesará el pago.
          </div>
        </>
      )}

      {/* ── FASE: TERMINADO ── */}
      {fase === 'terminado' && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎉</div>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>
            ¡Viaje completado!
          </div>
          <div style={{ fontSize: '14px', color: '#7A8FAD', marginBottom: '28px', lineHeight: 1.6 }}>
            {viaje.origen} → {viaje.destino}
          </div>

          {/* Resumen final */}
          <div style={{ ...S.card, textAlign: 'left' }}>
            <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '14px', color: '#10B981' }}>
              📊 Resumen del viaje
            </div>
            {resultadoCargue && (
              <div style={S.row}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>Tiempo de cargue</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{formatTime(resultadoCargue.segundos)}</span>
              </div>
            )}
            {resultadoCargue?.horasExtra?.horas > 0 && (
              <div style={S.row}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>Extra cargue</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#F97316' }}>{formatCOP(resultadoCargue.horasExtra.costo)}</span>
              </div>
            )}
            {resultadoDescargue && (
              <div style={S.row}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>Tiempo de descargue</span>
                <span style={{ fontSize: '13px', fontWeight: '600' }}>{formatTime(resultadoDescargue.segundos)}</span>
              </div>
            )}
            {resultadoDescargue?.horasExtra?.horas > 0 && (
              <div style={S.row}>
                <span style={{ fontSize: '13px', color: '#7A8FAD' }}>Extra descargue</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#F97316' }}>{formatCOP(resultadoDescargue.horasExtra.costo)}</span>
              </div>
            )}
            <div style={{ ...S.row, borderBottom: 'none', paddingTop: '14px' }}>
              <span style={{ fontWeight: '700', fontSize: '14px' }}>Total horas extra</span>
              <span style={{ fontWeight: '800', fontSize: '18px', color: '#F97316' }}>
                {formatCOP((resultadoCargue?.horasExtra?.costo || 0) + (resultadoDescargue?.horasExtra?.costo || 0))}
              </span>
            </div>
          </div>

          <div style={{ fontSize: '12px', color: '#7A8FAD', marginBottom: '24px', lineHeight: 1.6 }}>
            El pago total será procesado vía Wompi.<br />Las horas extra van 100% al transportista.
          </div>

          <button onClick={onViajeTerminado} style={S.btn()}>
            Volver al inicio →
          </button>
        </div>
      )}
    </div>
  )
}

// ─── COMPONENTE PRINCIPAL ────────────────────────────────────────
function Conductor() {
  const [estado, setEstado] = useState('loading') // loading | login | sin_viaje | con_viaje
  const [conductor, setConductor] = useState(null)
  const [viaje, setViaje] = useState(null)
  const [historial, setHistorial] = useState([])
  const [token, setToken] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  // Form login
  const [cedula, setCedula] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()

  useEffect(() => {
    const t = localStorage.getItem('conductor_token')
    if (t) {
      setToken(t)
      cargarPerfil(t)
    } else {
      setEstado('login')
    }
  }, [])

  async function cargarPerfil(t) {
    try {
      const res = await fetch(`${API}/conductor/perfil`, {
        headers: { 'Authorization': `Bearer ${t}` }
      })
      if (!res.ok) { localStorage.removeItem('conductor_token'); setEstado('login'); return }
      const data = await res.json()
      setConductor(data.conductor)
      setHistorial(data.historial || [])

      // Calcular días licencia
      const hoy = new Date()
      const venc = new Date(data.conductor.vencimientoLicencia)
      const dias = Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24))
      data.conductor.diasLicencia = dias
      data.conductor.vencimientoLicencia = venc.toLocaleDateString('es-CO')

      if (data.viajeActivo) {
        setViaje(data.viajeActivo)
        setEstado('con_viaje')
      } else {
        setEstado('sin_viaje')
      }
    } catch {
      setEstado('login')
    }
  }

  async function handleLogin() {
    if (!cedula || !password) { setError('Ingresa tu cédula y contraseña'); return }
    setCargando(true)
    setError('')
    try {
      const res = await fetch(`${API}/conductor/login-conductor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cedula, password }), // endpoint es /login-conductor
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Credenciales incorrectas')
        setCargando(false)
        return
      }
      localStorage.setItem('conductor_token', data.token)
      setToken(data.token)
      await cargarPerfil(data.token)
      setCargando(false)
    } catch {
      setError('Error de conexión')
      setCargando(false)
    }
  }

  function handleLogout() {
    localStorage.removeItem('conductor_token')
    setEstado('login')
    setConductor(null)
    setViaje(null)
    setToken(null)
  }

  // ── PANTALLA: LOGIN ──
  if (estado === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: 'DM Sans, sans-serif' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: '800', color: 'white' }}>
              Cargo<span style={{ color: '#F97316' }}>Share</span>
            </div>
            <div style={{ fontSize: '14px', color: '#7A8FAD', marginTop: '4px' }}>Panel del Conductor</div>
          </div>

          <div style={{ background: '#0C1B35', border: '1px solid rgba(255,255,255,.1)', borderRadius: '22px', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🚛</div>
              <div style={{ fontSize: '18px', fontWeight: '700' }}>Acceso conductor</div>
              <div style={{ fontSize: '13px', color: '#7A8FAD', marginTop: '4px' }}>Ingresa con tu cédula</div>
            </div>

            <div style={{ marginBottom: '14px' }}>
              <label style={S.label}>Número de cédula</label>
              <input
                style={S.inp}
                type="number"
                placeholder="1234567890"
                value={cedula}
                onChange={e => setCedula(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={S.label}>Contraseña</label>
              <input
                style={S.inp}
                type="password"
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>

            {error && (
              <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: '9px', padding: '11px', fontSize: '13px', color: '#EF4444', marginBottom: '14px' }}>
                {error}
              </div>
            )}

            <button onClick={handleLogin} disabled={cargando} style={S.btn()}>
              {cargando ? 'Iniciando sesión...' : 'Entrar →'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: '#7A8FAD', lineHeight: 1.6 }}>
              ¿No tienes cuenta? Tu empresa debe registrarte primero en CargoShare.
            </div>

            <button onClick={() => navigate('/login')} style={{ ...S.btnOutline, marginTop: '12px', fontSize: '13px' }}>
              ← Volver al login empresarial
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── PANTALLA: CARGANDO ──
  if (estado === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: '#060E1C', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A8FAD' }}>
        Cargando...
      </div>
    )
  }

  // ── NAVBAR ──
  return (
    <div style={S.page}>
      <div style={S.nav}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: '800' }}>
          Cargo<span style={{ color: '#F97316' }}>Share</span>
          <span style={{ fontSize: '11px', color: '#7A8FAD', fontWeight: '400', marginLeft: '8px' }}>Conductor</span>
        </div>
        {conductor && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {conductor.diasLicencia <= 60 && (
              <span style={{ fontSize: '18px' }} title="Licencia próxima a vencer">⚠️</span>
            )}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(249,115,22,.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: '700', color: '#F97316' }}>
              {conductor.nombre?.[0]?.toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* Estado badge */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: estado === 'con_viaje' ? '#10B981' : '#7A8FAD', display: 'inline-block' }}></span>
          <span style={{ fontSize: '12px', color: '#7A8FAD' }}>
            {estado === 'con_viaje' ? 'Viaje activo' : 'Sin viaje activo'}
          </span>
        </div>
      </div>

      {/* Contenido principal */}
      {estado === 'sin_viaje' && conductor && (
        <SinViaje conductor={conductor} historial={historial} onLogout={handleLogout} />
      )}

      {estado === 'con_viaje' && viaje && conductor && (
        <ConViaje
          viaje={viaje}
          conductor={conductor}
          token={token}
          onViajeTerminado={() => {
            setViaje(null)
            setEstado('sin_viaje')
            cargarPerfil(token)
          }}
        />
      )}
    </div>
  )
}

export default Conductor