# MVP — Passo a Passo

> **Objetivo:** Colaboradores da Evoluum conversam com agentes no Telegram.
> Agentes usam Claude API e podem agir no Asana/Pipedrive.

---

## FASE 1 — Conversa funcionando no Telegram

Ao final desta fase: voce manda mensagem no Telegram, o agente responde via Claude.

---

### Passo 1: Criar o repositorio

Criar um repo novo (separado do AIOX) com esta estrutura:

```
plataforma/
├── docker-compose.yml
├── .env
├── .env.example
├── gateway/
│   ├── Dockerfile
│   └── (vazio por enquanto)
├── nanoclaw/
│   ├── Dockerfile
│   └── (config vem no passo 3)
├── db/
│   └── init.sql
└── nginx/
    └── nginx.conf
```

**O que fazer:**
- Criar repo no GitHub
- Criar as pastas
- Criar `.env.example` com as variaveis necessarias:

```bash
# .env.example
ANTHROPIC_API_KEY=sk-ant-...
TELEGRAM_BOT_TOKEN=123456:ABC...
ASANA_ACCESS_TOKEN=           # fase 2
PIPEDRIVE_API_TOKEN=          # fase 2
POSTGRES_USER=plataforma
POSTGRES_PASSWORD=senhasegura
POSTGRES_DB=plataforma
```

---

### Passo 2: Criar o Bot no Telegram

**O que fazer:**
1. Abrir o Telegram e falar com @BotFather
2. Enviar `/newbot`
3. Escolher nome (ex: "Evoluum Assistente")
4. Escolher username (ex: `@evoluum_bot`)
5. Copiar o token gerado
6. Colocar o token no `.env` como `TELEGRAM_BOT_TOKEN`

**Resultado:** Voce tem um bot criado, mas ele ainda nao responde nada.

---

### Passo 3: Configurar o NanoClaw

O NanoClaw e um projeto Node.js existente. Voce precisa:

1. Clonar o NanoClaw (github.com/qwibitai/nanoclaw)
2. Colocar dentro da pasta `nanoclaw/` do seu repo (ou referenciar como submódulo)
3. Configurar:

**nanoclaw/config.yaml** (ou o formato que o NanoClaw usa):
```yaml
telegram:
  token: ${TELEGRAM_BOT_TOKEN}

llm:
  provider: anthropic
  api_key: ${ANTHROPIC_API_KEY}
  model: claude-sonnet-4-20250514

tool_server:
  url: http://gateway:8000
```

**nanoclaw/claude.md** — Este e o system prompt que define tudo:
```markdown
# Assistente Evoluum

Voce e o assistente digital da Evoluum. Voce tem multiplas personas
que ativa conforme o contexto da conversa.

## Agentes Disponiveis

### Helena — Assistente de RH
- Ativa quando: o usuario fala sobre RH, admissao, ferias, beneficios,
  contratacao, documentos de funcionarios
- Tom: acolhedor, profissional, preciso
- Regras:
  - Nunca inventar informacoes
  - Confirmar dados criticos antes de agir
  - Escalar para humano quando nao souber

### Comercial — Assistente Comercial
- Ativa quando: o usuario fala sobre vendas, clientes, pipeline,
  deals, propostas, follow-up
- Tom: direto, proativo, orientado a resultados
- Regras:
  - Sempre referenciar dados reais (Pipedrive)
  - Sugerir proximos passos

### Concierge — Fallback
- Ativa quando: nenhum agente especifico se aplica
- Tom: amigavel, prestativo
- Responde perguntas gerais e direciona para o agente certo

## Regras Gerais
- Responda sempre em portugues brasileiro
- Seja conciso
- Nao invente dados — use tools para consultar
- Se nao souber, diga que nao sabe

## Tools Disponiveis
(serao adicionados na Fase 2)
```

**nanoclaw/Dockerfile:**
```dockerfile
FROM node:20-slim
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "index.js"]
```

**Resultado:** NanoClaw configurado com Telegram + Claude + agentes definidos no CLAUDE.md.

---

### Passo 4: Criar o docker-compose.yml

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
      - TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
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

### Passo 5: Criar o FastAPI base

Mesmo que na Fase 1 o FastAPI nao tenha tools ainda, ele precisa existir
porque o NanoClaw depende dele (tool_server_url).

**gateway/pyproject.toml:**
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

**gateway/app/main.py:**
```python
from fastapi import FastAPI

app = FastAPI(title="Plataforma Gateway", version="0.1.0")


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/tools/{tool_name}")
async def execute_tool(tool_name: str, params: dict):
    """Endpoint generico que o NanoClaw chama via function calling.
    Tools serao implementados na Fase 2."""
    return {"error": f"Tool '{tool_name}' nao implementado ainda"}
```

**gateway/app/config.py:**
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

**gateway/Dockerfile:**
```dockerfile
FROM python:3.12-slim
WORKDIR /app

RUN pip install uv
COPY pyproject.toml .
RUN uv pip install --system -r pyproject.toml

COPY app/ app/
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

---

### Passo 6: Schema PostgreSQL

**db/init.sql:**
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

### Passo 7: Testar Fase 1

```bash
# Na sua maquina ou VPS
cd plataforma

# Configurar secrets
cp .env.example .env
# Editar .env com tokens reais

# Subir tudo
docker compose up -d

# Verificar logs
docker compose logs nanoclaw
docker compose logs gateway

# Testar
# 1. Abrir Telegram
# 2. Buscar @evoluum_bot
# 3. Mandar: "Oi"
# 4. Deve responder como Concierge
# 5. Mandar: "Helena, me ajuda com uma admissao"
# 6. Deve responder como Helena (tom acolhedor)
```

**Se funcionar:** Fase 1 concluida. Voce tem agentes conversando no Telegram via Claude.

---

## FASE 2 — Integracoes Asana e Pipedrive

Ao final desta fase: agentes consultam e atuam no Asana/Pipedrive.

---

### Passo 8: Definir processos reais

**Antes de codar qualquer tool, voce precisa definir:**

Para RH (Admissao):
- Quais steps do processo de admissao existem hoje?
- Quais desses steps estao no Asana?
- O que o agente precisa fazer no Asana? (criar task? atualizar? consultar?)
- O que deve acontecer quando alguem completa uma task no Asana?

Para Comercial:
- Quais operacoes no Pipedrive o agente precisa fazer?
- O que deve acontecer quando um deal muda de stage?

**Resultado:** Lista de tools necessarios (ex: "criar_task_asana", "consultar_deals_pipedrive").

---

### Passo 9: Implementar tools no FastAPI

Para cada operacao definida no Passo 8, criar um endpoint em `gateway/app/api/tools.py`.

Exemplo (generico — o real depende dos seus processos):

```python
@app.post("/tools/asana_create_task")
async def asana_create_task(params: dict):
    # Usa Asana SDK pra criar task
    result = await asana_service.create_task(
        project=params["project"],
        name=params["name"],
        assignee=params.get("assignee"),
    )
    # Loga no banco
    await log_tool_call("asana_create_task", params, result)
    return result
```

---

### Passo 10: Registrar tools no CLAUDE.md

Adicionar a secao "Tools Disponiveis" no `claude.md` do NanoClaw:

```markdown
## Tools Disponiveis

### asana_create_task
Cria uma task no Asana.
Parametros: project (string), name (string), assignee (string, opcional)

### pipedrive_get_deals
Lista deals do pipeline.
Parametros: stage (string, opcional)

(etc — conforme definido no Passo 8)
```

O Claude Agent SDK transforma essas descricoes em function calling definitions.

---

### Passo 11: Implementar webhooks

**gateway/app/api/webhooks.py:**

```python
@app.post("/webhook/asana")
async def asana_webhook(request: Request):
    payload = await request.json()
    # Valida assinatura
    # Loga evento
    # Decide acao (notificar usuario? atualizar processo?)
    return {"ok": True}

@app.post("/webhook/pipedrive")
async def pipedrive_webhook(request: Request):
    payload = await request.json()
    # Mesmo padrao
    return {"ok": True}
```

---

### Passo 12: Testar Fase 2

```bash
# Mandar no Telegram:
# "Helena, cria uma task no Asana pra coletar documentos do novo funcionario"
# Helena deve:
#   1. Entender o pedido
#   2. Chamar o tool asana_create_task
#   3. Confirmar que criou
```

---

## FASE 3 — Producao (VPS)

---

### Passo 13: SSL + Nginx

**nginx/nginx.conf:**
```nginx
server {
    listen 80;
    server_name seudominio.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name seudominio.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location /webhook/ {
        proxy_pass http://gateway:8000;
    }

    location /tools/ {
        proxy_pass http://gateway:8000;
    }

    location /health {
        proxy_pass http://gateway:8000;
    }
}
```

Adicionar nginx ao docker-compose (descomentando o service).

---

### Passo 14: Deploy na VPS

```bash
# 1. Na VPS
ssh user@sua-vps
git clone <repo> plataforma
cd plataforma

# 2. Secrets
cp .env.example .env
nano .env  # colocar tokens reais

# 3. SSL
sudo apt install certbot
sudo certbot certonly --standalone -d seudominio.com
# Copiar certs pra ./certs/

# 4. Subir
docker compose up -d

# 5. Verificar
docker compose logs -f
```

---

### Passo 15: Configurar webhooks publicos

```bash
# Telegram — apontar webhook do bot pra sua URL
curl "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=https://seudominio.com/webhook/telegram"

# Asana — configurar no dashboard do Asana
# URL: https://seudominio.com/webhook/asana

# Pipedrive — configurar no dashboard do Pipedrive
# URL: https://seudominio.com/webhook/pipedrive
```

**Nota:** Se NanoClaw usa polling (nao webhook) pro Telegram, o passo do setWebhook nao se aplica — o NanoClaw ja busca mensagens sozinho.

---

## Checklist Final

### Fase 1 (conversa funciona)
- [ ] Repo criado
- [ ] Bot Telegram criado (@BotFather)
- [ ] NanoClaw configurado (config + CLAUDE.md)
- [ ] FastAPI base rodando
- [ ] PostgreSQL com schema
- [ ] docker-compose sobe tudo
- [ ] Teste: mando mensagem, recebo resposta

### Fase 2 (integracoes)
- [ ] Processos definidos (quais tools precisa)
- [ ] Tools implementados no FastAPI
- [ ] Tools registrados no CLAUDE.md
- [ ] Webhooks Asana/Pipedrive implementados
- [ ] Teste: agente cria task no Asana via chat

### Fase 3 (producao)
- [ ] VPS configurada
- [ ] SSL + Nginx
- [ ] Deploy
- [ ] Webhooks publicos configurados
- [ ] Teste: funciona da VPS com dominio real

---

*Passo a Passo MVP — Evoluum — 2026-03-22*
