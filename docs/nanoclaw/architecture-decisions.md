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
- **NanoClaw:** Orquestrado via IPC (arquivos JSON), nao como dependencia direta
- **AIOX nao sera alterado**
- **Backend:** Python (FastAPI)

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

### 3.6 Multi-tenancy e NCI (NanoClaw Instance)
- **MVP:** Uma instancia NanoClaw por cliente/empresa (simples, testar na propria empresa)
- **Futuro:** Multi-tenant com schemas separados + RLS

#### Hierarquia: Empresa → NanoClaw Process → NCI (usuario)
- **1 NanoClaw Process por empresa** — processo separado, API keys proprias, config propria
- **1 NCI por usuario (funcionario)** — mapeia para "grupo" do NanoClaw
- Cada NCI = 1 container Docker isolado (filesystem, IPC, processos)
- NanoClaw ja faz spawn de containers por grupo nativamente — reutilizamos esse mecanismo

#### Session Isolation (pesquisa realizada 2026-03-22)
- NanoClaw tem **isolamento nativo por grupo de chat** (container Docker por grupo)
- **NAO tem multi-tenant** — e single-owner by design
- **NAO tem autenticacao de multiplos usuarios** — cada empresa precisa de sua propria instancia
- O conceito de "grupo" do NanoClaw mapeia diretamente para NCI (sessao do usuario)
- Cada container tem: filesystem isolado, IPC isolado, CLAUDE.md proprio, fila de mensagens propria

#### IPC (Inter-Process Communication)
- NanoClaw usa **arquivos JSON em diretorios compartilhados** entre host e container
- Host escreve comando.json → container le, executa, escreve resultado.json → host le
- Simples, seguro, sem portas expostas

#### Modelo visual
```
Empresa A (NanoClaw Process)
    ├── NCI Joao  (Container Docker) ← grupo "joao"
    ├── NCI Maria (Container Docker) ← grupo "maria"
    └── NCI Pedro (Container Docker) ← grupo "pedro"

Empresa B (NanoClaw Process)
    ├── NCI Ana    (Container Docker)
    └── NCI Carlos (Container Docker)

Empresa C (hibernada, sem containers ativos)
```

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

### 3.12 Backend Python (DECIDIDO — 2026-03-22)
- **Decisao:** Backend em Python com FastAPI (substituindo Node.js)
- **Motivo:** Ecossistema Python mais maduro para IA/ML, Ollama SDK, RAG, embeddings
- **Framework:** FastAPI (async nativo, Pydantic validation, OpenAPI auto-docs)
- **ORM:** SQLAlchemy 2.0 com asyncpg (async PostgreSQL)
- **Migrations:** Alembic (integrado com SQLAlchemy)
- **Telegram Bot:** aiogram 3.x (async, bem mantido)
- **LLM:** ollama-python (SDK oficial)
- **Testes:** pytest + pytest-asyncio + httpx (test client async)
- **Package Manager:** uv (rapido, lockfile deterministico, compativel pip)
- **Linting:** ruff (linter + formatter, extremamente rapido)
- **Type checking:** mypy ou pyright
- **Impacto NanoClaw:** Zero — NanoClaw continua rodando em Node.js como processo separado. Comunicacao via IPC (arquivos JSON), mesma interface que ja existe.

#### Justificativa tecnica
```
Python                              vs Node.js (descartado)
───────                             ────────────────────────
FastAPI async nativo                Express/Fastify
SQLAlchemy 2.0 (maduro)             Prisma/Drizzle (mais jovens)
Ecossistema IA/ML nativo            Precisa de bridges Python
ollama-python (SDK oficial)         ollama-js
pgvector nativo                     pgvector-node
Pydantic validation built-in        Zod/Joi (separado)
Alembic (migrations maduras)        Knex/Prisma migrations
pytest (poderoso)                   Jest/Vitest
uv (package manager rapido)         npm/pnpm
```

---

## 4. Arquitetura Consolidada

### 4.1 Camadas

```
                    ┌─────────────────────────────────────┐
                    │          CANAIS DE ENTRADA           │
                    │   Telegram  |  Web App  |  Webhook   │
                    └──────────────────┬──────────────────┘
                                      |
                                      v
                    ┌─────────────────────────────────────┐
                    │           API GATEWAY                │
                    │  Auth (empresa+usuario) | Rate limit │
                    │  Resolucao de permissoes | Routing   │
                    └──────────────────┬──────────────────┘
                                      |
                                      v
                    ┌─────────────────────────────────────┐
                    │        LIFECYCLE MANAGER             │
                    │  Spawn/Hibernate/Wake NanoClaw       │
                    │  Health check | Metering/Billing     │
                    └──────────────────┬──────────────────┘
                                      |
              ┌───────────────────────┼───────────────────────┐
              |                       |                       |
              v                       v                       v
┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────────┐
│  EMPRESA A           │ │  EMPRESA B           │ │  EMPRESA C           │
│  NanoClaw Process    │ │  NanoClaw Process    │ │  (hibernado)         │
│                      │ │                      │ │                      │
│  ┌────────────────┐  │ │  ┌────────────────┐  │ │                      │
│  │ NCI Joao       │  │ │  │ NCI Ana        │  │ │                      │
│  │ (Container)    │  │ │  │ (Container)    │  │ │                      │
│  └────────────────┘  │ │  └────────────────┘  │ │                      │
│  ┌────────────────┐  │ │  ┌────────────────┐  │ │                      │
│  │ NCI Maria      │  │ │  │ NCI Carlos     │  │ │                      │
│  │ (Container)    │  │ │  │ (Container)    │  │ │                      │
│  └────────────────┘  │ │  └────────────────┘  │ │                      │
└──────────────────────┘ └──────────────────────┘ └──────────────────────┘
              |                       |
              └───────────┬───────────┘
                          v
┌─────────────────────────────────────────────────────────────┐
│                    SERVICOS COMPARTILHADOS                    │
│                                                              │
│  ┌───────────┐  ┌──────────────┐  ┌───────────────────┐    │
│  │ Admin UI  │  │  Workflow    │  │  Knowledge Base   │    │
│  │ (Next.js) │  │  Engine     │  │  (RAG/pgvector)   │    │
│  └───────────┘  └──────────────┘  └───────────────────┘    │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    Task Router                         │  │
│  │  mensagem -> [WORKER] | [WORKER+API] | [CLONE] | [HUMAN]│
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐ │
│  │PostgreSQL │  │ Ollama    │  │ External │  │ Webhook  │  │
│  │+ pgvector │  │ (LLM)    │  │ APIs     │  │ Receiver │  │
│  │ (RLS)     │  │           │  │          │  │          │  │
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

### 4.4 Tipos de Memoria e Controle de Acesso

#### 4 Camadas de Memoria

| Camada | Persistencia | Escopo | Onde vive | Controle de acesso |
|--------|-------------|--------|-----------|-------------------|
| **Conversa atual** | Efemera — morre com a sessao | NCI | Container Docker | Isolamento por container |
| **Memoria pessoal** | Persistente (aprendida) | Usuario | PostgreSQL (RLS) | So o proprio usuario |
| **Historico** | Persistente | Usuario + Admin | PostgreSQL (RLS) | Usuario le, admin audita |
| **Knowledge Base** | Estatica (RAG) | Empresa | pgvector (RLS) | 3 niveis (ver abaixo) |

#### Knowledge Base — 3 Niveis de Visibilidade

| Nivel | Quem acessa | Exemplo |
|-------|-------------|---------|
| **Publica** | Todos os funcionarios do tenant | Manual do funcionario, politicas gerais |
| **Restrita** | Grupos autorizados (memory_access.groups) | Tabela salarial → so [rh, gestao-pessoas] |
| **Privada** | So admin da empresa | Dados estrategicos, contratos |

#### Como a memoria chega no container (NCI)

O NanoClaw nao sabe nada sobre controle de acesso. Quem monta o contexto e a camada que construimos:

```
Mensagem do Joao chega
        |
        v
  API Gateway (auth + permissoes)
        |
        v
  Lifecycle Manager
        |
        |-- 1. Busca perfil do Joao no PostgreSQL
        |      (grupos: [vendas], permissoes, preferencias)
        |
        |-- 2. Monta CLAUDE.md personalizado
        |      (memoria pessoal HOT + regras da empresa)
        |
        |-- 3. Configura tools disponiveis
        |      (Joao NAO tem acesso ao tool de RH)
        |
        |-- 4. Configura RAG com filtro de acesso
        |      (Joao so ve docs de [vendas, publico])
        |
        |-- 5. Spawna/roteia pro container do Joao
```

#### Sincronizacao container → PostgreSQL

- Durante sessao: container escreve estado local
- Ao encerrar sessao: hook sync persiste memoria pessoal atualizada no PostgreSQL
- Proximo spawn: Lifecycle Manager injeta memoria pessoal no CLAUDE.md do container

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
  ├── server/              # Backend (Python/FastAPI)
  │   ├── app/
  │   │   ├── api/         # Rotas FastAPI (REST endpoints)
  │   │   ├── core/        # Auth, config, security, settings
  │   │   ├── models/      # SQLAlchemy models
  │   │   ├── schemas/     # Pydantic schemas (request/response)
  │   │   ├── services/    # Business logic (Agent Loader, Memory Gateway)
  │   │   ├── workflow/    # Workflow Engine
  │   │   ├── workers/     # Worker executors (deterministicos)
  │   │   ├── webhooks/    # Webhook Receiver
  │   │   └── providers/   # Ollama Provider, Telegram Bot
  │   ├── migrations/      # Alembic migrations
  │   ├── tests/           # pytest tests
  │   ├── pyproject.toml   # Dependencias (uv/poetry)
  │   └── Dockerfile
  ├── web/                 # Next.js Admin UI
  ├── db/                  # Seeds, RLS policies SQL
  ├── docker/              # docker-compose, Dockerfiles
  ├── agents/              # Agent definitions (YAML templates)
  └── docs/                # Documentacao
  ```
- **NanoClaw:** Orquestrado via IPC (arquivos JSON entre host e container), nao como dependencia Python

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

### 5.8 Lifecycle Manager — Decisoes Pendentes
- **Status:** PARCIALMENTE DISCUTIDO
- **Confirmado:**
  - API Gateway identifica usuario/empresa e cria ou roteia NCI
  - Lifecycle Manager gerencia spawn/hibernate/wake/destroy de NanoClaw processes
- **Perguntas em aberto:**
  - Hibernacao de NCI: timeout fixo? Baseado em atividade?
  - Hibernacao de NanoClaw process (empresa): quanto tempo sem atividade?
  - Sync de memoria container→PostgreSQL: hook pos-sessao? Streaming?
  - Autenticacao cross-channel: OAuth? Token por canal? SSO?
  - Escala horizontal: multiplos hosts rodando Lifecycle Managers?
  - Health check: frequencia? O que monitora?

### 5.9 Modelo de Pricing/Billing
- **Status:** NAO DISCUTIDO

### 5.10 Nome da Plataforma
- **Status:** NAO DISCUTIDO
- **Contexto:** NanoClaw e o framework, nao nosso produto. Precisamos de um nome para a plataforma.

---

## 6. Stack Tecnica Consolidada

| Componente | Tecnologia | Status |
|------------|-----------|--------|
| Orquestrador de Agents | NanoClaw (framework OSS, Node.js) | Confirmado |
| Backend/Server | **Python 3.12+ (FastAPI)** | Confirmado |
| Framework Web | FastAPI (async, Pydantic, OpenAPI) | Confirmado |
| ORM | SQLAlchemy 2.0 + asyncpg | Confirmado |
| Migrations | Alembic | Confirmado |
| Banco de Dados | PostgreSQL | Confirmado |
| Embeddings/RAG | pgvector (PostgreSQL) | Confirmado |
| LLM | Ollama (modelos opensource on-premise) | Confirmado |
| LLM SDK Python | ollama-python | Confirmado |
| Canal MVP | Telegram Bot API (aiogram 3.x, async) | Confirmado |
| Web UI Admin | Next.js (React) | Confirmado |
| Testes | pytest + pytest-asyncio + httpx | Confirmado |
| Package Manager | uv (rapido, lockfile deterministico) | Confirmado |
| Deploy | Docker Compose em VPS | Confirmado |
| Repo | Separado do AIOX | Confirmado |
| Container Isolation | Docker (via NanoClaw) | Confirmado |
| IPC com NanoClaw | Arquivos JSON em diretorios compartilhados | Confirmado |

---

## 7. Relacao entre as tres pecas

### AIOX (inspiracao):
- Formato rico de agent definition como referencia
- Task-first architecture como padrao
- @squad-creator para gerar templates iniciais de agents
- NAO e alterado, NAO e dependencia

### NanoClaw (orquestrador):
- Runtime de agents com container isolation (Node.js)
- Canais de comunicacao (Telegram, WhatsApp, etc.)
- Agent swarms e memoria
- **Comunicacao via IPC** (arquivos JSON em diretorios compartilhados)
- NAO e dependencia Python — roda como processo separado orquestrado via Docker

### Nossa Plataforma (produto):
- **Backend Python (FastAPI)** — API Gateway, Lifecycle Manager, Task Router
- Workflow Engine com mixed executors
- Admin Web UI (Next.js)
- Knowledge Base (RAG + pgvector)
- PostgreSQL (substituindo SQLite do NanoClaw)
- Multi-tenant enterprise
- Base de conhecimento de gestao (diferencial)
- Integracoes externas (ClickUp, ERPs)

---

## 8. Proximos Passos

1. [x] Pesquisar session isolation do NanoClaw (confirmado: grupo = NCI)
2. [x] Definir hierarquia empresa → NanoClaw process → NCI (usuario)
3. [x] Definir sistema de memoria com controle de acesso (3 niveis KB)
4. [x] Definir fluxo API Gateway → Lifecycle Manager → NCI
5. [x] Receber fluxo de decisao correto do Task Router (definido na secao 3.11)
6. [ ] Definir integracao com MCP
7. [ ] Entender e integrar base de conhecimento de gestao
8. [ ] Definir nome da plataforma
9. [ ] Detalhar Lifecycle Manager (hibernacao, sync, health check)
10. [ ] Definir autenticacao cross-channel
11. [ ] Criar PRD completo
12. [ ] Definir estrutura do repo separado
13. [ ] Definir quais agents genericos criar primeiro
14. [ ] Implementar MVP

---

*Documento atualizado na sessao claude/analyze-image-tr45K em 2026-03-22*
*Atualizado: NCI = grupo NanoClaw, session isolation, memoria multi-tenant, API Gateway + Lifecycle Manager*
