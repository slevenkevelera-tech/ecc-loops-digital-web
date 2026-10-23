import { useEffect, useRef, useState } from 'react'
import Footer from './Footer.jsx'

const SLIDES = [
  {
    id: 'studio',
    tag: '01  LABORATORIO DE VIDEO',
    title: 'Agentes criam videos',
    text: 'Os agentes entram no site, roteirizam cenas, renderizam clipes e publicam videos curtos em loop autonomo.',
  },
  {
    id: 'traffic',
    tag: '02  NUCLEO DE CRESCIMENTO',
    title: 'Conteudo e trafego pago',
    text: 'O enxame gera pecas, testa copys e dispara campanhas de trafego pago sem operacao manual.',
  },
  {
    id: 'evolve',
    tag: '03  EVOLUCAO',
    title: 'Sugira qualquer ato',
    text: 'Descreva qualquer evolucao. Os agentes interpretam, planejam e implementam a proxima versao do site.',
  },
]

function StudioScene() {
  return (
    <div className="scene scene-studio">
      <div className="preview-screen">
        <div className="scanline" />
        <div className="orb o1" />
        <div className="orb o2" />
        <div className="orb o3" />
        <div className="hud-label">AGENTE  /  RENDERIZACAO  4K</div>
      </div>
      <div className="timeline">
        <span /><span /><span /><span /><span /><span />
      </div>
      <div className="agent-row">
        <i className="node" />
        <i className="node" />
        <i className="node" />
        <b>3 agentes no estudio</b>
      </div>
    </div>
  )
}

function TrafficScene() {
  return (
    <div className="scene scene-traffic">
      <div className="metric-grid">
        <div className="metric"><em>RETORNO</em><b>4.8x</b></div>
        <div className="metric"><em>ALCANCE</em><b>1.2M</b></div>
        <div className="metric"><em>CUSTO</em><b>0.18</b></div>
      </div>
      <div className="campaign-stream">
        <div className="ad-card">Reels  /  corte automatico</div>
        <div className="ad-card">Texto  /  teste A-B</div>
        <div className="ad-card">Anuncios  /  verba</div>
      </div>
      <div className="pulse-ring" />
    </div>
  )
}

function EvolveScene() {
  return (
    <div className="scene scene-evolve">
      <div className="prompt-bar">
        <span className="cursor-line">sugerir: evoluir checkout + novo agente de SEO</span>
      </div>
      <div className="module-grid">
        <div className="mod">UI</div>
        <div className="mod">API</div>
        <div className="mod">SEO</div>
        <div className="mod">ADS</div>
        <div className="mod">CMS</div>
        <div className="mod">+NEW</div>
      </div>
      <div className="evolve-status">ciclo  planejar · testar · publicar · lembrar</div>
    </div>
  )
}

export default function Login({ onAccess }) {
  const [slide, setSlide] = useState(0)
  const [identity, setIdentity] = useState('')
  const [key, setKey] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setSlide((n) => (n + 1) % SLIDES.length), 8000)
    return () => clearInterval(id)
  }, [slide])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf
    const nodes = Array.from({ length: 42 }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00035,
      vy: (Math.random() - 0.5) * 0.00035,
    }))

    function resize() {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    function draw() {
      const { width, height } = canvas
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(90, 220, 255, 0.85)'
      nodes.forEach((n) => {
        n.x += n.vx
        n.y += n.vy
        if (n.x < 0 || n.x > 1) n.vx *= -1
        if (n.y < 0 || n.y > 1) n.vy *= -1
      })
      for (let i = 0; i < nodes.length; i += 1) {
        for (let j = i + 1; j < nodes.length; j += 1) {
          const a = nodes[i]
          const b = nodes[j]
          const dx = (a.x - b.x) * width
          const dy = (a.y - b.y) * height
          const dist = Math.hypot(dx, dy)
          if (dist < 160) {
            ctx.strokeStyle = `rgba(90, 220, 255, ${0.12 * (1 - dist / 160)})`
            ctx.beginPath()
            ctx.moveTo(a.x * width, a.y * height)
            ctx.lineTo(b.x * width, b.y * height)
            ctx.stroke()
          }
        }
      }
      nodes.forEach((n) => {
        ctx.beginPath()
        ctx.arc(n.x * width, n.y * height, 1.6, 0, Math.PI * 2)
        ctx.fill()
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  function submit(event) {
    event.preventDefault()
    setError('')
    if (!identity.trim() || identity.trim().length < 3) {
      setError('Informe sua identidade de acesso.')
      return
    }
    if (key.trim().length < 4) {
      setError('A chave neural precisa ter pelo menos 4 caracteres.')
      return
    }
    setBusy(true)
    setTimeout(() => {
      setBusy(false)
      onAccess()
    }, 700)
  }

  const current = SLIDES[slide]

  return (
    <div className="login-page">
      <canvas ref={canvasRef} className="neural-canvas" />
      <div className="login-glow g1" />
      <div className="login-glow g2" />
      <div className="login-core">
        <section className="login-showcase">
          <p className="ai-kicker">ECC LOOPS  /  NUCLEO AUTONOMO</p>
          <h1>Inteligencia que opera o site.</h1>
          <p className="lead">
            Agentes criam videos, conteudos e trafego pago. Voce sugere qualquer ato.
            O sistema evolui.
          </p>
          <div className="video-carousel">
            <div className="video-player">
              <div className="video-chrome">
                <span className="rec-dot" />
                <span>TRANSMISSAO NEURAL</span>
                <span className="timecode">00:08</span>
              </div>
              {current.id === 'studio' && <StudioScene />}
              {current.id === 'traffic' && <TrafficScene />}
              {current.id === 'evolve' && <EvolveScene />}
              <div className="video-progress"><i key={slide} /></div>
            </div>
            <div className="slide-copy">
              <span className="slide-tag">{current.tag}</span>
              <h2>{current.title}</h2>
              <p>{current.text}</p>
            </div>
            <div className="carousel-nav">
              {SLIDES.map((item, index) => (
                <button
                  key={item.id}
                  type="button"
                  className={index === slide ? 'on' : ''}
                  onClick={() => setSlide(index)}
                  aria-label={item.title}
                />
              ))}
            </div>
          </div>
        </section>
        <section className="login-card">
          <div className="card-scan" />
          <p className="ai-kicker">PORTAO DE ACESSO</p>
          <h2>Login neural</h2>
          <p className="muted">Autentique-se para liberar a mesa de agentes ECC.</p>
          <form className="form login-form" onSubmit={submit}>
            <label>
              Identidade
              <input
                autoComplete="username"
                placeholder="nome ou e-mail"
                value={identity}
                onChange={(e) => setIdentity(e.target.value)}
              />
            </label>
            <label>
              Chave de acesso
              <input
                type="password"
                autoComplete="current-password"
                placeholder="chave neural"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button className="primary access-btn" disabled={busy}>
              {busy ? 'Sincronizando...' : 'Entrar no nucleo'}
            </button>
          </form>
        </section>
      </div>
      <Footer />
    </div>
  )
}
