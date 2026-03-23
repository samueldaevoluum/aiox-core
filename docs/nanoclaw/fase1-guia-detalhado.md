# Fase 1 — Guia Detalhado de Implementacao

> **Data:** 2026-03-23
> **Objetivo:** Colaboradores da Evoluum conversam com agentes no Telegram via Claude.
> **Resultado final:** Manda mensagem no Telegram, recebe resposta inteligente.
> **Nenhuma integracao com Asana/Pipedrive ainda. So conversa.**

---

## Visao Geral

A Fase 1 e o minimo funcional: um bot no Telegram que conversa usando Claude,
com agentes definidos no CLAUDE.md. O agente sabe que e da Evoluum, sabe quem
e Helena (RH) e quem e o Comercial, e conversa no tom certo.

### O que acontece no final

Voce abre o Telegram, manda uma mensagem pro `@evoluum_bot`, e recebe uma
resposta inteligente do Claude. O agente sabe que e da Evoluum, sabe quem e
Helena (RH) e quem e o Comercial, e conversa no tom certo.

---

## Passo 1: Criar o Bot no Telegram

Feito no proprio Telegram, leva 2 minutos.

1. Abre o Telegram e busca `@BotFather`
2. Envia `/newbot`
3. BotFather pergunta o nome — digite algo como `Evoluum Assistente`
4. BotFather pergunta o username — precisa terminar com `bot`, ex: `evoluum_bot`
5. BotFather te da um token tipo: `7123456789:AAH3kj2h4kj2h4kj2h4`
6. Guarda esse token — e o `TELEGRAM_BOT_TOKEN`

**O bot ja existe, mas nao faz nada ainda. So aparece no Telegram.**

---

## Passo 2: Conseguir a API key do Claude

1. Vai em console.anthropic.com
2. Cria uma API key
3. Guarda — e o `ANTHROPIC_API_KEY`

---

## Passo 3: Clonar o NanoClaw e entender a estrutura

O NanoClaw e o projeto que ja existe. Voce precisa entender como ele funciona
pra configurar.

```bash
git clone https://github.com/qwibitai/nanoclaw.git
cd nanoclaw
```

### O que voce vai encontrar

- **~3.900 linhas de codigo, ~15 arquivos**
- **Runtime Node.js** com Claude Agent SDK
- **Canais nativos**: WhatsApp, Telegram, Slack, Discord, Gmail
- **Cada sessao** roda isolada (container Docker por grupo)
- **CLAUDE.md** e o system prompt que define o comportamento
- **Scheduled jobs**, agent swarms, web access

### O que voce precisa entender

- Onde fica a config (tokens, modelo LLM)
- Como ele recebe mensagens do Telegram (polling ou webhook)
- Onde fica o CLAUDE.md
- Como registrar tools (function calling)

**Isso e essencial.** Sem entender como o NanoClaw se configura, nao da pra
avancar. O codigo e pequeno (~15 arquivos), da pra ler tudo.

**ESTE E O PASSO MAIS IMPORTANTE DA FASE 1.**

---

## Passo 4: Escrever o CLAUDE.md

O CLAUDE.md e **o coracao do sistema**. E o system prompt que o Claude recebe.
Tudo que os agentes sabem, como se comportam, quais regras seguem — esta aqui.

Os agentes ja foram desenvolvidos pelo fundador. O que precisa fazer e adaptar
pro formato que o NanoClaw espera.

### Estrutura do CLAUDE.md

**1. Contexto da empresa:**
```markdown
Voce e o assistente digital da Evoluum.
(descricao da empresa, o que faz, cultura)
```

**2. Agentes disponiveis — quem sao, quando ativar, como se comportam:**
```markdown
## Helena — RH
- Quando ativar: (palavras-chave, contextos)
- Tom: (como fala)
- Regras: (o que pode e nao pode)

## Comercial
- Quando ativar: ...
- Tom: ...
- Regras: ...
```

**3. Regras gerais:**
```markdown
- Responder em portugues
- Nao inventar dados
- Se nao souber, dizer que nao sabe
```

**4. Tools disponiveis** (vazio na Fase 1, preenchido na Fase 2):
```markdown
## Tools
(nenhum disponivel ainda)
```

### Como o routing funciona

O Claude le esse CLAUDE.md e **decide sozinho** qual agente usar:
- Se o usuario fala "Helena, me ajuda com admissao" → Claude ativa persona Helena, tom acolhedor
- Se fala "como esta o pipeline" → Claude ativa persona Comercial
- Se fala "oi" → Claude responde como Concierge (fallback)

**Nao precisa implementar um router.** O Claude faz isso naturalmente pelo prompt.

**ESTE E O SEGUNDO PASSO MAIS IMPORTANTE DA FASE 1.**

---

## Passo 5: Criar o FastAPI base

Na Fase 1, o FastAPI e bem simples. Ele precisa existir porque o NanoClaw
aponta pra ele como `tool_server_url`, mas ainda nao tem tools implementados.

### gateway/app/main.py

```python
from fastapi import FastAPI

app = FastAPI(title="Plataforma Gateway", version="0.1.0")

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/tools/{tool_name}")
async def execute_tool(tool_name: str, params: dict):
    return {"error": f"Tool '{tool_name}' nao implementado ainda"}
```

### gateway/app/config.py

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str
    telegram_bot_token: str = ""
    asana_access_token: str = ""
    pipedrive_api_token: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
```

### gateway/Dockerfile

```dockerfile
FROM python:3.12-slim
WORKDIR /app
RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml
COPY app/ app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### gateway/pyproject.toml

```toml
[project]
name = "plataforma-gateway"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115",
    "uvicorn>=0.34",
    "sqlalchemy>=2.0",
    "asyncpg>=0.30",
    "alembic>=1.14",
    "pydantic-settings>=2.0",
    "httpx>=0.28",
]
```

So isso. O FastAPI so precisa estar de pe, respondendo no `/health`.

---

## Passo 6: Criar o PostgreSQL schema

As 4 tabelas ficam vazias na Fase 1, mas ja estao prontas pra Fase 2.

### db/init.sql

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

## Passo 7: docker-compose.yml

Junta tudo — 3 containers: NanoClaw, FastAPI, PostgreSQL.

```yaml
version: '3.8'

services:
  nanoclaw:
    build: ./nanoclaw
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
      - TOOL_SERVER_URL=http://gateway:8000
    depends_on:
      - gateway

  gateway:
    build: ./gateway
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql+asyncpg://${POSTGRES_USER}:${POSTGRES_PASSWORD}@db:5432/${POSTGRES_DB}
    depends_on:
      - db

  db:
    image: postgres:16
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - pg-data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql

volumes:
  pg-data:
```

**Nota:** Nginx nao entra ainda. Fase 1 roda local ou na VPS sem SSL.

---

## Passo 8: Subir e testar

```bash
cd plataforma
cp .env.example .env
# Editar .env com tokens reais

docker compose up -d
docker compose logs -f nanoclaw   # ver se conectou no Telegram
docker compose logs -f gateway     # ver se FastAPI ta de pe
```

### Testes manuais

| # | Teste | Resultado esperado |
|---|-------|-------------------|
| 1 | Abrir Telegram, buscar @evoluum_bot | Bot aparece |
| 2 | Mandar: "Oi" | Responde como Concierge (amigavel, generico) |
| 3 | Mandar: "Helena, me ajuda com uma duvida de RH" | Responde como Helena (tom acolhedor, profissional) |
| 4 | Mandar: "como esta o pipeline de vendas?" | Responde como Comercial (sem dados reais — sem Pipedrive ainda) |

**Se funcionar:** Fase 1 concluida.

---

## Troubleshooting

| Problema | Causa provavel | Solucao |
|----------|---------------|---------|
| Bot nao responde | Token errado ou NanoClaw nao iniciou | Checar logs do NanoClaw, verificar token |
| Claude nao responde | API key errada ou sem credito | Verificar ANTHROPIC_API_KEY, checar console.anthropic.com |
| Resposta generica demais | CLAUDE.md mal escrito | Melhorar descricoes dos agentes, testar iterativamente |
| FastAPI nao sobe | Erro no Dockerfile ou dependencias | Checar logs do gateway |
| PostgreSQL nao conecta | Credenciais erradas no .env | Verificar POSTGRES_USER/PASSWORD/DB |

---

## Resumo: onde esta o trabalho real

| Passo | Esforco | Tipo |
|-------|---------|------|
| 1. Criar bot no Telegram | 2 min | Config |
| 2. API key do Claude | 1 min | Config |
| **3. Clonar e estudar o NanoClaw** | **Alto** | **Pesquisa — o mais importante** |
| **4. Escrever CLAUDE.md com agentes** | **Alto** | **Criativo — o segundo mais importante** |
| 5. FastAPI esqueleto | Baixo | Boilerplate |
| 6. Schema do banco | Baixo | Boilerplate |
| 7. docker-compose | Baixo | Config |
| 8. Testar | Medio | Validacao |

**O trabalho real esta nos passos 3 e 4.** Entender o NanoClaw e escrever um
bom CLAUDE.md. O resto e configuracao e boilerplate.

---

## Decisoes da Fase 1 (MVP)

| Decisao | Valor | Motivo |
|---------|-------|--------|
| LLM | Claude API (Anthropic) | NanoClaw usa Claude Agent SDK nativamente. Ollama e evolucao futura |
| Canal | Telegram (1 bot: @evoluum_bot) | NanoClaw suporta nativamente |
| Routing | Claude decide via CLAUDE.md | Nao precisa implementar router — Claude faz pelo prompt |
| Tools | Nenhum (Fase 1) | FastAPI existe mas so retorna "nao implementado" |
| Banco | PostgreSQL com 4 tabelas vazias | Prontas pra Fase 2 |
| Deploy | Docker Compose local | Sem SSL, sem Nginx |

---

*Fase 1 Guia Detalhado — Evoluum — 2026-03-23*
*Sessao: claude/analyze-image-tr45K*
