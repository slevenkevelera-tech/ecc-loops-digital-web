# ECC Loops Digital

Mesa web para usar as 311 skills e os 71 agentes do repositorio [ECC_loops_digital](https://github.com/slevenkevelera-tech/ECC_loops_digital.git).

Crie agentes para tarefas diarias, ligue skills ECC e rode o loop:

`plan -> test -> implement -> review -> verify -> remember -> improve`

## O que o site faz

- Catalogo completo de skills e agentes ECC
- Criacao de agentes customizados com skills ligadas
- Fila de tarefas diarias
- Execucao de playbook por agente
- API local em `/api` com proxy no frontend

## Como rodar

```bash
# Instalar API
cd backend
npm install

# Instalar interface
cd ../frontend
npm install
```

```bash
# Subir os dois servicos
./start.sh
```

Frontend: `http://localhost:5173`
API: `http://localhost:3001`

## Deploy no Render

O arquivo `render.yaml` sobe um Web Service Node que:

1. Instala backend e frontend
2. Faz o build do Vite
3. Serve API e interface na mesma porta

No dashboard do Render: New + Blueprint e selecione este repositorio.

Ou via CLI, com `RENDER_API_KEY`:

```bash
# Criar o servico a partir do Blueprint do repo
```

Build command:

```bash
npm install --prefix backend && npm install --prefix frontend && npm run build --prefix frontend
```

Start command:

```bash
node backend/server.js
```

## Estrutura

- `backend/` Express + catalogo ECC + persistencia JSON
- `frontend/` Vite + React, proxy `/api` para a porta 3001
- `backend/catalog.json` 311 skills e 71 agentes extraidos do ECC
- `render.yaml` Blueprint do Render
