# Plano de integração — ECC Loops Digital + OdontoMind AI

**Status:** proposta técnica para revisão. Este documento não altera o comportamento da aplicação.
**Produção:** nenhuma alteração de produção autorizada ou realizada.
**Política editorial:** publicação exige aprovação humana.

## 1. Objetivo

Transformar o ECC Loops Digital no painel de coordenação e observabilidade de tarefas de marketing, conteúdo e melhoria web, integrado à OdontoMind AI por APIs autenticadas. A execução real dos agentes deve ocorrer em worker separado do servidor web, com fila persistente e auditoria.

## 2. Estado observado na auditoria estática

- Aplicação web com React/Vite e backend Express/Node.
- O backend contém rotas para agentes, skills e tarefas.
- Parte do estado operacional está em `backend/data/store.json`.
- A execução de tarefas contém um playbook simulado, não uma execução autônoma completa.
- CORS permissivo e rotas operacionais sem autenticação visível foram identificados no código consultado.
- O repositório possui configuração de deploy do Render.

Esses achados precisam ser confirmados por testes locais e pela configuração efetiva de cada serviço antes de serem tratados como diagnóstico definitivo de produção.

## 3. Arquitetura proposta

1. **API ECC:** autenticação de usuários e serviços; validação de entrada; autorização por organização; limites de taxa.
2. **PostgreSQL:** tarefas, execuções, rascunhos, aprovações, agendamentos, eventos e métricas.
3. **Fila persistente:** entrega pelo menos uma vez, identificadores idempotentes, retentativas com backoff e fila de falhas.
4. **Background worker:** executa tarefas fora do processo web; limites de concorrência, tempo e orçamento.
5. **Adaptador OdontoMind:** chamadas HTTPS autenticadas com esquema de requisição/resposta versionado.
6. **Painel de aprovação:** conteúdo permanece como rascunho até aprovação humana.
7. **Observabilidade:** logs estruturados sem tokens ou dados clínicos desnecessários, métricas, alertas e trilha de auditoria.

## 4. Modelo de dados inicial

- `organizations`: organização/cliente e estado.
- `users`, `memberships`, `roles`: identidade e autorização.
- `agent_definitions`: nome, versão, ferramentas permitidas e limites.
- `tasks`: tipo, organização, payload validado, estado, prioridade, idempotency key e timestamps.
- `task_runs`: tentativas, duração, resultado sanitizado e erro categorizado.
- `content_drafts`: canal, formato, conteúdo, fontes, status editorial e versão.
- `approvals`: aprovador, decisão, comentário e data.
- `scheduled_publications`: canal, horário, estado e ID remoto da publicação.
- `audit_events`: ator, ação, recurso e resultado, sem segredos.

## 5. Contrato de API proposto

- `POST /api/integrations/odontomind/tasks`: criar tarefa autenticada.
- `GET /api/tasks/:id`: consultar estado respeitando organização e permissões.
- `POST /api/content/drafts`: salvar rascunho.
- `POST /api/content/:id/approve`: aprovar explicitamente.
- `POST /api/content/:id/reject`: rejeitar ou solicitar revisão.
- `GET /api/analytics/summary`: métricas agregadas.

Todas as rotas devem validar esquema, identidade, autorização e limites. Operações externas devem usar timeout, assinatura/credencial rotacionável e idempotência. Não usar uma chave privilegiada embutida no frontend.

## 6. Segurança e privacidade — bloqueadores

- Exigir autenticação e autorização para todas as rotas de escrita e de operação.
- Restringir CORS às origens explicitamente autorizadas.
- Aplicar isolamento por organização em cada consulta e mutação.
- Não registrar tokens, cabeçalhos de autorização, payloads clínicos ou dados pessoais desnecessários.
- Usar segredos somente em variáveis/secret stores do serviço; nunca em `VITE_*`, commits ou documentos.
- Proteger CSRF quando aplicável, aplicar rate limits e validar conteúdo e URLs de webhook.
- Usar credenciais separadas por ambiente e privilégios mínimos.
- Não enviar dados reais de pacientes a modelos externos durante testes sem avaliação jurídica, base legal, controles e contrato apropriados.
- Nenhuma publicação social sem aprovação humana explícita.
- Nenhuma alteração automática em produção; melhorias de código devem abrir branch/PR e passar CI e revisão.

## 7. Execução e recuperação

Estados da tarefa: `queued → running → needs_review/completed/failed`. A publicação tem ciclo editorial separado: `draft → review → approved → scheduled → published/failed`. A aprovação precisa ser registrada por um usuário autorizado; o agente não pode aprovar seu próprio material.

Workers devem suportar shutdown gracioso, timeouts, retentativas limitadas, deduplicação e reconciliação de publicações para reduzir duplicatas.

## 8. Plano de entrega

1. Confirmar configuração do Render, permissões, rotas e testes existentes.
2. Fechar os bloqueadores de segurança e adicionar testes de regressão.
3. Introduzir migrations PostgreSQL e camada de persistência com migração controlada dos dados necessários.
4. Implementar fila e worker real, substituindo o playbook simulado.
5. Implementar o adaptador autenticado OdontoMind e contratos de API.
6. Implementar rascunhos, revisão e aprovação humana.
7. Adicionar conectores oficiais de redes sociais, inicialmente em modo sandbox/conta de teste.
8. Adicionar métricas, alertas e otimização baseada em resultados.
9. Validar staging; só então propor implantação, que requer aprovação separada.

## 9. Critérios de aceitação

- Rotas privilegiadas rejeitam chamadas sem autorização.
- Testes cobrem isolamento entre organizações.
- Tarefas sobrevivem a reinício e podem ser repetidas sem duplicação.
- Nenhum segredo aparece em logs ou bundle de frontend.
- A execução real de IA é distinguível de simulação e registra modelo/custo de forma segura.
- Conteúdo não é publicado sem aprovação humana registrada.
- Testes automatizados e build passam no staging.
- Produção não é modificada por este PR.

## 10. Fora do escopo desta proposta

Este PR adiciona somente o plano de implementação. Não ativa workers, não altera rotas operacionais, não cria bancos/serviços Render, não publica conteúdo e não altera produção.