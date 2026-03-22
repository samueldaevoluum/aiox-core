# Arquitetura MVP — Implementacao

> **Data:** 2026-03-22
> **Tenant:** Evoluum (single-tenant)
> **Primeiro processo:** Admissao (RH)
> **Status:** Pronto para implementar

---

## 1. Visao Geral

```
                         Colaboradores Evoluum
                                │
                                │ Telegram
                                ▼
┌──────────────────────────────────────────────────────────────┐
│                     VPS (Docker Compose)                      │
│                                                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              FastAPI Gateway (:8000)                    │  │
│  │                                                        │  │
│  │  /webhook/telegram    ← Telegram Bot API               │  │
│  │  /webhook/asana       ← Asana events                   │  │
│  │  /webhook/pipedrive   ← Pipedrive events               │  │
│  │                                                        │  │
│  │  Tool Server (funcoes que agentes chamam):              │  │
│  │    asana_create_task()                                  │  │
│  │    asana_update_task()                                  │  │
│  │    asana_get_tasks()                                    │  │
│  │    pipedrive_create_deal()                              │  │
│  │    pipedrive_update_deal()                              │  │
│  │    pipedrive_get_deals()                                │  │
│  │    db_query()                                           │  │
│  │    notify_human()                                       │  │
│  └───────────┬──────────────────────────┬─────────────────┘  │
│              │ IPC (JSON)               │ HTTP                │
│              ▼                          ▼                     │
│  ┌─────────────────────┐    ┌──────────────────┐             │
│  │   NanoClaw (:3000)  │    │  PostgreSQL      │             │
│  │                     │    │  (:5432)         │             │
│  │  Telegram handler   │    │                  │             │
│  │  Agent routing      │    │  usuarios        │             │
│  │  Message queue      │    │  conversas       │             │
│  │  CLAUDE.md memory   │    │  agent_configs   │             │
│  │  Claude Agent SDK   │    │  tool_calls      │             │
│  │                     │    │  webhook_events  │             │
│  │  Agentes:           │    │  workflows       │             │
│  │   - Helena (RH)     │    │                  │             │
│  │   - Comercial (TBD) │    │                  │             │
│  └─────────────────────┘    └──────────────────┘             │
│                                                               │
│  ┌─────────────────────┐                                     │
│  │   Nginx (:443)      │ ← SSL termination, reverse proxy   │
│  └─────────────────────┘                                     │
└──────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┼───────────┐
                    ▼           ▼           ▼
              Claude API    Asana API   Pipedrive API
              (Anthropic)   (REST)      (REST)
```

---

## 2. Dois Processos, Responsabilidades Claras

### FastAPI Gateway — o que FAZ

| Responsabilidade | Detalhe |
|-----------------|---------|
| Recebe webhooks | Telegram, Asana, Pipedrive |
| Auth simples | Identifica usuario pelo Telegram user_id |
| Tool Server | Funcoes Python que os agentes do NanoClaw chamam |
| Integracoes | SDK Asana, SDK Pipedrive, queries PostgreSQL |
| Webhook bidirecional | Asana/Pipedrive notifica → FastAPI processa → envia pro NanoClaw |
| Logging | Registra tool_calls, webhook_events no PostgreSQL |

### NanoClaw — o que FAZ

| Responsabilidade | Detalhe |
|-----------------|---------|
| Orquestra agentes | Helena (RH), Comercial (futuro) |
| Routing | Hybrid Router 4 niveis (name → pattern → LLM → concierge) |
| LLM | Claude Agent SDK (ja suporta Claude API nativamente) |
| Memoria | CLAUDE.md por grupo/canal |
| Message queue | Fila por grupo com concurrency control |
| Container isolation | Sessoes isoladas por grupo |
| Function calling | Agentes chamam tools expostos pelo FastAPI |

### Como conversam (IPC)

```
NanoClaw agente precisa criar task no Asana
    │
    ▼
NanoClaw faz function call: asana_create_task({project: "admissao", name: "..."})
    │
    ▼
FastAPI Tool Server recebe, valida, executa via Asana SDK
    │
    ▼
Retorna resultado pro NanoClaw → agente continua conversa
```

O NanoClaw ja tem suporte nativo a function calling via Claude Agent SDK.
Os tools sao registrados como funcoes que o agente pode chamar.
FastAPI expoe essas funcoes como endpoints HTTP que o NanoClaw consome.

---

## 3. Fluxo: Mensagem do Telegram

```
1. Colaborador manda mensagem no Telegram
2. Telegram Bot API envia webhook para FastAPI (/webhook/telegram)
3. FastAPI:
   - Identifica usuario (telegram user_id → db)
   - Loga mensagem
   - Encaminha para NanoClaw via IPC
4. NanoClaw:
   - Hybrid Router identifica agente (ex: "Helena" → RH)
   - Task Router identifica command (ex: "admissao" → processo)
   - Executor dispatch:
     - Worker? → executa script local
     - Worker+API? → chama FastAPI tool (ex: asana_create_task)
     - Agente? → Claude API gera resposta com function calling
   - Monta resposta com tom do agente
5. NanoClaw retorna resposta via IPC
6. FastAPI envia resposta pro Telegram
```

## 4. Fluxo: Webhook do Asana (bidirecional)

```
1. Alguem completa task no Asana
2. Asana envia webhook para FastAPI (/webhook/asana)
3. FastAPI:
   - Valida assinatura do webhook
   - Identifica qual processo/workflow essa task pertence
   - Loga evento no PostgreSQL
   - Determina acao:
     a) Notificar colaborador via Telegram? → envia mensagem
     b) Acionar proximo step do processo? → encaminha pro NanoClaw
     c) Apenas registrar? → salva e fim
```

---

## 5. Estrutura do Repositorio

```
plataforma/
├── docker-compose.yml           # Orquestra tudo
├── .env                         # Secrets (API keys, tokens)
│
├── gateway/                     # FastAPI (Python)
│   ├── Dockerfile
│   ├── pyproject.toml           # Dependencias (uv)
│   ├── app/
│   │   ├── main.py              # FastAPI app, startup
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   │
│   │   ├── api/                 # Rotas
│   │   │   ├── webhooks.py      # /webhook/telegram, /webhook/asana, /webhook/pipedrive
│   │   │   └── tools.py         # /tools/* (endpoints que NanoClaw chama)
│   │   │
│   │   ├── services/            # Logica de negocio
│   │   │   ├── asana.py         # Asana SDK wrapper
│   │   │   ├── pipedrive.py     # Pipedrive SDK wrapper
│   │   │   ├── telegram.py      # Telegram Bot API (enviar mensagens)
│   │   │   └── nanoclaw.py      # IPC com NanoClaw
│   │   │
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── user.py
│   │   │   ├── conversation.py
│   │   │   ├── tool_call.py
│   │   │   └── webhook_event.py
│   │   │
│   │   └── schemas/             # Pydantic schemas
│   │       ├── telegram.py
│   │       ├── asana.py
│   │       └── pipedrive.py
│   │
│   ├── migrations/              # Alembic
│   │   └── versions/
│   └── tests/
│
├── nanoclaw/                    # NanoClaw (Node.js)
│   ├── Dockerfile
│   ├── config.yaml              # NanoClaw config
│   ├── agents/                  # Definicoes de agentes
│   │   ├── helena-rh.yaml       # Agente RH (Admissao)
│   │   └── concierge.yaml       # Fallback
│   ├── tasks/                   # Task definitions
│   │   └── admissao/            # Processo de admissao
│   └── claude.md                # Instrucoes base para o NanoClaw
│
├── db/                          # Database
│   ├── init.sql                 # Schema inicial
│   └── seeds/                   # Dados iniciais (agentes, config)
│
└── nginx/                       # Reverse proxy
    └── nginx.conf               # SSL, proxy_pass
```

---

## 6. Docker Compose

```yaml
version: '3.8'

services:
  gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/plataforma
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - ASANA_ACCESS_TOKEN=${ASANA_ACCESS_TOKEN}
      - PIPEDRIVE_API_TOKEN=${PIPEDRIVE_API_TOKEN}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - NANOCLAW_IPC_DIR=/shared/ipc
    volumes:
      - ipc-data:/shared/ipc
    depends_on:
      - db
      - nanoclaw

  nanoclaw:
    build: ./nanoclaw
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GATEWAY_URL=http://gateway:8000
      - IPC_DIR=/shared/ipc
    volumes:
      - ipc-data:/shared/ipc
      - nanoclaw-data:/data

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=plataforma
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - gateway

volumes:
  pg-data:
  ipc-data:
  nanoclaw-data:
```

---

## 7. Schema PostgreSQL (MVP)

```sql
-- Usuarios (colaboradores Evoluum)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    telegram_chat_id BIGINT,
    department TEXT,                    -- 'rh', 'comercial', 'geral'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Conversas (historico)
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    agent_id TEXT NOT NULL,            -- 'rh', 'comercial', 'concierge'
    channel TEXT DEFAULT 'telegram',
    messages JSONB NOT NULL DEFAULT '[]',
    started_at TIMESTAMPTZ DEFAULT now(),
    ended_at TIMESTAMPTZ
);

-- Tool calls (audit log)
CREATE TABLE tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID REFERENCES conversations(id),
    user_id UUID REFERENCES users(id),
    tool_name TEXT NOT NULL,           -- 'asana_create_task', 'pipedrive_get_deals'
    input_params JSONB,
    output_result JSONB,
    status TEXT DEFAULT 'pending',     -- pending, success, error
    duration_ms INTEGER,
    called_at TIMESTAMPTZ DEFAULT now()
);

-- Webhook events (Asana, Pipedrive incoming)
CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,              -- 'asana', 'pipedrive'
    event_type TEXT NOT NULL,          -- 'task.completed', 'deal.updated'
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    action_taken TEXT,                 -- 'notified_user', 'triggered_step', 'logged_only'
    received_at TIMESTAMPTZ DEFAULT now()
);

-- Agent configs (fonte de verdade dos agentes)
CREATE TABLE agent_configs (
    id TEXT PRIMARY KEY,               -- 'rh', 'comercial', 'concierge'
    name TEXT NOT NULL,                -- 'Helena', 'Comercial'
    definition JSONB NOT NULL,         -- Agent definition completa (YAML convertido)
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Process tracking (acompanhamento de processos como admissao)
CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,                -- 'admissao', 'onboarding'
    status TEXT DEFAULT 'active',      -- active, completed, cancelled
    context JSONB NOT NULL DEFAULT '{}', -- dados do processo (nome candidato, etc)
    steps JSONB NOT NULL DEFAULT '[]',   -- steps com status individual
    started_by UUID REFERENCES users(id),
    asana_project_id TEXT,             -- ID do projeto no Asana (se aplicavel)
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

---

## 8. Tools que o NanoClaw Chama (Function Calling)

O NanoClaw configura tools como funcoes que o Claude Agent SDK pode chamar.
Cada tool e um endpoint HTTP no FastAPI.

### Tools MVP

```yaml
tools:
  # --- ASANA ---
  - name: asana_create_task
    description: "Cria uma task no Asana"
    parameters:
      project_name: string    # Nome do projeto
      task_name: string       # Nome da task
      assignee: string        # Email do responsavel (opcional)
      due_date: string        # Data limite (opcional)
      notes: string           # Descricao (opcional)

  - name: asana_update_task
    description: "Atualiza status ou campos de uma task no Asana"
    parameters:
      task_id: string
      status: string          # completed, in_progress
      notes: string           # Comentario adicional (opcional)

  - name: asana_get_tasks
    description: "Lista tasks de um projeto no Asana"
    parameters:
      project_name: string
      status: string          # all, incomplete, completed
      assignee: string        # Filtrar por responsavel (opcional)

  # --- PIPEDRIVE ---
  - name: pipedrive_create_deal
    description: "Cria um deal no Pipedrive"
    parameters:
      title: string
      contact_name: string
      value: number
      stage: string           # Nome do stage no pipeline

  - name: pipedrive_update_deal
    description: "Atualiza um deal no Pipedrive"
    parameters:
      deal_id: integer
      stage: string           # Mover para outro stage
      notes: string           # Adicionar nota

  - name: pipedrive_get_deals
    description: "Lista deals do pipeline"
    parameters:
      stage: string           # Filtrar por stage (opcional)
      owner: string           # Filtrar por dono (opcional)

  # --- INTERNOS ---
  - name: db_query
    description: "Consulta dados internos da empresa"
    parameters:
      query_type: string      # 'user_info', 'process_status'
      filters: object

  - name: notify_human
    description: "Escala para um humano real via Telegram"
    parameters:
      to_user: string         # Nome ou departamento
      message: string
      urgency: string         # normal, urgent

  - name: start_process
    description: "Inicia um processo de negocio (ex: admissao)"
    parameters:
      process_type: string    # 'admissao'
      context: object         # Dados iniciais (nome candidato, cargo, etc)
```

---

## 9. Agente Helena (RH — Admissao)

```yaml
agent:
  name: Helena
  id: rh
  title: Assistente de RH

persona:
  role: Especialista em Recursos Humanos
  style: Acolhedor, preciso, profissional
  identity: |
    Sou a Helena, assistente digital de RH da Evoluum.
    Ajudo com processos de admissao, acompanhamento de tarefas
    e orientacao sobre politicas da empresa.

core_principles:
  - Nunca inventar informacoes
  - Sempre confirmar dados criticos antes de agir
  - Escalar para humano em caso de duvida

commands:
  - name: iniciar-admissao
    type: agent
    match_patterns:
      - "admissao"
      - "novo funcionario"
      - "contratar"
      - "nova contratacao"
    tools: [start_process, asana_create_task, notify_human]

  - name: status-admissao
    type: worker_api
    match_patterns:
      - "como esta a admissao"
      - "status da admissao"
      - "andamento da contratacao"
    tools: [asana_get_tasks, db_query]

  - name: tarefas-pendentes
    type: worker_api
    match_patterns:
      - "tarefas pendentes"
      - "o que falta fazer"
      - "pendencias"
    tools: [asana_get_tasks]

dependencies:
  tools:
    - start_process
    - asana_create_task
    - asana_update_task
    - asana_get_tasks
    - db_query
    - notify_human

autoNanoClaw:
  version: '1.0'
  guardrails:
    maxTokensPerResponse: 1024
    escalateOnUncertainty: true
  model_preference: claude-sonnet
  temperature: 0.3
```

---

## 10. Deploy Steps

```bash
# 1. Na VPS
git clone <repo> plataforma
cd plataforma

# 2. Configurar secrets
cp .env.example .env
# Editar: TELEGRAM_BOT_TOKEN, ASANA_ACCESS_TOKEN, PIPEDRIVE_API_TOKEN, ANTHROPIC_API_KEY

# 3. SSL (Let's Encrypt)
certbot certonly --standalone -d seudominio.com

# 4. Subir
docker compose up -d

# 5. Rodar migrations
docker compose exec gateway alembic upgrade head

# 6. Configurar webhook do Telegram
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://seudominio.com/webhook/telegram"

# 7. Configurar webhooks Asana e Pipedrive via dashboard deles
# Asana: https://seudominio.com/webhook/asana
# Pipedrive: https://seudominio.com/webhook/pipedrive
```

---

## 11. O que Construir (ordem)

| # | O que | Quem faz | Dependencia |
|---|-------|----------|-------------|
| 1 | docker-compose.yml + Dockerfiles | Dev | Nenhuma |
| 2 | FastAPI base (main.py, config) | Dev | #1 |
| 3 | Schema PostgreSQL + Alembic | Dev | #2 |
| 4 | Webhook Telegram (/webhook/telegram) | Dev | #2 |
| 5 | Servico NanoClaw (IPC com FastAPI) | Dev | #1 |
| 6 | Agent Helena (YAML + config) | Dev | #5 |
| 7 | Tools Asana (create/update/get) | Dev | #2 |
| 8 | Tools Pipedrive (create/update/get) | Dev | #2 |
| 9 | Webhook Asana (/webhook/asana) | Dev | #7 |
| 10 | Webhook Pipedrive (/webhook/pipedrive) | Dev | #8 |
| 11 | Processo de Admissao (steps + Asana) | Dev | #6, #7 |
| 12 | Nginx + SSL | DevOps | #2 |
| 13 | Deploy VPS | DevOps | Tudo |

### Fase 1 (funcional minimo): #1-6
Colaborador fala com Helena no Telegram, Helena responde via Claude.

### Fase 2 (integracoes): #7-10
Helena cria/consulta tasks no Asana, deals no Pipedrive.

### Fase 3 (processo): #11
Processo de admissao completo com steps no Asana.

### Fase 4 (producao): #12-13
SSL, dominio, deploy na VPS.

---

*MVP Architecture — Implementacao — Evoluum*
*2026-03-22 | Sessao: claude/analyze-image-tr45K*
