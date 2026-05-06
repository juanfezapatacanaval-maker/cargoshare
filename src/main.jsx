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
    .splash-spinner {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: 3px solid rgba(249,115,22,0.15);
      border-top-color: #F97316;
      animation: splashIn 0.6s ease 0.2s forwards, spin 0.8s linear infinite;
      opacity: 0;
    }
    @keyframes splashIn {
      to { opacity: 1; transform: translateY(0); }
      from { opacity: 0; transform: translateY(12px); }
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
  <div class="splash-logo">cargo<span>share</span></div>
  <div class="splash-line"></div>
  <div class="splash-spinner"></div>
`
document.body.appendChild(splash)
}

function removeSplash() {
  if (!splash) return
  splash.classList.add('fade')
  setTimeout(() => splash.remove(), 520)
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