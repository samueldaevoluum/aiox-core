# Arquitetura MVP — Implementacao

> **Data:** 2026-03-22
> **Tenant:** Evoluum (single-tenant)
> **Primeiro processo:** Admissao (RH)
> **Status:** Em definicao

---

## 1. Como Funciona (resumo honesto)

O NanoClaw ja faz a maior parte do trabalho:
- Recebe mensagens do Telegram (handler nativo)
- Usa Claude Agent SDK pra processar (Claude e o LLM)
- CLAUDE.md define quem sao os agentes, regras, tom
- Claude decide sozinho qual agente responde e se precisa chamar tools
- Function calling: Claude chama tools que sao endpoints HTTP

**O que precisamos construir:**
- FastAPI como **Tool Server** (funcoes que os agentes chamam: Asana, Pipedrive, DB)
- FastAPI como **Webhook Receiver** (recebe eventos do Asana e Pipedrive)
- PostgreSQL pra dados persistentes
- Configuracao do NanoClaw (CLAUDE.md, agentes, tools)

**O que o NanoClaw ja faz e NAO precisamos reimplementar:**
- Telegram (recebe/envia mensagens)
- Routing (Claude decide baseado no CLAUDE.md)
- Message queue por grupo
- Memoria por grupo (CLAUDE.md)
- Container isolation por sessao

---

## 2. Arquitetura Real

```
Colaboradores Evoluum
      │
      │ Telegram Bot API
      ▼
┌─────────────────────────────────────────────────────────┐
│                    VPS (Docker Compose)                   │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │              NanoClaw (:3000)                       │  │
│  │                                                     │  │
│  │  Telegram handler (nativo)                          │  │
│  │  Claude Agent SDK → Claude API                      │  │
│  │  CLAUDE.md = system prompt com agentes + regras     │  │
│  │  Message queue por grupo                            │  │
│  │  Memoria por grupo                                  │  │
│  │                                                     │  │
│  │  Quando Claude precisa agir:                        │  │
│  │    function call → HTTP request → FastAPI            │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │ HTTP (function calling)         │
│                         ▼                                 │
│  ┌────────────────────────────────────────────────────┐  │
│  │              FastAPI (:8000)                        │  │
│  │                                                     │  │
│  │  TOOL SERVER (o que os agentes chamam):             │  │
│  │    /tools/* → executa e retorna resultado           │  │
│  │    Conecta com: Asana SDK, Pipedrive SDK, DB        │  │
│  │                                                     │  │
│  │  WEBHOOK RECEIVER (eventos externos):               │  │
│  │    /webhook/asana → evento chega, processa           │  │
│  │    /webhook/pipedrive → evento chega, processa       │  │
│  │    Pode notificar usuario via Telegram Bot API       │  │
│  │                                                     │  │
│  │  LOGGING:                                           │  │
│  │    Registra tool_calls, webhook_events no PostgreSQL │  │
│  └──────────────────────┬──────────────────────────────┘  │
│                         │                                 │
│                         ▼                                 │
│  ┌──────────────────────────────┐                        │
│  │  PostgreSQL (:5432)          │                        │
│  │                              │                        │
│  │  users, tool_calls,          │                        │
│  │  webhook_events, processes   │                        │
│  └──────────────────────────────┘                        │
│                                                          │
│  ┌──────────────────────────────┐                        │
│  │  Nginx (:443)                │ ← SSL, reverse proxy   │
│  └──────────────────────────────┘                        │
│                                                          │
└─────────────────────────────────────────────────────────┘
              │              │              │
              ▼              ▼              ▼
        Claude API      Asana API     Pipedrive API
        (Anthropic)     (REST)        (REST)
```

### Diferenca-chave vs versao anterior

| Antes (errado) | Agora (correto) |
|----------------|-----------------|
| FastAPI recebe Telegram e repassa pro NanoClaw | NanoClaw recebe Telegram direto (nativo) |
| IPC via arquivos JSON | HTTP normal (function calling) |
| Hybrid Router implementado por nos | Claude decide routing via CLAUDE.md |
| agent_configs no PostgreSQL | Agentes em YAML dentro do NanoClaw |

---

## 3. Fluxos

### Fluxo 1: Mensagem do Telegram (mais comum)

```
1. Colaborador manda: "Helena, como esta a admissao do Joao?"
2. Telegram → NanoClaw (handler nativo)
3. NanoClaw → Claude Agent SDK → Claude API
   System prompt (CLAUDE.md) contem:
     - Agentes disponiveis (Helena RH, Comercial)
     - Regras de cada agente
     - Tools disponiveis (asana, pipedrive, db, etc)
4. Claude interpreta: "usuario quer status de admissao, sou Helena"
5. Claude faz function call: get_process_status(type="admissao", name="Joao")
6. NanoClaw envia HTTP request: POST http://fastapi:8000/tools/get_process_status
7. FastAPI executa: consulta PostgreSQL + Asana API
8. FastAPI retorna resultado JSON
9. Claude recebe resultado e formula resposta no tom da Helena
10. NanoClaw envia resposta pro Telegram
```

### Fluxo 2: Webhook do Asana (bidirecional)

```
1. Alguem completa task no Asana (ex: "Documentos recebidos")
2. Asana envia webhook → FastAPI (/webhook/asana)
3. FastAPI:
   - Valida assinatura
   - Identifica processo relacionado (tabela processes)
   - Loga evento (tabela webhook_events)
   - Decide acao:
     a) Notificar usuario via Telegram Bot API → envia mensagem direto
     b) Apenas registrar → salva e fim
```

### Fluxo 3: Webhook do Pipedrive

```
1. Deal muda de stage no Pipedrive
2. Pipedrive envia webhook → FastAPI (/webhook/pipedrive)
3. FastAPI processa (mesmo padrao do Asana)
```

---

## 4. O que Cada Peca Faz

### NanoClaw (ja existe, configuramos)

| Item | Detalhe |
|------|---------|
| **Telegram** | Handler nativo — recebe e envia mensagens |
| **LLM** | Claude Agent SDK — envia mensagem + tools pro Claude API |
| **CLAUDE.md** | System prompt: define agentes, regras, tom, tools disponiveis |
| **Function calling** | Claude decide chamar tools → NanoClaw faz HTTP call pro FastAPI |
| **Memoria** | CLAUDE.md por grupo (persiste contexto da conversa) |
| **Message queue** | Fila por grupo, concurrency control |

**O que configuramos no NanoClaw:**
- CLAUDE.md com definicoes dos agentes (Helena, Comercial)
- Lista de tools disponiveis (endpoints do FastAPI)
- Token do Telegram Bot
- URL do FastAPI (para function calling)
- Chave da Anthropic API

### FastAPI (construimos)

| Item | Detalhe |
|------|---------|
| **Tool Server** | Endpoints HTTP que os agentes chamam via function calling |
| **Webhook Receiver** | Recebe eventos do Asana e Pipedrive |
| **Notificacoes** | Envia mensagens pro Telegram (via Bot API) quando webhook chega |
| **Logging** | Registra tool_calls e webhook_events no PostgreSQL |
| **DB Access** | SQLAlchemy + asyncpg para PostgreSQL |

### PostgreSQL (configuramos)

| Tabela | Para que |
|--------|---------|
| **users** | Colaboradores Evoluum (telegram_id, nome, departamento) |
| **tool_calls** | Audit log de todas as chamadas de tools |
| **webhook_events** | Eventos recebidos do Asana e Pipedrive |
| **processes** | Acompanhamento de processos (admissao, etc) |

---

## 5. Estrutura do Repositorio

```
plataforma/
├── docker-compose.yml
├── .env                         # Secrets
├── .env.example                 # Template
│
├── gateway/                     # FastAPI (Python) — o que CONSTRUIMOS
│   ├── Dockerfile
│   ├── pyproject.toml           # uv
│   ├── app/
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Settings (pydantic-settings)
│   │   ├── api/
│   │   │   ├── tools.py         # /tools/* — endpoints pro NanoClaw chamar
│   │   │   └── webhooks.py      # /webhook/asana, /webhook/pipedrive
│   │   ├── services/
│   │   │   ├── asana.py         # Asana SDK wrapper
│   │   │   ├── pipedrive.py     # Pipedrive SDK wrapper
│   │   │   └── telegram.py      # Enviar mensagens (notificacoes de webhooks)
│   │   └── models/
│   │       ├── user.py
│   │       ├── tool_call.py
│   │       ├── webhook_event.py
│   │       └── process.py
│   ├── migrations/              # Alembic
│   └── tests/
│
├── nanoclaw/                    # NanoClaw (Node.js) — CONFIGURAMOS
│   ├── Dockerfile
│   ├── config.yaml              # NanoClaw config (Telegram token, API keys)
│   ├── claude.md                # System prompt: agentes, regras, tools
│   └── agents/                  # Agent definitions (YAML)
│
├── db/
│   ├── init.sql                 # Schema inicial
│   └── seeds/
│
└── nginx/
    └── nginx.conf
```

---

## 6. Docker Compose

```yaml
version: '3.8'

services:
  nanoclaw:
    build: ./nanoclaw
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TOOL_SERVER_URL=http://gateway:8000
    volumes:
      - nanoclaw-data:/data

  gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://user:pass@db:5432/plataforma
      - ASANA_ACCESS_TOKEN=${ASANA_ACCESS_TOKEN}
      - PIPEDRIVE_API_TOKEN=${PIPEDRIVE_API_TOKEN}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
      - POSTGRES_DB=plataforma
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - nanoclaw
      - gateway

volumes:
  pg-data:
  nanoclaw-data:
```

---

## 7. Schema PostgreSQL (MVP)

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    telegram_user_id BIGINT UNIQUE,
    telegram_chat_id BIGINT,
    department TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE tool_calls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_telegram_id BIGINT,
    tool_name TEXT NOT NULL,
    input_params JSONB,
    output_result JSONB,
    status TEXT DEFAULT 'pending',
    duration_ms INTEGER,
    called_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL,
    event_type TEXT NOT NULL,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    action_taken TEXT,
    received_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE processes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    context JSONB NOT NULL DEFAULT '{}',
    steps JSONB NOT NULL DEFAULT '[]',
    external_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);
```

---

## 8. Tools (Function Calling)

**Mecanismo:**

```
Claude decide chamar um tool
    │
    ▼
Claude Agent SDK retorna: {tool: "nome", params: {...}}
    │
    ▼
NanoClaw faz: POST http://gateway:8000/tools/nome  body: {...}
    │
    ▼
FastAPI executa (Asana SDK, Pipedrive SDK, DB, etc)
    │
    ▼
Retorna JSON → NanoClaw → Claude continua → resposta final
```

**Tools serao definidos quando os processos forem detalhados.**

---

## 9. O que Construir (ordem)

### Fase 1 — Funcional minimo
Colaborador fala no Telegram, agente responde via Claude.

| # | O que | Tipo |
|---|-------|------|
| 1 | docker-compose.yml + Dockerfiles | Infra |
| 2 | Configurar NanoClaw (config.yaml, Telegram token, Claude API key) | Config |
| 3 | Escrever CLAUDE.md com agentes (Helena, Comercial) | Config |
| 4 | FastAPI base (main.py, config.py) | Codigo |
| 5 | Schema PostgreSQL + Alembic | Codigo |
| 6 | Testar: mandar mensagem no Telegram, receber resposta | Teste |

### Fase 2 — Integracoes
Agentes chamam Asana e Pipedrive. Eventos externos chegam.

| # | O que | Tipo |
|---|-------|------|
| 7 | Definir processos reais (admissao, comercial) com o fundador | Definicao |
| 8 | Implementar tools no FastAPI conforme processos | Codigo |
| 9 | Registrar tools no NanoClaw (CLAUDE.md) | Config |
| 10 | Webhooks Asana + Pipedrive no FastAPI | Codigo |
| 11 | Testar fluxo completo bidirecional | Teste |

### Fase 3 — Producao

| # | O que | Tipo |
|---|-------|------|
| 12 | Nginx + SSL (Let's Encrypt) | Infra |
| 13 | Deploy na VPS | Infra |
| 14 | Configurar webhook do Telegram pra URL publica | Config |
| 15 | Configurar webhooks Asana/Pipedrive pra URL publica | Config |

---

## 10. Resumo: o que voce precisa implementar

**Codigo Python (FastAPI):**
- `main.py` — app FastAPI
- `config.py` — settings
- `api/tools.py` — endpoints que NanoClaw chama (a definir com processos)
- `api/webhooks.py` — recebe eventos Asana/Pipedrive
- `services/asana.py` — wrapper SDK
- `services/pipedrive.py` — wrapper SDK
- `services/telegram.py` — enviar notificacoes
- `models/*.py` — SQLAlchemy models
- Alembic migrations

**Configuracao NanoClaw:**
- `config.yaml` — tokens, URLs
- `claude.md` — system prompt com agentes e tools
- `agents/*.yaml` — definicoes de agentes (portar os que ja tem)

**Infra:**
- `docker-compose.yml`
- Dockerfiles (gateway + nanoclaw)
- `nginx.conf`
- `.env`

---

*MVP Architecture — Evoluum — 2026-03-22*
*Sessao: claude/analyze-image-tr45K*
