import crypto from 'crypto'
import cors from 'cors'
import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3001)
const DATA_DIR = path.join(__dirname, 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')
const CATALOG_FILE = path.join(__dirname, 'catalog.json')

const app = express()
app.use(cors({ origin: true, methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }))
app.use((req, _res, next) => {
  if (req.method === 'POST' && req.path.startsWith('/api/tokens/') && req.query._method === 'DELETE') {
    req.method = 'DELETE'
  }
  next()
})
app.use(express.json({ limit: '2mb' }))

function emptyStore() {
  return {
    agents: [],
    tasks: [],
    runs: [],
    tokens: [],
    nextId: 1,
  }
}

function loadJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return fallback
  }
}

function saveStore(store) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2))
}

function nowIso() {
  return new Date().toISOString()
}

function uid(store, prefix) {
  const id = `${prefix}-${String(store.nextId).padStart(4, '0')}`
  store.nextId += 1
  return id
}

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

function mintToken() {
  return `ecc_live_${crypto.randomBytes(24).toString('hex')}`
}

function publicToken(record) {
  return {
    id: record.id,
    name: record.name,
    prefix: record.prefix,
    scopes: record.scopes,
    origins: record.origins,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    revokedAt: record.revokedAt || null,
  }
}

function requestOrigin(req) {
  return String(req.headers.origin || '').replace(/\/$/, '')
}

function authorizeToken(req, res, next) {
  const header = String(req.headers.authorization || '')
  const raw = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  if (!raw) {
    return res.status(401).json({ error: 'Token ausente. Use Authorization: Bearer ecc_live_...' })
  }
  const digest = hashToken(raw)
  const record = store.tokens.find((item) => item.hash === digest && !item.revokedAt)
  if (!record) {
    return res.status(401).json({ error: 'Token invalido ou revogado' })
  }
  const origin = requestOrigin(req)
  if (record.origins?.length && origin && !record.origins.includes(origin)) {
    return res.status(403).json({ error: `Origem ${origin} nao autorizada neste token` })
  }
  record.lastUsedAt = nowIso()
  saveStore(store)
  req.apiToken = record
  next()
}

function seedBuiltinAgents(current, catalogData) {
  if (current.agents.length) return
  const starters = [
    {
      sourceId: 'chief-of-staff',
      role: 'Triage de comunicacao, rascunhos e follow-up diario',
      skills: ['email-ops', 'messages-ops', 'google-workspace-ops', 'unified-notifications-ops', 'brand-voice'],
    },
    {
      sourceId: 'planner',
      role: 'Quebra tarefas do dia em planos executaveis',
      skills: ['plan-canvas', 'plan-orchestrate', 'intent-driven-development', 'blueprint', 'context-and-decisions'],
    },
    {
      sourceId: 'marketing-agent',
      role: 'Campanhas, calendarios e pecas de conteudo',
      skills: ['marketing-campaign', 'content-engine', 'seo', 'social-publisher', 'brand-voice', 'article-writing'],
    },
    {
      sourceId: 'seo-specialist',
      role: 'Auditoria SEO e visibilidade de paginas',
      skills: ['seo', 'frontend-a11y', 'click-path-audit', 'content-engine'],
    },
    {
      sourceId: 'loop-operator',
      role: 'Roda loops autonomos sem travar o fluxo diario',
      skills: ['autonomous-loops', 'continuous-agent-loop', 'operator-approval-loop', 'verification-loop', 'loop-design-check'],
    },
    {
      sourceId: 'security-reviewer',
      role: 'Revisa riscos antes de enviar ou publicar',
      skills: ['security-review', 'security-scan', 'safety-guard', 'gateguard', 'skill-comply'],
    },
  ]

  const byId = new Map(catalogData.agents.map((a) => [a.id, a]))
  for (const item of starters) {
    const src = byId.get(item.sourceId)
    if (!src) continue
    current.agents.push({
      id: uid(current, 'agt'),
      name: src.name.replace(/-/g, ' '),
      sourceId: src.id,
      description: src.description,
      role: item.role,
      skills: item.skills,
      model: src.model || 'sonnet',
      status: 'idle',
      createdAt: nowIso(),
      lastRunAt: null,
      builtin: true,
    })
  }
}

const catalog = loadJson(CATALOG_FILE, { skills: [], agents: [] })
let store = loadJson(STORE_FILE, emptyStore())
if (!store.agents) store = emptyStore()
if (!Array.isArray(store.tokens)) store.tokens = []
seedBuiltinAgents(store, catalog)
saveStore(store)

const skillById = new Map(catalog.skills.map((s) => [s.id, s]))
const builtinAgentById = new Map(catalog.agents.map((a) => [a.id, a]))

function suggestSkills(text) {
  const hay = String(text || '').toLowerCase()
  const scored = catalog.skills
    .map((skill) => {
      const blob = `${skill.id} ${skill.name} ${skill.description} ${skill.category}`.toLowerCase()
      let score = 0
      for (const token of hay.split(/[^a-z0-9]+/).filter((t) => t.length > 3)) {
        if (blob.includes(token)) score += 2
      }
      if (hay.includes(skill.category.toLowerCase())) score += 3
      return { skill, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((x) => x.skill.id)
  if (scored.length) return scored
  return ['plan-canvas', 'deep-research', 'tdd-workflow', 'security-review', 'email-ops']
}

function suggestSourceAgent(text, skills) {
  const hay = `${text} ${skills.join(' ')}`.toLowerCase()
  let best = catalog.agents[0]
  let bestScore = -1
  for (const agent of catalog.agents) {
    const blob = `${agent.id} ${agent.name} ${agent.description} ${agent.category}`.toLowerCase()
    let score = 0
    for (const token of hay.split(/[^a-z0-9]+/).filter((t) => t.length > 3)) {
      if (blob.includes(token)) score += 1
    }
    if (score > bestScore) {
      best = agent
      bestScore = score
    }
  }
  return best
}

function createAgentFromBody(body) {
  const { name, role, sourceId, skills, model } = body || {}
  if (!name || !String(name).trim()) {
    const error = new Error('Nome do agente e obrigatorio')
    error.status = 400
    throw error
  }
  const source = builtinAgentById.get(sourceId) || suggestSourceAgent(`${name} ${role || ''}`, skills || [])
  const linkedSkills = Array.isArray(skills) && skills.length
    ? skills.filter((id) => skillById.has(id)).slice(0, 12)
    : suggestSkills(`${name} ${role || ''}`)

  const agent = {
    id: uid(store, 'agt'),
    name: String(name).trim(),
    sourceId: source?.id || 'planner',
    description: source?.description || role || '',
    role: String(role || 'Agente operacional para tarefas diarias').trim(),
    skills: linkedSkills,
    model: model || source?.model || 'sonnet',
    status: 'idle',
    createdAt: nowIso(),
    lastRunAt: null,
    builtin: false,
  }
  store.agents.unshift(agent)
  saveStore(store)
  return agent
}

function createTaskFromBody(body) {
  const { title, brief, agentId, priority } = body || {}
  if (!title || !String(title).trim()) {
    const error = new Error('Titulo da tarefa e obrigatorio')
    error.status = 400
    throw error
  }
  const agent = store.agents.find((a) => a.id === agentId) || store.agents[0]
  if (!agent) {
    const error = new Error('Crie um agente antes da tarefa')
    error.status = 400
    throw error
  }
  const task = {
    id: uid(store, 'tsk'),
    title: String(title).trim(),
    brief: String(brief || title).trim(),
    agentId: agent.id,
    priority: ['baixa', 'media', 'alta', 'urgente'].includes(priority) ? priority : 'media',
    status: 'queued',
    createdAt: nowIso(),
    updatedAt: nowIso(),
    result: null,
  }
  store.tasks.unshift(task)
  saveStore(store)
  return task
}

function runPlaybook(agent, task) {
  const brief = task.brief || task.title
  const matchedSkills = (agent.skills || [])
    .map((id) => skillById.get(id))
    .filter(Boolean)
  const steps = [
    {
      title: 'Entender a demanda',
      detail: `Ler o briefing "${brief}" e extrair objetivo, prazo e criterios de pronto.`,
    },
    {
      title: 'Montar o stack de skills',
      detail: matchedSkills.length
        ? `Aplicar ${matchedSkills.map((s) => s.name).join(', ')} na ordem de menor risco.`
        : 'Usar plan-canvas e verification-loop como base.',
    },
    {
      title: 'Executar o loop ECC',
      detail: 'plan -> test -> implement -> review -> verify -> remember -> improve',
    },
    {
      title: 'Entregar evidencias',
      detail: 'Gerar resumo, proximos passos e itens que pedem aprovacao humana.',
    },
  ]

  const outputs = matchedSkills.slice(0, 5).map((skill) => ({
    skill: skill.name,
    note: `Skill ${skill.name} aplicada ao briefing. ${skill.description.slice(0, 160)}`,
  }))

  if (!outputs.length) {
    outputs.push({
      skill: 'plan-canvas',
      note: 'Nenhuma skill ligada. Plano minimo gerado com plan-canvas.',
    })
  }

  return {
    summary: `${agent.name} concluiu "${task.title}" usando ${agent.skills.length} skills ECC.`,
    steps,
    outputs,
    nextActions: [
      'Revisar o rascunho antes de enviar',
      'Guardar o resultado na memoria do agente',
      'Encadear um segundo agente se a tarefa cruzar dominio',
    ],
  }
}

function runTaskById(id) {
  const task = store.tasks.find((t) => t.id === id)
  if (!task) {
    const error = new Error('Tarefa nao encontrada')
    error.status = 404
    throw error
  }
  const agent = store.agents.find((a) => a.id === task.agentId)
  if (!agent) {
    const error = new Error('Agente da tarefa nao existe')
    error.status = 400
    throw error
  }

  task.status = 'running'
  agent.status = 'running'
  const result = runPlaybook(agent, task)
  const run = {
    id: uid(store, 'run'),
    taskId: task.id,
    agentId: agent.id,
    startedAt: nowIso(),
    finishedAt: nowIso(),
    result,
  }
  task.status = 'done'
  task.result = result
  task.updatedAt = nowIso()
  agent.status = 'idle'
  agent.lastRunAt = nowIso()
  store.runs.unshift(run)
  store.runs = store.runs.slice(0, 200)
  saveStore(store)
  return { task, run }
}

function catalogPayload() {
  const categories = [...new Set(catalog.skills.map((s) => s.category))].sort()
  return {
    skills: catalog.skills,
    agents: catalog.agents,
    categories,
    counts: {
      skills: catalog.skills.length,
      agents: catalog.agents.length,
    },
  }
}

function statsPayload() {
  const byStatus = store.tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})
  return {
    customAgents: store.agents.length,
    tasks: store.tasks.length,
    runs: store.runs.length,
    skills: catalog.skills.length,
    builtinAgents: catalog.agents.length,
    tokens: store.tokens.filter((item) => !item.revokedAt).length,
    taskStatus: byStatus,
  }
}

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'ECC Loops Digital',
    version: '1.1.0',
    skills: catalog.skills.length,
    builtinAgents: catalog.agents.length,
    api: '/api/v1',
  })
})

app.get('/api/catalog', (_req, res) => {
  res.json(catalogPayload())
})

app.get('/api/stats', (_req, res) => {
  res.json(statsPayload())
})

app.get('/api/tokens', (_req, res) => {
  res.json(store.tokens.map(publicToken))
})

app.post('/api/tokens', (req, res) => {
  const { name, origins, scopes } = req.body || {}
  const raw = mintToken()
  const record = {
    id: uid(store, 'tok'),
    name: String(name || 'site-externo').trim(),
    prefix: raw.slice(0, 16),
    hash: hashToken(raw),
    scopes: Array.isArray(scopes) && scopes.length ? scopes : ['agents:write', 'tasks:write', 'catalog:read'],
    origins: Array.isArray(origins)
      ? origins.map((item) => String(item).replace(/\/$/, '')).filter(Boolean)
      : String(origins || '')
        .split(',')
        .map((item) => item.trim().replace(/\/$/, ''))
        .filter(Boolean),
    createdAt: nowIso(),
    lastUsedAt: null,
    revokedAt: null,
  }
  store.tokens.unshift(record)
  saveStore(store)
  res.status(201).json({
    ...publicToken(record),
    token: raw,
    hint: 'Copie agora. O token nao sera mostrado de novo.',
  })
})

app.delete('/api/tokens/:id', (req, res) => {
  const record = store.tokens.find((item) => item.id === req.params.id)
  if (!record) return res.status(404).json({ error: 'Token nao encontrado' })
  record.revokedAt = nowIso()
  saveStore(store)
  res.json(publicToken(record))
})

app.get('/api/agents', (_req, res) => {
  res.json(store.agents)
})

app.post('/api/agents', (req, res) => {
  try {
    res.status(201).json(createAgentFromBody(req.body))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.patch('/api/agents/:id', (req, res) => {
  const agent = store.agents.find((a) => a.id === req.params.id)
  if (!agent) return res.status(404).json({ error: 'Agente nao encontrado' })
  const { name, role, skills, status } = req.body || {}
  if (name) agent.name = String(name).trim()
  if (role) agent.role = String(role).trim()
  if (Array.isArray(skills)) agent.skills = skills.filter((id) => skillById.has(id)).slice(0, 12)
  if (status) agent.status = status
  saveStore(store)
  res.json(agent)
})

app.post('/api/agents/suggest', (req, res) => {
  const { brief } = req.body || {}
  const skills = suggestSkills(brief)
  const source = suggestSourceAgent(brief, skills)
  res.json({
    suggestedName: source ? source.name.replace(/-/g, ' ') : 'operador diario',
    sourceId: source?.id || 'planner',
    role: source?.description || 'Executa a tarefa com o loop ECC',
    skills,
    model: source?.model || 'sonnet',
  })
})

app.get('/api/tasks', (_req, res) => {
  res.json(store.tasks)
})

app.post('/api/tasks', (req, res) => {
  try {
    res.status(201).json(createTaskFromBody(req.body))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.post('/api/tasks/:id/run', (req, res) => {
  try {
    res.json(runTaskById(req.params.id))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.get('/api/runs', (_req, res) => {
  res.json(store.runs.slice(0, 50))
})

const v1 = express.Router()
v1.use(authorizeToken)

v1.get('/health', (req, res) => {
  res.json({
    ok: true,
    token: req.apiToken.name,
    scopes: req.apiToken.scopes,
    skills: catalog.skills.length,
    builtinAgents: catalog.agents.length,
  })
})

v1.get('/catalog', (_req, res) => {
  res.json(catalogPayload())
})

v1.get('/agents', (_req, res) => {
  res.json(store.agents)
})

v1.post('/agents', (req, res) => {
  try {
    res.status(201).json(createAgentFromBody(req.body))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

v1.post('/agents/suggest', (req, res) => {
  const { brief } = req.body || {}
  const skills = suggestSkills(brief)
  const source = suggestSourceAgent(brief, skills)
  res.json({
    suggestedName: source ? source.name.replace(/-/g, ' ') : 'operador diario',
    sourceId: source?.id || 'planner',
    role: source?.description || 'Executa a tarefa com o loop ECC',
    skills,
    model: source?.model || 'sonnet',
  })
})

v1.get('/tasks', (_req, res) => {
  res.json(store.tasks)
})

v1.post('/tasks', (req, res) => {
  try {
    res.status(201).json(createTaskFromBody(req.body))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

v1.post('/tasks/:id/run', (req, res) => {
  try {
    res.json(runTaskById(req.params.id))
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message })
  }
})

app.use('/api/v1', v1)

app.get('/embed.js', (_req, res) => {
  res.type('application/javascript').send(`(function () {
  var script = document.currentScript;
  var token = script && script.getAttribute('data-token');
  var title = (script && script.getAttribute('data-title')) || 'Criar agente ECC';
  var base = (script && script.src ? script.src.replace(/\\/embed\\.js.*$/, '') : window.location.origin);
  if (!token) { console.warn('ECC embed: data-token ausente'); return; }
  var root = document.createElement('form');
  root.setAttribute('data-ecc-embed', '1');
  root.style.cssText = 'font-family:Instrument Sans,system-ui,sans-serif;background:#0c1a14;color:#e7f6ee;border:1px solid rgba(125,255,179,.2);border-radius:16px;padding:16px;max-width:420px;';
  root.innerHTML = '<h3 style="margin:0 0 10px;font-size:18px;">' + title + '</h3>' +
    '<input name="name" placeholder="Nome do agente" required style="width:100%;margin:0 0 8px;padding:10px;border-radius:10px;border:1px solid rgba(140,214,170,.2);background:#040a08;color:#e7f6ee;box-sizing:border-box;" />' +
    '<textarea name="role" placeholder="Papel diario" required style="width:100%;min-height:80px;margin:0 0 8px;padding:10px;border-radius:10px;border:1px solid rgba(140,214,170,.2);background:#040a08;color:#e7f6ee;box-sizing:border-box;"></textarea>' +
    '<button type="submit" style="border:0;background:#7dffb3;color:#062014;font-weight:600;border-radius:999px;padding:8px 14px;cursor:pointer;">Criar agente</button>' +
    '<p data-msg style="min-height:18px;font-size:13px;color:#8aa89a;margin:8px 0 0;"></p>';
  script.parentNode.insertBefore(root, script.nextSibling);
  root.addEventListener('submit', function (event) {
    event.preventDefault();
    var msg = root.querySelector('[data-msg]');
    msg.textContent = 'Criando...';
    fetch(base + '/api/v1/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({ name: root.name.value, role: root.role.value })
    }).then(function (res) { return res.json().then(function (data) { return { ok: res.ok, data: data }; }); })
      .then(function (out) {
        msg.textContent = out.ok ? ('Agente criado: ' + out.data.id + ' · ' + out.data.name) : (out.data.error || 'Falha ao criar');
        if (out.ok) root.reset();
      }).catch(function () { msg.textContent = 'Falha de rede ao falar com a mesa ECC'; });
  });
})();`)
})

const distDir = path.join(__dirname, '../frontend/dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/embed.js') return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ECC Loops API on http://0.0.0.0:${PORT}`)
})
