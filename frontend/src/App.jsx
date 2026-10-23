import { useEffect, useMemo, useState } from 'react'
import Login from './Login.jsx'
import Footer from './Footer.jsx'
import CardStack from './CardStack.jsx'
import SocialBridge from './SocialBridge.jsx'
import Portfolio from './Portfolio.jsx'

const TABS = [
  { id: 'mesa', label: 'Mesa' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'redes', label: 'Redes' },
  { id: 'agentes', label: 'Agentes' },
  { id: 'tarefas', label: 'Tarefas' },
  { id: 'tokens', label: 'Tokens' },
  { id: 'skills', label: 'Skills' },
  { id: 'catalogo', label: 'Catalogo ECC' },
]

async function api(path, options) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Falha na API')
  return data
}

function Chip({ children, on, onClick }) {
  return (
    <button type="button" className={`chip ${on ? 'on' : ''}`} onClick={onClick}>
      {children}
    </button>
  )
}

export default function App() {
  const [authed, setAuthed] = useState(() => {
    try {
      return sessionStorage.getItem('ecc-access') === '1'
    } catch {
      return false
    }
  })
  const [tab, setTab] = useState('mesa')
  const [stats, setStats] = useState(null)
  const [catalog, setCatalog] = useState({ skills: [], agents: [], categories: [] })
  const [agents, setAgents] = useState([])
  const [tasks, setTasks] = useState([])
  const [runs, setRuns] = useState([])
  const [tokens, setTokens] = useState([])
  const [freshToken, setFreshToken] = useState(null)
  const [copied, setCopied] = useState('')
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('todas')
  const [busy, setBusy] = useState(false)

  const [agentForm, setAgentForm] = useState({
    name: '',
    role: '',
    sourceId: 'planner',
    skills: [],
  })
  const [taskForm, setTaskForm] = useState({
    title: '',
    brief: '',
    agentId: '',
    priority: 'media',
  })
  const [tokenForm, setTokenForm] = useState({
    name: '',
    origins: '',
  })

  async function refresh() {
    const [s, c, a, t, r, k] = await Promise.all([
      api('/api/stats'),
      api('/api/catalog'),
      api('/api/agents'),
      api('/api/tasks'),
      api('/api/runs'),
      api('/api/tokens'),
    ])
    setStats(s)
    setCatalog(c)
    setAgents(a)
    setTasks(t)
    setRuns(r)
    setTokens(k)
    setTaskForm((prev) => ({ ...prev, agentId: prev.agentId || a[0]?.id || '' }))
  }

  useEffect(() => {
    refresh().catch((err) => setError(err.message))
  }, [])

  const filteredSkills = useMemo(() => {
    const q = query.toLowerCase()
    return catalog.skills.filter((skill) => {
      const hit = `${skill.name} ${skill.description} ${skill.category}`.toLowerCase().includes(q)
      const cat = category === 'todas' || skill.category === category
      return hit && cat
    })
  }, [catalog.skills, query, category])

  const filteredBuiltin = useMemo(() => {
    const q = query.toLowerCase()
    return catalog.agents.filter((agent) =>
      `${agent.name} ${agent.description} ${agent.category}`.toLowerCase().includes(q)
    )
  }, [catalog.agents, query])

  async function suggestFromBrief(brief) {
    if (!brief.trim()) return
    const suggestion = await api('/api/agents/suggest', {
      method: 'POST',
      body: JSON.stringify({ brief }),
    })
    setAgentForm((prev) => ({
      ...prev,
      name: prev.name || suggestion.suggestedName,
      role: prev.role || suggestion.role,
      sourceId: suggestion.sourceId,
      skills: suggestion.skills,
    }))
  }

  async function createAgent(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/agents', {
        method: 'POST',
        body: JSON.stringify(agentForm),
      })
      setAgentForm({ name: '', role: '', sourceId: agentForm.sourceId, skills: [] })
      await refresh()
      setTab('agentes')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function createTask(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskForm),
      })
      setTaskForm((prev) => ({ ...prev, title: '', brief: '' }))
      await refresh()
      setTab('tarefas')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function runTask(id) {
    setBusy(true)
    setError('')
    try {
      await api(`/api/tasks/${id}/run`, { method: 'POST' })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function createToken(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const created = await api('/api/tokens', {
        method: 'POST',
        body: JSON.stringify({
          name: tokenForm.name || 'site-externo',
          origins: tokenForm.origins,
        }),
      })
      setFreshToken(created)
      setTokenForm({ name: '', origins: '' })
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function dispatchFolder(folder) {
    const agent = agents.find((item) => item.sourceId === folder.agent) || agents[0]
    if (!agent) {
      setError('Crie um agente antes de disparar a pasta.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: folder.mission,
          brief: folder.copy,
          agentId: agent.id,
          priority: 'alta',
        }),
      })
      await refresh()
      setTab('tarefas')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function boostSocial(social, agent, href) {
    if (!agent) {
      setError('Nenhum agente disponivel para impulsionar esta rede.')
      return
    }
    setBusy(true)
    setError('')
    try {
      await api('/api/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title: `Impulsionar ${social.name}`,
          brief: `Escalar vendas e visualizacoes em ${social.name}. Objetivo: ${social.goal}. Perfil: ${href || 'link pendente — agente opera mesmo assim'}.`,
          agentId: agent.id,
          priority: 'alta',
        }),
      })
      await refresh()
      setTab('tarefas')
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function revokeToken(id) {
    setBusy(true)
    setError('')
    try {
      await api(`/api/tokens/${id}`, { method: 'DELETE' })
      if (freshToken?.id === id) setFreshToken(null)
      await refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function apiBase() {
    if (typeof window === 'undefined') return 'https://ecc-loops-digital-web.onrender.com'
    return window.location.origin
  }

  function snippetFetch(tokenValue) {
    const host = apiBase()
    return `curl -X POST ${host}/api/v1/agents \\
  -H "Authorization: Bearer ${tokenValue}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"Atendente","role":"Triar leads e responder clientes"}'`
  }

  function snippetJs(tokenValue) {
    const host = apiBase()
    return `const res = await fetch("${host}/api/v1/agents", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer ${tokenValue}"
  },
  body: JSON.stringify({
    name: "Atendente",
    role: "Triar leads e responder clientes"
  })
})
const agent = await res.json()`
  }

  function snippetEmbed(tokenValue) {
    const host = apiBase()
    return `<script src="${host}/embed.js"
  data-token="${tokenValue}"
  data-title="Criar agente ECC"></script>`
  }

  async function copyText(value, key) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      setTimeout(() => setCopied(''), 1600)
    } catch {
      setError('Nao foi possivel copiar')
    }
  }

  function toggleSkill(id) {
    setAgentForm((prev) => {
      const has = prev.skills.includes(id)
      const skills = has ? prev.skills.filter((s) => s !== id) : [...prev.skills, id].slice(0, 12)
      return { ...prev, skills }
    })
  }

  if (!authed) {
    return (
      <Login
        onAccess={() => {
          try {
            sessionStorage.setItem('ecc-access', '1')
          } catch {
            /* ignore */
          }
          setAuthed(true)
        }}
      />
    )
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <p className="ai-kicker">ECC LOOPS  /  ESTUDIO AUTONOMO</p>
          <h1>Inteligencia em movimento.</h1>
          <p>
            Mesa operacional para criar agentes, ligar as 311 skills do ECC e despachar
            tarefas diarias no loop plan, test, implement, review, verify, remember.
          </p>
        </div>
        {stats && (
          <div className="stats">
            <div className="stat"><b>{stats.skills}</b><span>skills ECC</span></div>
            <div className="stat"><b>{stats.builtinAgents}</b><span>agentes base</span></div>
            <div className="stat"><b>{stats.customAgents}</b><span>agentes ativos</span></div>
            <div className="stat"><b>{stats.tokens ?? tokens.filter((item) => !item.revokedAt).length}</b><span>tokens</span></div>
          </div>
        )}
      </header>

      <nav className="tabs">
        {TABS.map((item) => (
          <button
            key={item.id}
            className={tab === item.id ? 'active' : ''}
            onClick={() => setTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {error && <p className="muted">{error}</p>}

      {tab === 'mesa' && (
        <>
        <CardStack onDispatch={dispatchFolder} />
        <div className="grid">
          <section className="card">
            <h2>Novo agente</h2>
            <form className="form" onSubmit={createAgent}>
              <input
                placeholder="Nome do agente"
                value={agentForm.name}
                onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
              />
              <textarea
                placeholder="Papel diario. Ex.: triar e-mails, pesquisar concorrentes, revisar PRs"
                value={agentForm.role}
                onChange={(e) => setAgentForm({ ...agentForm, role: e.target.value })}
                onBlur={() => suggestFromBrief(agentForm.role)}
              />
              <select
                value={agentForm.sourceId}
                onChange={(e) => setAgentForm({ ...agentForm, sourceId: e.target.value })}
              >
                {catalog.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <div className="chips">
                {agentForm.skills.map((id) => (
                  <Chip key={id} on onClick={() => toggleSkill(id)}>{id}</Chip>
                ))}
              </div>
              <div className="row">
                <button className="ghost" type="button" onClick={() => suggestFromBrief(agentForm.role || agentForm.name)}>
                  Sugerir skills
                </button>
                <button className="primary" disabled={busy}>Criar agente</button>
              </div>
            </form>
          </section>

          <section className="card">
            <h2>Despachar tarefa</h2>
            <form className="form" onSubmit={createTask}>
              <input
                placeholder="Titulo da tarefa"
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
              />
              <textarea
                placeholder="Briefing. O agente usa as skills ligadas para montar o playbook."
                value={taskForm.brief}
                onChange={(e) => setTaskForm({ ...taskForm, brief: e.target.value })}
              />
              <select
                value={taskForm.agentId}
                onChange={(e) => setTaskForm({ ...taskForm, agentId: e.target.value })}
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>{agent.name}</option>
                ))}
              </select>
              <select
                value={taskForm.priority}
                onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
              >
                <option value="baixa">baixa</option>
                <option value="media">media</option>
                <option value="alta">alta</option>
                <option value="urgente">urgente</option>
              </select>
              <button className="primary" disabled={busy || !agents.length}>Enfileirar</button>
            </form>
            <div className="playbook">
              {runs.slice(0, 3).map((run) => (
                <div key={run.id} className="item">
                  <div className="status">{run.id}</div>
                  <p>{run.result?.summary}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
        </>
      )}

      {tab === 'portfolio' && <Portfolio />}

      {tab === 'redes' && (
        <SocialBridge agents={agents} busy={busy} onBoost={boostSocial} />
      )}

      {tab === 'tokens' && (
        <div className="grid">
          <section className="card">
            <h2>Gerar token para outros sites</h2>
            <p className="muted">Use o token nos seus sites para criar agentes via API. O valor aparece so uma vez.</p>
            <form className="form" onSubmit={createToken} style={{ marginTop: 12 }}>
              <input
                placeholder="Nome. Ex.: odontomind, andrade-cardoso"
                value={tokenForm.name}
                onChange={(e) => setTokenForm({ ...tokenForm, name: e.target.value })}
              />
              <input
                placeholder="Origens permitidas, opcional. Ex.: https://meu-site.com"
                value={tokenForm.origins}
                onChange={(e) => setTokenForm({ ...tokenForm, origins: e.target.value })}
              />
              <button className="primary" disabled={busy}>Gerar token</button>
            </form>
            {freshToken?.token && (
              <div className="item" style={{ marginTop: 14 }}>
                <div className="status">copie agora</div>
                <h4>{freshToken.name}</h4>
                <code className="token-value">{freshToken.token}</code>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="ghost" type="button" onClick={() => copyText(freshToken.token, 'token')}>
                    {copied === 'token' ? 'Copiado' : 'Copiar token'}
                  </button>
                </div>
                <h3 style={{ marginTop: 16 }}>JavaScript</h3>
                <pre className="snippet">{snippetJs(freshToken.token)}</pre>
                <button className="ghost" type="button" onClick={() => copyText(snippetJs(freshToken.token), 'js')}>
                  {copied === 'js' ? 'Copiado' : 'Copiar JS'}
                </button>
                <h3 style={{ marginTop: 16 }}>curl</h3>
                <pre className="snippet">{snippetFetch(freshToken.token)}</pre>
                <button className="ghost" type="button" onClick={() => copyText(snippetFetch(freshToken.token), 'curl')}>
                  {copied === 'curl' ? 'Copiado' : 'Copiar curl'}
                </button>
                <h3 style={{ marginTop: 16 }}>Embed no seu HTML</h3>
                <pre className="snippet">{snippetEmbed(freshToken.token)}</pre>
                <button className="ghost" type="button" onClick={() => copyText(snippetEmbed(freshToken.token), 'embed')}>
                  {copied === 'embed' ? 'Copiado' : 'Copiar embed'}
                </button>
              </div>
            )}
          </section>
          <section className="card">
            <h2>Tokens ativos</h2>
            <div className="list">
              {tokens.map((item) => (
                <article key={item.id} className="item">
                  <h4>{item.name}</h4>
                  <p>{item.prefix}... · {item.scopes?.join(', ')}</p>
                  <div className="status">{item.revokedAt ? 'revogado' : 'ativo'} · {item.origins?.length ? item.origins.join(' ') : 'qualquer origem'}</div>
                  {!item.revokedAt && (
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="ghost" type="button" disabled={busy} onClick={() => revokeToken(item.id)}>
                        Revogar
                      </button>
                    </div>
                  )}
                </article>
              ))}
              {!tokens.length && <p className="empty">Nenhum token ainda. Gere um para ligar seus outros sites.</p>}
            </div>
          </section>
        </div>
      )}

      {tab === 'agentes' && (
        <section className="card">
          <h2>Agentes da mesa</h2>
          <div className="list">
            {agents.map((agent) => (
              <article key={agent.id} className="item">
                <h4>{agent.name}</h4>
                <p>{agent.role}</p>
                <div className="status">{agent.status} · {agent.sourceId} · {agent.model}</div>
                <div className="chips">
                  {agent.skills.map((id) => <span key={id} className="chip on">{id}</span>)}
                </div>
              </article>
            ))}
            {!agents.length && <p className="empty">Nenhum agente ainda.</p>}
          </div>
        </section>
      )}

      {tab === 'tarefas' && (
        <div className="grid">
          <section className="card">
            <h2>Fila</h2>
            <div className="list">
              {tasks.map((task) => (
                <article key={task.id} className="item">
                  <h4>{task.title}</h4>
                  <p>{task.brief}</p>
                  <div className="status">{task.status} · {task.priority} · {task.agentId}</div>
                  {task.status !== 'done' && (
                    <div className="row" style={{ marginTop: 8 }}>
                      <button className="primary" disabled={busy} onClick={() => runTask(task.id)}>
                        Rodar loop
                      </button>
                    </div>
                  )}
                  {task.result && (
                    <ol className="playbook">
                      {task.result.steps.map((step) => (
                        <li key={step.title}><strong>{step.title}.</strong> {step.detail}</li>
                      ))}
                    </ol>
                  )}
                </article>
              ))}
              {!tasks.length && <p className="empty">Nenhuma tarefa na fila.</p>}
            </div>
          </section>
          <section className="card">
            <h2>Execucoes</h2>
            <div className="list">
              {runs.map((run) => (
                <article key={run.id} className="item">
                  <h4>{run.id}</h4>
                  <p>{run.result?.summary}</p>
                  <div className="chips">
                    {run.result?.outputs?.map((out) => (
                      <span key={out.skill} className="chip on">{out.skill}</span>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}

      {tab === 'skills' && (
        <section className="card">
          <h2>311 skills prontas para ligar</h2>
          <div className="row search">
            <input
              placeholder="Buscar skill"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="todas">todas</option>
              {catalog.categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div className="catalog">
            {filteredSkills.map((skill) => (
              <article key={skill.id} className="item">
                <h4>{skill.name}</h4>
                <p>{skill.description}</p>
                <div className="status">{skill.category}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button className="ghost" type="button" onClick={() => toggleSkill(skill.id)}>
                    {agentForm.skills.includes(skill.id) ? 'Remover do rascunho' : 'Ligar no rascunho'}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {tab === 'catalogo' && (
        <section className="card">
          <h2>71 agentes ECC</h2>
          <input
            className="search"
            placeholder="Buscar agente base"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="catalog">
            {filteredBuiltin.map((agent) => (
              <article key={agent.id} className="item">
                <h4>{agent.name}</h4>
                <p>{agent.description}</p>
                <div className="status">{agent.category} · {agent.model}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => {
                      setAgentForm((prev) => ({
                        ...prev,
                        name: prev.name || agent.name.replace(/-/g, ' '),
                        sourceId: agent.id,
                        role: prev.role || agent.description,
                      }))
                      setTab('mesa')
                    }}
                  >
                    Usar como base
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
      <Footer />
    </div>
  )
}
