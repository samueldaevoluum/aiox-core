# Architecture Decisions & Session Log

**Data:** 2026-03-22
**Status:** Em discussao (pre-PRD)
**Sessao:** claude/analyze-image-tr45K

---

## 1. O que e o NanoClaw

NanoClaw e um **framework open-source existente** de agentes de IA, leve e focado em seguranca. E uma alternativa segura ao OpenClaw.

- **Repo:** github.com/qwibitai/nanoclaw
- **Site:** nanoclaw.dev
- **Licenca:** MIT
- **Tamanho:** ~3.900 linhas de codigo, ~15 arquivos
- **Runtime:** Node.js, Claude Agent SDK (com suporte a modelos opensource)
- **Seguranca:** Cada agente roda em container Docker isolado (filesystem, IPC, process space)
- **Canais nativos:** WhatsApp, Telegram, Slack, Discord, Gmail
- **Memoria:** CLAUDE.md por grupo/canal (isolada por container)
- **Features:** Scheduled jobs, agent swarms, web access

### O que o NanoClaw oferece out-of-the-box

| Feature | Descricao |
|---------|-----------|
| Container isolation | Cada sessao de agente em Docker proprio |
| Multi-channel | WhatsApp, Telegram, Slack, Discord, Gmail |
| Memoria por grupo | CLAUDE.md isolado por canal/grupo |
| Agent swarms | Multi-agente via Claude Agent SDK |
| Scheduled jobs | Tarefas recorrentes com cron |
| Message queue | Per-group com concurrency control |
| SQLite | Persistencia leve |

### O que NAO tem (e que vamos construir)

| Feature | Nossa plataforma adiciona |
|---------|--------------------------|
| Multi-tenant enterprise | Multiplos clientes, isolamento por tenant |
| PostgreSQL + pgvector | Banco robusto com RAG |
| Admin Web UI | Interface para gerenciar agents, users, workflows |
| Workflow Engine | Processos multi-step com mixed executors |
| Knowledge Base (RAG) | Documentos da empresa processados e consultaveis |
| Task-first architecture | Workers deterministicos + IA + humano |
| Modelo de permissoes | RLS, memory_access por role |
| Integracao com ferramentas | ClickUp, ERPs, etc. via webhooks |

---

## 2. Nosso Produto (Plataforma)

Estamos construindo uma **plataforma de agentes de IA para negocios** que usa o NanoClaw como orquestrador/dependencia.

```
Tres pecas distintas:

AIOX (inspiracao)              NanoClaw (orquestrador)        Nossa Plataforma (produto)
─────────────────              ───────────────────────        ──────────────────────────
Formato rico de agents         Runtime de agentes             Usa NanoClaw como dependencia
Task-first architecture        Container isolation            Workflow Engine
@squad-creator                 Multi-channel                  Admin Web UI (Next.js)
Nao e alterado                 E uma dependencia npm          Knowledge Base (RAG/pgvector)
                               ~3900 LOC, auditavel           Multi-tenant, PostgreSQL
                                                              Base de conhecimento de gestao
                                                              Integracao com ferramentas externas
```

---

## 3. Decisoes Confirmadas

### 3.1 Repositorio
- **Decisao:** Repo separado do AIOX
- **NanoClaw:** Usado como dependencia (npm), nao como fork
- **AIOX nao sera alterado**

### 3.2 Banco de Dados
- **Decisao:** PostgreSQL (substituindo SQLite do NanoClaw)
- **Motivo:** LISTEN/NOTIFY para hot-reload, pgvector para RAG, RLS para multi-tenancy

### 3.3 Canal de Comunicacao (MVP)
- **Decisao:** Telegram (primeiro canal)
- **Nota:** NanoClaw ja suporta Telegram nativamente
- **Futuro:** Web Chat, WhatsApp Business API

### 3.4 Bot Telegram
- **Decisao:** Um bot por cliente
- **Cada cliente tem seu @empresaX_bot** com token proprio

### 3.5 LLM
- **Decisao:** Modelos opensource on-premise (Ollama, modelo 8B rapido)
- **Nota:** NanoClaw originalmente usa Claude Agent SDK, mas ja suporta modelos opensource
- **Continuaremos com modelos on-premise** para controle de custo e privacidade
- **Futuro:** Modelo maior (70B) como opcao "smart"

### 3.6 Multi-tenancy
- **MVP:** Uma instancia por cliente (simples, testar na propria empresa)
- **Futuro:** Multi-tenant com schemas separados + RLS

### 3.7 Knowledge Base (MVP)
- **Decisao:** Documentos uploadados (PDF, DOCX)
- **Fluxo:** Admin upload → chunks → embeddings → pgvector → Agent consulta via RAG
- **Futuro:** Integracoes com APIs externas (ERP, sistemas)

### 3.8 Web UI Admin
- **Decisao:** Next.js (React)
- **Funcionalidades:** Editar agentes, editar usuarios, editar permissoes, ver logs/conversas

### 3.9 Deploy
- **Decisao:** VPS com Docker (docker-compose)
- **Stack:** Plataforma + NanoClaw + PostgreSQL + Ollama

### 3.10 Detalhamento dos Agentes
- **Decisao:** Manter TODA a riqueza do formato AIOX
- **Motivo:** O detalhamento (persona, archetype, communication style, greeting levels, core principles, commands, dependencies) e o que faz os agentes funcionarem bem
- **Formato:** Adaptado para contexto de negocio, mantendo profundidade estrutural

### 3.11 Task-First Architecture
- **Decisao:** Manter abordagem task-first com tipos de executor
- **Tipos:**
  - **WORKER** — Deterministico, sem LLM, sem tokens (ex: consulta saldo ferias)
  - **WORKER+API** — Deterministico com integracao externa (ex: abrir chamado)
  - **CLONE** — Agente de IA processa via LLM + RAG (ex: analisar documentacao)
  - **HUMANO** — Escala para pessoa real com notificacao (ex: contestar avaliacao)
- **Beneficio:** ~65% economia de tokens roteando deterministico vs IA

---

## 4. Arquitetura Consolidada

### 4.1 Camadas

```
┌─────────────────────────────────────────────────────────────┐
│                    NOSSA PLATAFORMA                          │
│                                                              │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │ Admin UI  │  │  Workflow    │  │  Knowledge Base   │    │
│  │ (Next.js) │  │  Engine     │  │  (RAG/pgvector)   │    │
│  └───────────┘  └──────────────┘  └───────────────────┘    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              NanoClaw (orquestrador)                    │  │
│  │                                                         │  │
│  │  ┌─────────┐  ┌──────────┐  ┌────────────┐            │  │
│  │  │Telegram │  │ Slack    │  │ WhatsApp   │            │  │
│  │  │Channel  │  │ Channel  │  │ Channel    │            │  │
│  │  └────┬────┘  └────┬─────┘  └─────┬──────┘            │  │
│  │       └─────────────┼──────────────┘                    │  │
│  │                     ▼                                    │  │
│  │           ┌─────────────────┐                           │  │
│  │           │  Agent Runtime  │  (container isolation)    │  │
│  │           │  + Swarms       │                           │  │
│  │           └─────────────────┘                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Task Router                         │  │
│  │  mensagem → [WORKER] | [WORKER+API] | [CLONE] | [HUMAN] │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │PostgreSQL │  │ Ollama    │  │ External │  │ Webhook  │  │
│  │+ pgvector │  │ (LLM)    │  │ APIs     │  │ Receiver │  │
│  └───────────┘  └───────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Fonte de Verdade dos Agentes

```
PostgreSQL (fonte de verdade)
         │
         ├── Web UI Admin edita direto no banco
         │
         ├── Plataforma carrega em memoria (Map<id, config>)
         │
         └── Hot-reload via PostgreSQL LISTEN/NOTIFY
             Admin salva → NOTIFY agent_changed → server recarrega
```

### 4.3 Formato do Agente (inspirado no AIOX, adaptado para negocio)

```yaml
agent:
  name: Helena
  id: rh
  title: Assistente de RH
  icon: (emoji)

persona_profile:
  archetype: Guardian
  communication:
    tone: acolhedor
    vocabulary: [orientar, esclarecer, acolher, encaminhar]
    greeting_levels:
      minimal: "Ola! Sou a Helena, assistente de RH."
      named: "Ola {user_name}! ..."
      archetypal: "Ola {user_name}! Sou a Helena, guardia das politicas..."
    signature_closing: "Helena | RH Digital"

persona:
  role: Especialista em Recursos Humanos
  style: Acolhedor, preciso, empatico, profissional
  identity: (descricao completa)
  focus: (escopo especifico)

core_principles:
  - CRITICAL: Nunca inventar informacoes
  - CRITICAL: Dados salariais APENAS com permissao salary_view
  - CRITICAL: Sempre referenciar fonte

commands:
  - name: consultar-politica
    type: clone
    tools: [knowledge_search]

  - name: saldo-ferias
    type: worker
    match_patterns: ["saldo de ferias", "quantos dias de ferias"]
    executor:
      function: erp_query
      params: { module: vacation, query: balance }
    response_template: "Seu saldo: {result.days} dias"

  - name: abrir-chamado
    type: worker_api
    executor:
      action: ticket_create
      collect_params:
        - field: tipo
          question: "Qual o tipo?"

  - name: contestar-avaliacao
    type: human_escalation
    escalation:
      to: rh_manager
      channel: telegram

dependencies:
  tools: [knowledge_search, erp_query, ticket_create, calendar_check]
  knowledge_bases: [politicas-rh, manual-beneficios, tabela-salarial]

memory_access:
  groups: [rh, gestao-pessoas]
  restricted: [salarios, dados-pessoais]

autoNanoClaw:
  version: '1.0'
  execution:
    canQuery: true
    canAction: true
    canEscalate: true
    canLearn: true
  guardrails:
    maxTokensPerResponse: 1024
    requireSourceCitation: true
    escalateOnUncertainty: true
  model_preference: fast
  temperature: 0.3
```

### 4.4 Tipos de Memoria

1. **Conversa atual** (efemera) — morre com a sessao
2. **Historico de conversas** (persistente) — PostgreSQL, pesquisavel
3. **Memoria do agent sobre o usuario** (aprendida) — preferencias acumuladas
4. **Knowledge base** (estatica) — documentos da empresa via RAG

### 4.5 Workflow Engine

Orquestra processos de negocio multi-step com mixed executors:

```
Workflow Engine
├── Define processos em YAML (ex: admissao com 10 steps)
├── Cada step tem executor type: worker | worker_api | clone | human
├── Integra com ferramentas externas (ClickUp, ERPs)
├── Human-in-the-loop bidirecional
│   ├── Humano marca @agente no ClickUp → webhook → plataforma processa
│   └── Agente comenta no ClickUp → marca @humano → notifica
├── Completion triggers: external_event, timeout, condition
├── Gates de decisao (humano aprova/reprova)
└── SLA tracking por step e por processo
```

**Schema PostgreSQL do Workflow Engine:**
```sql
workflows (id, name, version, definition_json, integration_config)
workflow_runs (id, workflow_id, status, context_json, started_at, sla_deadline)
step_runs (id, workflow_run_id, step_id, type, status, executor_type, input/output_json)
webhook_events (id, source, event_type, payload_json, matched_workflow_run_id)
integrations (id, platform, config_json, credentials_encrypted)
```

### 4.6 Chat vs. Workflow — Dois Sistemas que Conversam

```
CHAT (via NanoClaw):            WORKFLOW ENGINE:
- Conversa livre                - Processo estruturado
- Funcionario pergunta algo     - Sistema executa steps
- Agente responde               - Mixed executors
- Stateless (por conversa)      - Stateful (por processo)
- Sempre ativo                  - Ativado por trigger

Interacao:
- Chat pode iniciar workflow:    "Helena, inicie admissao do Joao"
- Workflow pode usar chat agent: Step 3 usa Helena pra analisar docs
- Workflow pode notificar via chat: "Joao, seu contrato esta pronto"
```

---

## 5. Pontos Pendentes

### 5.1 Fluxo de Decisao do Task Router
- **Status:** PENDENTE
- **Contexto:** O fluxo proposto (match exato → worker, match acao → worker+API, senao → LLM) foi considerado diferente pelo fundador
- **Acao:** Fundador vai enviar o fluxo correto em sessao futura
- **Impacto:** Afeta como a plataforma decide qual executor usar para cada mensagem

### 5.2 Configuracao e Integracao com MCP
- **Status:** PENDENTE
- **Contexto:** Como a plataforma vai usar/integrar com MCP (Model Context Protocol)?
- **Perguntas em aberto:**
  - A plataforma tera seu proprio MCP server?
  - Os tools dos agents serao implementados como MCP tools?
  - Como o modelo on-premise se conecta com MCP tools?
  - A plataforma expoe MCP para que outras ferramentas se conectem?
- **Impacto:** Define como tools sao implementados e como o LLM acessa funcionalidades externas

### 5.3 Base de Conhecimento de Gestao de Negocio
- **Status:** PENDENTE
- **Contexto:** O fundador tem uma base de conhecimento sobre gestao de negocios que quer usar para tornar a plataforma especialista em gestao
- **Perguntas em aberto:**
  - Qual o formato dessa base? (PDFs, documentos, frameworks, metodologias?)
  - E conteudo proprietario ou publico?
  - Como integrar: como knowledge base padrao (RAG) ou como parte do system prompt?
  - Diferencial competitivo: agents aconselham com base em frameworks comprovados (OKR, BSC, Lean)?
- **Impacto:** Define se a plataforma e "chatbot com docs" ou "consultor de gestao com IA"

### 5.4 Agents Genericos para Implantacao
- **Status:** PENDENTE
- **Contexto:** Pretende criar agents genericos (RH, Financeiro, Marketing, Vendas, Suporte, Juridico)
- **Acao:** Definir quais criar primeiro apos PRD

### 5.5 Estrutura do Repo da Plataforma
- **Status:** PENDENTE
- **Contexto:** Repo separado, NanoClaw como dependencia (nao fork)
- **Proposta inicial:**
  ```
  nossa-plataforma/
  ├── server/              # Backend (Node.js)
  │   ├── core/            # Auth, Agent Loader, Memory Gateway
  │   ├── workflow-engine/ # Workflow Engine
  │   ├── webhooks/        # Webhook Receiver
  │   └── providers/       # Ollama Provider
  ├── web/                 # Next.js Admin UI
  ├── db/                  # Migrations, seeds, RLS policies
  ├── docker/              # docker-compose, Dockerfiles
  ├── agents/              # Agent definitions (templates)
  └── docs/                # Documentacao
  ```
- **NanoClaw:** importado como `npm install nanoclaw` ou similar

### 5.6 Processo de Admissao (Exemplo de Workflow)
- **Status:** Discutido como exemplo, nao implementado
- **Contexto:** 10 steps com mixed executors, integracao ClickUp, human-in-the-loop bidirecional
- **Acao:** Usar como caso de teste do Workflow Engine

### 5.7 Seguranca e RLS
- **Status:** PENDENTE
- **Perguntas:**
  - Modelo de permissoes detalhado
  - RLS policies no PostgreSQL
  - Como memory_access se traduz em queries SQL
  - Audit log de acessos sensiveis

### 5.8 Modelo de Pricing/Billing
- **Status:** NAO DISCUTIDO

### 5.9 Nome da Plataforma
- **Status:** NAO DISCUTIDO
- **Contexto:** NanoClaw e o framework, nao nosso produto. Precisamos de um nome para a plataforma.

---

## 6. Stack Tecnica Consolidada

| Componente | Tecnologia | Status |
|------------|-----------|--------|
| Orquestrador de Agents | NanoClaw (framework OSS) | Confirmado |
| Backend/Server | Node.js | Confirmado |
| Banco de Dados | PostgreSQL | Confirmado |
| Embeddings/RAG | pgvector (PostgreSQL) | Confirmado |
| LLM | Ollama (modelos opensource on-premise) | Confirmado |
| Canal MVP | Telegram Bot API | Confirmado |
| Web UI Admin | Next.js (React) | Confirmado |
| Deploy | Docker Compose em VPS | Confirmado |
| Repo | Separado do AIOX | Confirmado |
| Container Isolation | Docker (via NanoClaw) | Confirmado |

---

## 7. Relacao entre as tres pecas

### AIOX (inspiracao):
- Formato rico de agent definition como referencia
- Task-first architecture como padrao
- @squad-creator para gerar templates iniciais de agents
- NAO e alterado, NAO e dependencia

### NanoClaw (orquestrador):
- Runtime de agents com container isolation
- Canais de comunicacao (Telegram, WhatsApp, etc.)
- Agent swarms e memoria
- Dependencia npm da plataforma

### Nossa Plataforma (produto):
- Workflow Engine com mixed executors
- Admin Web UI (Next.js)
- Knowledge Base (RAG + pgvector)
- PostgreSQL (substituindo SQLite do NanoClaw)
- Multi-tenant enterprise
- Base de conhecimento de gestao (diferencial)
- Integracoes externas (ClickUp, ERPs)

---

## 8. Proximos Passos

1. [ ] Receber fluxo de decisao correto do Task Router (do fundador)
2. [ ] Definir integracao com MCP
3. [ ] Entender e integrar base de conhecimento de gestao
4. [ ] Definir nome da plataforma
5. [ ] Criar PRD completo
6. [ ] Definir estrutura do repo separado
7. [ ] Definir quais agents genericos criar primeiro
8. [ ] Implementar MVP

---

*Documento atualizado na sessao claude/analyze-image-tr45K em 2026-03-22*
*Correcao: NanoClaw e framework OSS (dependencia), nao o produto*
