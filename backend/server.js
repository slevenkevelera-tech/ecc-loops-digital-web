import express from 'express'
import cors from 'cors'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT || 3001)
const DATA_DIR = path.join(__dirname, 'data')
const STORE_FILE = path.join(DATA_DIR, 'store.json')
const CATALOG_FILE = path.join(__dirname, 'catalog.json')

const app = express()
app.use(cors())
app.use(express.json({ limit: '2mb' }))

function emptyStore() {
  return {
    agents: [],
    tasks: [],
    runs: [],
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

function seedBuiltinAgents(store, catalog) {
  if (store.agents.length) return
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

  const byId = new Map(catalog.agents.map((a) => [a.id, a]))
  for (const item of starters) {
    const src = byId.get(item.sourceId)
    if (!src) continue
    store.agents.push({
      id: uid(store, 'agt'),
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

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    name: 'ECC Loops Digital',
    version: '1.0.0',
    skills: catalog.skills.length,
    builtinAgents: catalog.agents.length,
  })
})

app.get('/api/catalog', (_req, res) => {
  const categories = [...new Set(catalog.skills.map((s) => s.category))].sort()
  res.json({
    skills: catalog.skills,
    agents: catalog.agents,
    categories,
    counts: {
      skills: catalog.skills.length,
      agents: catalog.agents.length,
    },
  })
})

app.get('/api/stats', (_req, res) => {
  const byStatus = store.tasks.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1
    return acc
  }, {})
  res.json({
    customAgents: store.agents.length,
    tasks: store.tasks.length,
    runs: store.runs.length,
    skills: catalog.skills.length,
    builtinAgents: catalog.agents.length,
    taskStatus: byStatus,
  })
})

app.get('/api/agents', (_req, res) => {
  res.json(store.agents)
})

app.post('/api/agents', (req, res) => {
  const { name, role, sourceId, skills, model } = req.body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ error: 'Nome do agente e obrigatorio' })
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
  res.status(201).json(agent)
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
  const { title, brief, agentId, priority } = req.body || {}
  if (!title || !String(title).trim()) {
    return res.status(400).json({ error: 'Titulo da tarefa e obrigatorio' })
  }
  const agent = store.agents.find((a) => a.id === agentId) || store.agents[0]
  if (!agent) return res.status(400).json({ error: 'Crie um agente antes da tarefa' })
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
  res.status(201).json(task)
})

app.post('/api/tasks/:id/run', (req, res) => {
  const task = store.tasks.find((t) => t.id === req.params.id)
  if (!task) return res.status(404).json({ error: 'Tarefa nao encontrada' })
  const agent = store.agents.find((a) => a.id === task.agentId)
  if (!agent) return res.status(400).json({ error: 'Agente da tarefa nao existe' })

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
  res.json({ task, run })
})

app.get('/api/runs', (_req, res) => {
  res.json(store.runs.slice(0, 50))
})

const distDir = path.join(__dirname, '../frontend/dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`ECC Loops API on http://0.0.0.0:${PORT}`)
})
