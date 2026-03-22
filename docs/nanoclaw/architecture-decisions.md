# NanoClaw — Architecture Decisions & Session Log

**Data:** 2026-03-22
**Status:** Em discussão (pré-PRD)
**Sessão:** claude/analyze-image-tr45K

---

## 1. O que é o NanoClaw

Plataforma de agentes de IA para negócios. Cada empresa (cliente) recebe uma instância com agentes personalizados (RH, Financeiro, Marketing, etc.) que atendem funcionários via canais de comunicação (Telegram, Web Chat, WhatsApp).

**Diferença fundamental do AIOX:**
- AIOX = ferramenta de desenvolvimento de software (agentes para devs)
- NanoClaw = produto para empresas (agentes para funcionários)

---

## 2. Decisões Confirmadas

### 2.1 Repositório
- **Decisão:** Repo separado do AIOX
- **Motivo:** Não misturar complexidades. Deploy independente. Stack própria.
- **AIOX não será alterado.** Apenas serve como inspiração e ferramenta de criação inicial.

### 2.2 Banco de Dados
- **Decisão:** PostgreSQL
- **Motivo:** LISTEN/NOTIFY nativo para hot-reload, pgvector para RAG, RLS para multi-tenancy
- **Não usar Supabase** (PostgreSQL puro)

### 2.3 Canal de Comunicação (MVP)
- **Decisão:** Telegram (primeiro canal)
- **Motivo:** API simples, bots gratuitos, boa experiência mobile
- **Futuro:** Web Chat, WhatsApp Business API

### 2.4 Bot Telegram
- **Decisão:** Um bot por cliente (Opção A)
- **Motivo:** Cada cliente tem seu @empresaX_bot com token próprio
- **Não usar bot único** com roteamento

### 2.5 LLM
- **Decisão:** Ollama com modelo menor/rápido primeiro (8B)
- **Motivo:** Economia de recursos, velocidade
- **Futuro:** Modelo maior (70B) como opção "smart"

### 2.6 Multi-tenancy
- **MVP:** Uma instância por cliente (Opção A — simples)
- **Futuro:** Multi-tenant com schemas separados + RLS (Opção B)
- **Motivo:** MVP testa na empresa do fundador, sem necessidade de multi-tenant ainda

### 2.7 Knowledge Base (MVP)
- **Decisão:** Fonte 1 — Documentos uploadados (PDF, DOCX)
- **Fluxo:** Admin faz upload → sistema processa → chunks → embeddings → PostgreSQL (pgvector) → Agent consulta via RAG
- **Futuro:** Fonte 3 — Integrações com APIs externas (ERP, sistemas)

### 2.8 Web UI Admin
- **Decisão:** Next.js (React)
- **Funcionalidades:** Editar agentes, editar usuários, editar permissões, ver logs/conversas

### 2.9 Deploy
- **Decisão:** VPS com Docker (docker-compose)
- **Stack:** NanoClaw Server + PostgreSQL + Ollama — tudo no mesmo VPS
- **Futuro:** Separar Ollama em GPU dedicada se necessário

### 2.10 Detalhamento dos Agentes
- **Decisão:** Manter TODA a riqueza do formato AIOX
- **Motivo:** O detalhamento (persona, archetype, communication style, greeting levels, core principles, commands, dependencies) é o que faz os agentes funcionarem bem
- **Formato:** Adaptado para contexto de negócio (não dev), mas mantendo a mesma profundidade estrutural

### 2.11 Task-First Architecture
- **Decisão:** Manter a abordagem task-first do AIOX com tipos de executor
- **Tipos de executor:**
  - **WORKER** — Determinístico, sem LLM, sem tokens (ex: consulta saldo férias)
  - **WORKER+API** — Determinístico com integração externa (ex: abrir chamado)
  - **CLONE** — Agente de IA processa via Ollama + RAG (ex: analisar documentação)
  - **HUMANO** — Escala para pessoa real com notificação (ex: contestar avaliação)
- **Benefício:** ~65% economia de tokens roteando determinístico vs IA

---

## 3. Arquitetura Consolidada

### 3.1 Relação AIOX ↔ NanoClaw

```
AIOX (CLI, ferramenta de dev)           NanoClaw (Servidor, produto)
─────────────────────────────           ────────────────────────────
@squad-creator gera templates  ──────▶  PostgreSQL armazena agents
de agents iniciais                      Web UI edita agents
                                        NanoClaw Server carrega em memória
                                        Hot-reload via LISTEN/NOTIFY
```

- AIOX é usado APENAS para criação inicial de templates de agentes
- NanoClaw é 100% independente em runtime
- Nenhuma dependência de código entre os dois

### 3.2 Fonte de Verdade dos Agentes

```
PostgreSQL (fonte de verdade)
         │
         ├── Web UI Admin edita direto no banco
         │
         ├── NanoClaw Server carrega em memória (Map<id, config>)
         │
         └── Hot-reload via PostgreSQL LISTEN/NOTIFY
             Quando admin salva → NOTIFY agent_changed → server recarrega
```

### 3.3 Formato do Agente NanoClaw

Mantém a mesma riqueza do AIOX, adaptado para negócio:

```yaml
# ─── SEÇÕES MANTIDAS DO AIOX (mesma estrutura) ───
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
      minimal: "Olá! Sou a Helena, assistente de RH."
      named: "Olá {user_name}! ..."
      archetypal: "Olá {user_name}! Sou a Helena, guardiã das políticas..."
    signature_closing: "Helena | RH Digital"

persona:
  role: Especialista em Recursos Humanos
  style: Acolhedor, preciso, empático, profissional
  identity: (descrição completa)
  focus: (escopo específico)

core_principles:
  - CRITICAL: Nunca inventar informações
  - CRITICAL: Dados salariais APENAS com permissão salary_view
  - CRITICAL: Sempre referenciar fonte

# ─── SEÇÕES ADAPTADAS PARA NANOCLAW ───
commands:
  - name: consultar-politica
    type: clone
    tools: [knowledge_search]

  - name: saldo-ferias
    type: worker
    match_patterns: ["saldo de férias", "quantos dias de férias"]
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

### 3.4 Tipos de Memória

1. **Conversa atual** (efêmera) — mensagens do chat em andamento, morre com a sessão
2. **Histórico de conversas** (persistente) — gravado no PostgreSQL, pesquisável
3. **Memória do agent sobre o usuário** (aprendida) — preferências acumuladas ao longo do tempo
4. **Knowledge base** (estática) — documentos da empresa processados via RAG

### 3.5 NCI (NanoClaw Instance)

Cada funcionário que conecta recebe uma NCI — um objeto em memória (NÃO um processo separado):

```
NCI Manager
├── sessions: Map<userId, NCI>
│
├── createSession(userId):
│   1. Carrega perfil do user do PostgreSQL
│   2. Filtra agents permitidos
│   3. Conecta memory gateway com RLS
│   4. Cria NCISession
│
└── 50 funcionários = 50 objetos no Map
    1 Ollama = compartilhado por todos (com fila)
```

### 3.6 Workflow Engine

Peça fundamental para orquestrar processos de negócio multi-step com mixed executors:

```
Workflow Engine
├── Define processos em YAML (ex: admissão com 10 steps)
├── Cada step tem um executor type: worker | worker_api | clone | human
├── Integra com ferramentas externas (ClickUp, ERPs)
├── Suporta human-in-the-loop bidirecional
│   ├── Humano marca @agente no ClickUp → webhook → NanoClaw processa
│   └── Agente comenta no ClickUp → marca @humano → notifica
├── Completion triggers: external_event, timeout, condition
├── Gates de decisão (humano aprova/reprova)
└── SLA tracking por step e por processo
```

**Webhook Receiver:**
- POST /webhooks/{platform} recebe eventos de ferramentas externas
- Match com workflow_run ativo → avança step → dispara próximo executor

**Schema PostgreSQL do Workflow Engine:**
```sql
workflows (id, name, version, definition_json, integration_config)
workflow_runs (id, workflow_id, status, context_json, started_at, sla_deadline)
step_runs (id, workflow_run_id, step_id, type, status, executor_type, input/output_json)
webhook_events (id, source, event_type, payload_json, matched_workflow_run_id)
integrations (id, platform, config_json, credentials_encrypted)
```

### 3.7 Chat vs. Workflow — Dois Sistemas que Conversam

```
CHAT (NCI):                     WORKFLOW ENGINE:
- Conversa livre                - Processo estruturado
- Funcionário pergunta algo     - Sistema executa steps
- Agente responde               - Mixed executors
- Stateless (por conversa)      - Stateful (por processo)
- Sempre ativo                  - Ativado por trigger

Interação:
- Chat pode iniciar workflow:    "Helena, inicie admissão do João"
- Workflow pode usar chat agent: Step 3 usa Helena pra analisar docs
- Workflow pode notificar via chat: "João, seu contrato está pronto"
```

---

## 4. Arquitetura Visual

```
┌──────────────────────────────────────────────────────────┐
│                  NanoClaw Server                          │
│                                                           │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                  │
│  │Telegram │  │ Web Chat │  │External │                   │
│  │Channel  │  │ Channel  │  │Webhooks │                   │
│  └────┬────┘  └────┬────┘  └────┬────┘                   │
│       └─────────────┼───────────┘                         │
│                     ▼                                     │
│           ┌─────────────────┐                             │
│           │  Message Router │                             │
│           └────────┬────────┘                             │
│                    │                                      │
│        ┌───────────┼───────────┐                          │
│        ▼                       ▼                          │
│  ┌──────────┐          ┌──────────────┐                   │
│  │ NCI      │          │  WORKFLOW    │                    │
│  │ (chat)   │          │  ENGINE     │                    │
│  └──────────┘          └──────┬──────┘                    │
│                               │                           │
│              ┌────────────────┼────────────────┐          │
│              ▼                ▼                ▼          │
│         [WORKER]        [CLONE/AI]        [HUMAN]         │
│         código          Ollama            notifica         │
│         direto          + RAG             e aguarda        │
│                                                           │
│  ┌────────────────────────────────────────────────────┐   │
│  │               PostgreSQL                            │  │
│  │  agents │ users │ workflows │ knowledge │ vectors  │   │
│  │  conversations │ workflow_runs │ step_runs │ logs   │   │
│  └────────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐   │
│  │ Agent Cache  │  │ Ollama (LLM)  │  │ External APIs│   │
│  │ hot-reload   │  │ fast/smart    │  │ ClickUp, ERP │   │
│  │ via NOTIFY   │  │ models        │  │ Google, etc  │   │
│  └──────────────┘  └───────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## 5. Pontos Pendentes

### 5.1 Fluxo de Decisão do Task Router
- **Status:** PENDENTE
- **Contexto:** O fluxo proposto (match exato → worker, match ação → worker+API, senão → LLM) foi considerado diferente pelo fundador
- **Ação:** Fundador vai enviar o fluxo correto em sessão futura
- **Impacto:** Afeta como o NCI decide qual executor usar para cada mensagem

### 5.2 Configuração e Integração com MCP
- **Status:** PENDENTE
- **Contexto:** O AIOX usa MCP (Model Context Protocol) para ferramentas externas. Como o NanoClaw vai usar/integrar com MCP?
- **Perguntas em aberto:**
  - NanoClaw terá seu próprio MCP server?
  - Os tools dos agents (knowledge_search, erp_query) serão implementados como MCP tools?
  - Como o Ollama se conecta com MCP tools? (Ollama não suporta MCP nativamente — precisa de bridge)
  - O NanoClaw expõe MCP para que outras ferramentas se conectem a ele?
- **Impacto:** Define como tools são implementados e como o LLM acessa funcionalidades externas

### 5.3 Base de Conhecimento de Gestão de Negócio
- **Status:** PENDENTE
- **Contexto:** O fundador tem uma base de conhecimento sobre gestão de negócios que quer usar para tornar o NanoClaw/plataforma especialista em gestão
- **Perguntas em aberto:**
  - Qual o formato dessa base? (PDFs, documentos, frameworks, metodologias?)
  - É conteúdo proprietário ou público?
  - Como integrar: como knowledge base padrão (RAG) ou como parte do system prompt dos agents?
  - Isso diferencia o NanoClaw de concorrentes — os agents não apenas respondem, mas aconselham com base em frameworks de gestão comprovados?
  - Exemplos: se um gestor pergunta sobre estrutura organizacional, o agent responde com base em metodologias reais (OKR, BSC, Lean, etc.) em vez de respostas genéricas?
- **Impacto:** Diferencial competitivo. Define se NanoClaw é "chatbot com docs" ou "consultor de gestão com IA"

### 5.4 Agents Genéricos para Implantação
- **Status:** PENDENTE (decidido não criar nesta sessão)
- **Contexto:** Pretende criar agents genéricos (RH, Financeiro, Marketing, Vendas, Suporte, Jurídico) para facilitar implantação em novos clientes. Ainda não definiu quais criar primeiro.
- **Ação:** Definir em sessão futura após PRD

### 5.5 Estrutura do Repo NanoClaw
- **Status:** PENDENTE
- **Contexto:** Repo separado confirmado, mas estrutura de diretórios não definida
- **Proposta inicial:**
  ```
  nanoclaw/
  ├── server/              # NanoClaw Server (Node.js)
  │   ├── core/            # NCI Manager, Auth, Agent Loader, Memory Gateway
  │   ├── channels/        # Telegram, Web Chat
  │   ├── workflow-engine/ # Workflow Engine
  │   ├── providers/       # Ollama Provider
  │   └── webhooks/        # Webhook Receiver
  ├── web/                 # Next.js Admin UI
  ├── db/                  # Migrations, seeds
  ├── docker/              # docker-compose, Dockerfiles
  └── docs/                # Documentação
  ```

### 5.6 Processo de Admissão (Exemplo de Workflow)
- **Status:** Discutido como exemplo, não implementado
- **Contexto:** Processo de 10 steps com mixed executors, integração ClickUp, human-in-the-loop bidirecional
- **Ação:** Usar como caso de teste do Workflow Engine quando implementado

### 5.7 Segurança e RLS
- **Status:** PENDENTE
- **Contexto:** Mencionado que dados salariais só para perfis com permissão. Precisa definir:
  - Modelo de permissões detalhado
  - RLS policies no PostgreSQL
  - Como memory_access se traduz em queries SQL
  - Audit log de acessos sensíveis

### 5.8 Modelo de Pricing/Billing
- **Status:** NÃO DISCUTIDO
- **Contexto:** Como cobrar clientes? Por usuário? Por mensagem? Por agente?

---

## 6. Stack Técnica Consolidada

| Componente | Tecnologia | Status |
|------------|-----------|--------|
| Backend/Server | Node.js | Confirmado |
| Banco de Dados | PostgreSQL | Confirmado |
| Embeddings/RAG | pgvector (PostgreSQL) | Confirmado |
| LLM | Ollama (modelo 8B) | Confirmado |
| Canal MVP | Telegram Bot API | Confirmado |
| Web UI Admin | Next.js (React) | Confirmado |
| Deploy | Docker Compose em VPS | Confirmado |
| Repo | Separado do AIOX | Confirmado |

---

## 7. O que o AIOX contribui (e o que NÃO)

### Contribui (inspiração/ferramenta):
- `@squad-creator` para gerar templates iniciais de agents
- Formato rico de agent definition como referência
- Task-first architecture como padrão
- Workflow YAML format como inspiração

### NÃO contribui (NanoClaw é independente):
- Nenhum código do AIOX é importado/reutilizado em runtime
- Nenhum módulo do AIOX é dependência do NanoClaw
- Agent Config Loader, Activation Pipeline, etc. são do AIOX — NanoClaw tem os próprios
- AIOX não será alterado para acomodar NanoClaw

---

## 8. Próximos Passos

1. [ ] Receber fluxo de decisão correto do Task Router (do fundador)
2. [ ] Definir integração com MCP
3. [ ] Entender e integrar base de conhecimento de gestão
4. [ ] Criar PRD completo do NanoClaw
5. [ ] Definir estrutura do repo separado
6. [ ] Definir quais agents genéricos criar primeiro
7. [ ] Implementar MVP

---

*Documento gerado na sessão claude/analyze-image-tr45K em 2026-03-22*
*Synkra NanoClaw — Pre-PRD Architecture Decisions*
