import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// ── SPLASH SCREEN — solo una vez por sesion ───────────────────────
const yaVioSplash = sessionStorage.getItem('cs-splash-done')
if (!yaVioSplash) sessionStorage.setItem('cs-splash-done', '1')

const splash = yaVioSplash ? null : document.createElement('div')
if (splash) {
splash.id = 'cs-splash'
splash.innerHTML = `
  <style>
    #cs-splash {
      position: fixed;
      inset: 0;
      background: #060E1C;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 9999;
      transition: opacity 0.5s ease, transform 0.5s ease;
      padding-top: env(safe-area-inset-top, 0px);
    }
    #cs-splash.fade {
      opacity: 0;
      transform: scale(1.04);
      pointer-events: none;
    }
    .splash-logo {
      font-family: Georgia, serif;
      font-size: 52px;
      font-weight: 700;
      color: white;
      margin-bottom: 4px;
      animation: splashIn 0.6s ease forwards;
      opacity: 0;
    }
    .splash-logo span { color: #F97316; }
    .splash-line {
      width: 80px;
      height: 2px;
      background: rgba(249,115,22,0.25);
      margin: 8px auto 32px;
      animation: splashIn 0.6s ease 0.1s forwards;
      opacity: 0;
    }
    .splash-spinner-wrap {
      position: relative;
      width: 56px;
      height: 56px;
      animation: splashIn 0.6s ease 0.2s forwards;
      opacity: 0;
    }
    /* aro exterior girando */
    .splash-ring {
      position: absolute;
      inset: 0;
      border-radius: 50%;
      border: 3px solid rgba(249,115,22,0.12);
      border-top-color: #F97316;
      border-right-color: rgba(249,115,22,0.4);
      animation: spin 0.9s linear infinite;
    }
    /* llanta — circulo central */
    .splash-wheel {
      position: absolute;
      inset: 10px;
      border-radius: 50%;
      background: #0E1E38;
      border: 2px solid rgba(249,115,22,0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.5s ease;
    }
    /* rayos de la llanta */
    .splash-wheel::before {
      content: '';
      position: absolute;
      width: 2px;
      height: 70%;
      background: rgba(249,115,22,0.4);
      border-radius: 1px;
      box-shadow: 10px 0 0 rgba(249,115,22,0.4), -10px 0 0 rgba(249,115,22,0.4);
    }
    .splash-wheel::after {
      content: '';
      position: absolute;
      width: 70%;
      height: 2px;
      background: rgba(249,115,22,0.4);
      border-radius: 1px;
      box-shadow: 0 8px 0 rgba(249,115,22,0.3), 0 -8px 0 rgba(249,115,22,0.3);
    }
    /* hub central */
    .splash-hub {
      position: absolute;
      width: 8px;
      height: 8px;
      background: #F97316;
      border-radius: 50%;
      z-index: 1;
    }
    /* estado ready — llanta completa */
    .splash-spinner-wrap.ready .splash-ring {
      border-color: #F97316;
      border-top-color: #F97316;
      animation: spin 0.4s linear infinite;
    }
    .splash-spinner-wrap.ready .splash-wheel {
      border-color: #F97316;
      background: rgba(249,115,22,0.08);
    }
    .splash-spinner-wrap.ready .splash-hub {
      box-shadow: 0 0 8px rgba(249,115,22,0.6);
    }
    @keyframes splashIn {
      to { opacity: 1; transform: translateY(0); }
      from { opacity: 0; transform: translateY(12px); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <div class="splash-logo">cargo<span>share</span></div>
  <div class="splash-line"></div>
  <div class="splash-spinner-wrap" id="splashWheel">
        <div class="splash-ring"></div>
        <div class="splash-wheel"></div>
        <div class="splash-hub"></div>
      </div>
`
document.body.appendChild(splash)
}

function removeSplash() {
  if (!splash) return
  // Animar llanta antes de desaparecer
  const wheel = splash.querySelector('#splashWheel')
  if (wheel) {
    wheel.classList.add('ready')
    setTimeout(() => {
      splash.classList.add('fade')
      setTimeout(() => splash.remove(), 520)
    }, 400)
  } else {
    splash.classList.add('fade')
    setTimeout(() => splash.remove(), 520)
  }
}

// Solo esperar si hay splash
const splashStart = Date.now()
const MIN_SPLASH = splash ? 1200 : 0

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App onReady={() => {
      const elapsed = Date.now() - splashStart
      const delay = Math.max(0, MIN_SPLASH - elapsed)
      setTimeout(removeSplash, delay)
    }} />
  </StrictMode>,
)