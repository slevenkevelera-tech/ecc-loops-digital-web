import { useRef, useState } from 'react'

const FOLDERS = [
  {
    id: 'reels',
    kicker: '01',
    title: 'Laboratorio de video',
    subtitle: 'Reels, Shorts e clipes',
    copy: 'Agentes roteirizam, cortam e publicam videos curtos nas redes com loop autonomo.',
    agent: 'marketing-agent',
    mission: 'Criar e publicar videos diarios',
    tone: 'a',
  },
  {
    id: 'ads',
    kicker: '02',
    title: 'Trafego pago',
    subtitle: 'Campanhas em escala',
    copy: 'O nucleo testa copys, desloca budget e otimiza ROAS sem operacao manual.',
    agent: 'marketing-agent',
    mission: 'Escalar anuncios e conversao',
    tone: 'b',
  },
  {
    id: 'sales',
    kicker: '03',
    title: 'Vendas',
    subtitle: 'Funil e fechamento',
    copy: 'Do lead ao checkout. Agentes triam, nutrem e empurram a venda com acompanhamento.',
    agent: 'chief-of-staff',
    mission: 'Acelerar pipeline de vendas',
    tone: 'c',
  },
  {
    id: 'reach',
    kicker: '04',
    title: 'Visualizacoes',
    subtitle: 'Alcance e autoridade',
    copy: 'SEO, calendario e distribuicao. Cada peca nasce para ser vista e compartilhada.',
    agent: 'seo-specialist',
    mission: 'Multiplicar views organicas',
    tone: 'd',
  },
  {
    id: 'evolve',
    kicker: '05',
    title: 'Evolucao',
    subtitle: 'Sugira qualquer ato',
    copy: 'Descreva o proximo passo. Os agentes planejam, testam e implementam a nova versao.',
    agent: 'loop-operator',
    mission: 'Evoluir o produto em loop',
    tone: 'e',
  },
]

export default function CardStack({ onDispatch }) {
  const [front, setFront] = useState(2)
  const [fan, setFan] = useState(false)
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const stageRef = useRef(null)

  function onMove(event) {
    const el = stageRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const px = (event.clientX - r.left) / r.width - 0.5
    const py = (event.clientY - r.top) / r.height - 0.5
    setTilt({ x: py * -14, y: px * 18 })
  }

  function onLeave() {
    setTilt({ x: 0, y: 0 })
    setFan(false)
  }

  const current = FOLDERS[front]

  return (
    <section className="stack-section">
      <div className="stack-copy">
        <p className="ai-kicker">NUCLEO  /  OPERACAO AUTONOMA</p>
        <h2>IA que trabalha enquanto voce fecha negocio.</h2>
        <p className="lead">
          Automacao de verdade: agentes executam o dia a dia, disparam campanhas e
          entregam clientes ja qualificados. Clique na pasta. O loop comeca.
        </p>
        <div className="stack-meta">
          <span>{current.kicker}</span>
          <strong>{current.title}</strong>
          <em>{current.agent}</em>
        </div>
        <p className="stack-detail">{current.copy}</p>
        <button
          type="button"
          className="primary"
          onClick={() => onDispatch?.(current)}
        >
          Disparar agente
        </button>
      </div>
      <div
        className={`stack-stage ${fan ? 'fan' : ''}`}
        ref={stageRef}
        onMouseMove={onMove}
        onMouseEnter={() => setFan(true)}
        onMouseLeave={onLeave}
      >
        <div
          className="stack-world"
          style={{ transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)` }}
        >
          {FOLDERS.map((folder, index) => {
            const offset = index - front
            return (
              <button
                key={folder.id}
                type="button"
                className={`folder tone-${folder.tone} ${index === front ? 'front' : ''}`}
                style={{ '--i': offset, zIndex: 10 - Math.abs(offset) }}
                onClick={() => setFront(index)}
              >
                <span className="folder-tab">{folder.kicker}</span>
                <span className="folder-body">
                  <b>{folder.title}</b>
                  <small>{folder.subtitle}</small>
                  <i>{folder.mission}</i>
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
