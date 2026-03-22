# MVP — Definicao

> **Data:** 2026-03-22
> **Cliente:** Evoluum (empresa do fundador)
> **Objetivo:** Plataforma funcionando internamente com RH e Comercial

---

## Escopo do MVP

### O que entra

| Item | Detalhe |
|------|---------|
| **Tenant** | Evoluum (single-tenant) |
| **Canal** | Telegram (1 bot: @evoluum_bot ou similar) |
| **Departamentos** | RH + Comercial |
| **Agentes** | 1 agente RH + 1 agente Comercial |
| **Integracoes** | Asana (bidirecional) + Pipedrive (bidirecional) |
| **LLM** | Claude (API) — Ollama como evolucao futura |
| **Banco** | PostgreSQL + pgvector |
| **Deploy** | VPS do fundador (Docker Compose) |
| **Backend** | Python/FastAPI |

### O que NAO entra no MVP

| Item | Motivo |
|------|--------|
| Multi-tenancy | Single-tenant (so Evoluum) |
| Web UI Admin | Configuracao via YAML/banco direto |
| WebChat / WhatsApp | Telegram e suficiente |
| Clones (DNA Mental) | Agentes funcionais primeiro |
| Workflow Engine completo | Processos simples via integracoes |
| Knowledge Base (RAG) | Fase 2 |
| MCP | Function Calling direto no FastAPI |
| NCI com Docker por usuario | Simplificar — processo unico |
| Chat-only processes | Fundador quer, mas e fase posterior |

---

## Arquitetura MVP (Simplificada)

```
Colaborador Evoluum
      │
      │ Telegram
      ▼
┌─────────────────────────────────────────────┐
│            FastAPI Gateway                   │
│                                              │
│  Auth simples (user_id do Telegram)          │
│  Webhook receiver (Telegram, Asana, Pipe)    │
│  Routing para NanoClaw                       │
│                                              │
│  ┌────────────────────────────────────────┐  │
│  │         INTEGRACOES (Worker+API)       │  │
│  │  Asana SDK  |  Pipedrive SDK           │  │
│  └────────────────────────────────────────┘  │
│                                              │
└──────────────────┬───────────────────────────┘
                   │ IPC (arquivos JSON)
                   ▼
┌─────────────────────────────────────────────┐
│          NanoClaw (Orchestrator)             │
│                                              │
│  Hybrid Router (4 niveis)                    │
│  Task Router (decision tree)                 │
│  Message queue por grupo                     │
│  Memoria por grupo (CLAUDE.md)               │
│                                              │
│  ┌────────────┐  ┌────────────────────────┐ │
│  │ Agente RH  │  │ Agente Comercial       │ │
│  │ (Admissao) │  │ (a definir)            │ │
│  └────────────┘  └────────────────────────┘ │
│                                              │
│  Executores: Worker | Worker+API | Agente   │
└──────────────────────────────────────────────┘

┌──────────┐  ┌──────────────┐
│PostgreSQL│  │ Claude API   │
│ :5432    │  │ (Anthropic)  │
└──────────┘  └──────────────┘
```

### Papel de cada peca no MVP

| Peca | Responsabilidade |
|------|-----------------|
| **FastAPI** | Gateway: auth, webhooks (Telegram/Asana/Pipedrive), integracoes externas |
| **NanoClaw** | Orquestrador: routing, executores, memoria, agentes, message queue |
| **PostgreSQL** | Dados persistentes (substituindo SQLite do NanoClaw) |
| **Claude API** | LLM para agentes (NanoClaw ja suporta modelos externos) |

### Simplificacoes para MVP

| Arquitetura completa | MVP |
|---------------------|-----|
| 1 NanoClaw Process por empresa | 1 NanoClaw Process (Evoluum) |
| 1 NCI (container Docker) por usuario | Simplificado: grupos NanoClaw sem Docker por user |
| Lifecycle Manager (spawn/hibernate) | Nao necessario (single-tenant) |
| Multi-tenant com RLS | Single-tenant, sem RLS |
| Web UI Admin (Next.js) | Configuracao via YAML/banco |

---

## Integracoes Bidirecionais

### Asana (RH)

| Direcao | Exemplo |
|---------|---------|
| **Plataforma → Asana** | Agente cria task, atualiza status, adiciona comentario |
| **Asana → Plataforma** | Webhook: task concluida, comentario com @agente, status mudou |

### Pipedrive (Comercial)

| Direcao | Exemplo |
|---------|---------|
| **Plataforma → Pipedrive** | Agente cria deal, atualiza stage, adiciona nota |
| **Pipedrive → Plataforma** | Webhook: deal moveu de stage, atividade criada, deal ganho/perdido |

---

## Decisoes Pendentes do MVP

### D1. Processos do RH — DECIDIDO
- **Decisao:** Processo de Admissao (primeiro)
- **Status:** Agentes ja desenvolvidos pelo fundador
- **Integracao:** Asana (bidirecional)
- **Pendente:** Detalhar os steps do processo de admissao e como integra com Asana

### D2. Processos do Comercial — PENDENTE
- **Status:** Ainda nao definido
- **Integracao:** Pipedrive (bidirecional)
- **Acao:** Definir em sessao futura

### D3. Quantos colaboradores vao usar no MVP?
- **Impacto:** Define se precisa de fila de mensagens, rate limiting, etc.

### D4. Bot Telegram
- **Pergunta:** Um bot unico (@evoluum_bot) ou um por departamento?
- **Sugestao MVP:** Um bot unico com routing por agente

### D5. Modelo LLM — DECIDIDO
- **Decisao:** Claude (API Anthropic) no inicio
- **Futuro:** Migrar para Ollama on-premise quando quiser reduzir custos
- **Impacto:** Simplifica MVP (sem gerenciar Ollama), mas tem custo por token

---

## Stack MVP

| Componente | Tecnologia |
|------------|-----------|
| Orquestrador | NanoClaw (Node.js, ~3900 LOC) |
| Gateway | Python 3.12+ / FastAPI |
| ORM | SQLAlchemy 2.0 + asyncpg |
| Migrations | Alembic |
| Banco | PostgreSQL 16 |
| LLM | Claude API (anthropic SDK) |
| Telegram | aiogram 3.x |
| Asana | asana-python (SDK oficial) |
| Pipedrive | pipedrive-python (ou requests direto) |
| Testes | pytest + pytest-asyncio + httpx |
| Package Manager | uv |
| Deploy | Docker Compose |
| Proxy | Nginx (SSL/TLS) |

---

*MVP Definition — Evoluum — 2026-03-22*
*Sessao: claude/analyze-image-tr45K*
