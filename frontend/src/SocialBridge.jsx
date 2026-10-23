import { useEffect, useState } from 'react'
import {
  IconFacebook,
  IconGitHub,
  IconInstagram,
  IconLinkedIn,
  IconTelegram,
  IconThreads,
  IconTikTok,
  IconWhatsApp,
  IconX,
  IconYouTube,
} from './icons.jsx'

export const SOCIALS = [
  {
    id: 'instagram',
    name: 'Instagram',
    Icon: IconInstagram,
    agentSource: 'marketing-agent',
    goal: 'Reels, stories e vendas pelo Direct',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    Icon: IconYouTube,
    agentSource: 'marketing-agent',
    goal: 'Shorts, autoridade e visualizacoes',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    Icon: IconTikTok,
    agentSource: 'marketing-agent',
    goal: 'Clipes virais e trafego pago',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    Icon: IconLinkedIn,
    agentSource: 'seo-specialist',
    goal: 'Autoridade B2B e captura de clientes',
  },
  {
    id: 'x',
    name: 'X',
    Icon: IconX,
    agentSource: 'marketing-agent',
    goal: 'Conversas, alcance e autoridade',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    Icon: IconFacebook,
    agentSource: 'marketing-agent',
    goal: 'Anuncios, grupos e remarketing',
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    Icon: IconWhatsApp,
    agentSource: 'chief-of-staff',
    goal: 'Fechamento e atendimento',
  },
  {
    id: 'threads',
    name: 'Threads',
    Icon: IconThreads,
    agentSource: 'marketing-agent',
    goal: 'Distribuicao e comunidade',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    Icon: IconTelegram,
    agentSource: 'chief-of-staff',
    goal: 'Canal, drops e funil',
  },
  {
    id: 'github',
    name: 'GitHub',
    Icon: IconGitHub,
    agentSource: 'loop-operator',
    goal: 'Prova tecnica e construcao aberta',
  },
]

const STORE_KEY = 'ecc-social-links'

function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '{}')
  } catch {
    return {}
  }
}

export default function SocialBridge({ agents, busy, onBoost, compact }) {
  const [links, setLinks] = useState(loadLinks)
  const [draft, setDraft] = useState('')
  const [open, setOpen] = useState(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(links))
    } catch {
      /* ignore */
    }
  }, [links])

  function saveLink(id) {
    const value = draft.trim()
    setLinks((prev) => ({ ...prev, [id]: value }))
    setOpen(null)
    setDraft('')
  }

  function agentFor(sourceId) {
    return agents.find((item) => item.sourceId === sourceId) || agents[0]
  }

  if (compact) {
    return (
      <div className="social-dock">
        {SOCIALS.map((item) => {
          const href = links[item.id]
          const Icon = item.Icon
          const className = `dock-icon ${href ? 'live' : 'wait'}`
          const title = href ? item.name : `${item.name} — cole o link depois`
          if (!href) {
            return (
              <span key={item.id} className={className} title={title} aria-label={item.name}>
                <Icon />
              </span>
            )
          }
          return (
            <a
              key={item.id}
              className={className}
              href={href}
              target="_blank"
              rel="noreferrer"
              title={title}
              aria-label={item.name}
            >
              <Icon />
            </a>
          )
        })}
      </div>
    )
  }

  return (
    <section className="social-bridge">
      <div className="social-intro">
        <p className="ai-kicker">REDE  /  AGENTES DE CRESCIMENTO</p>
        <h2>Redes sociais ligadas ao enxame.</h2>
        <p className="lead">
          Insira os links quando quiser. Cada icone ja nasce com um agente de I.A. pronto para
          impulsionar vendas e visualizacoes.
        </p>
      </div>
      <div className="social-grid">
        {SOCIALS.map((item) => {
          const href = links[item.id]
          const Icon = item.Icon
          const agent = agentFor(item.agentSource)
          const editing = open === item.id
          return (
            <article key={item.id} className={`social-card ${href ? 'linked' : ''}`}>
              <div className="social-head">
                <span className="social-glyph"><Icon /></span>
                <div>
                  <h3>{item.name}</h3>
                  <p>{item.goal}</p>
                </div>
              </div>
              <div className="status">{agent ? agent.name : item.agentSource}</div>
              {href ? (
                <a className="social-url" href={href} target="_blank" rel="noreferrer">{href}</a>
              ) : (
                <p className="muted">Link pendente — cole quando tiver.</p>
              )}
              {editing ? (
                <form
                  className="form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveLink(item.id)
                  }}
                >
                  <input
                    autoFocus
                    placeholder="https://"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                  />
                  <div className="row">
                    <button className="primary" type="submit">Guardar</button>
                    <button className="ghost" type="button" onClick={() => setOpen(null)}>Cancelar</button>
                  </div>
                </form>
              ) : (
                <div className="row">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setOpen(item.id)
                      setDraft(href || '')
                    }}
                  >
                    {href ? 'Editar link' : 'Inserir link'}
                  </button>
                  <button
                    className="primary"
                    type="button"
                    disabled={busy || !agent}
                    onClick={() => onBoost(item, agent, href)}
                  >
                    Impulsionar
                  </button>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
