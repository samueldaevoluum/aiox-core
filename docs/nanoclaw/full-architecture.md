# Arquitetura Completa — Sistema de IA Conversacional

> **Data:** 2026-03-22
> **Status:** Definido (arquitetura final)
> **Escopo:** Visao completa das 7 camadas do sistema

## Glossario

| Termo | Significado |
|-------|-------------|
| **AIOX** | Framework usado para construir os agentes (nao e o produto) |
| **NanoClaw** | Orchestrator open-source que gerencia NCIs |
| **NCI** | NanoClaw Instance — 1 container Docker isolado por usuario |
| **Clone** | LLM que emula uma pessoa real via DNA Mental |
| **Agente** | LLM com persona funcional criada por design |
| **Worker** | Script deterministico, sem LLM, custo zero |
| **DNA Mental** | 9 camadas que definem como um Clone pensa e se comunica |

---

## Visao Geral das 7 Camadas

| # | Camada | O que faz | Tecnologia |
|---|--------|-----------|------------|
| 1 | **Canais** | Entrada do usuario | Telegram (MVP), WebChat, WhatsApp |
| 2 | **Gateway** | Auth, routing, rate limit, normaliza | FastAPI (Python) |
| 3 | **NanoClaw** | Lifecycle de NCIs, registry | NanoClaw orchestrator |
| 4 | **NCI** | Container isolado/usuario, routing, executors | Docker + Hybrid Router |
| 5 | **Tools** | Function calling (hoje), MCP (futuro) | FastAPI functions -> MCP Servers |
| 6 | **Dados** | DB, RAG, memoria, cache | PostgreSQL, pgvector, Redis |
| 7 | **Infra** | VPS, containers, proxy | Docker Compose, Nginx, Ubuntu |

---

## Diagrama Completo

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CAMADA 1: CANAIS (Entrada)                         │
│                                                                             │
│   Telegram        WebChat          WhatsApp         API REST               │
│   (MVP)           (futuro)         (futuro)         (futuro)               │
│        │               │                │                │                  │
│        └───────────────┴────────────────┴────────────────┘                  │
│                                    │                                        │
│                              HTTP/Webhook                                   │
│                                    │                                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    CAMADA 2: API GATEWAY (FastAPI/Python)                   │
│                                                                             │
│   Ponto unico de entrada — todos os canais passam por aqui                 │
│                                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  ┌──────────────┐  │
│   │    Auth      │  │  Rate Limit  │  │   Routing     │  │   Webhook    │  │
│   │  (JWT/OAuth) │  │  por tenant  │  │  por empresa  │  │   Receiver   │  │
│   │              │  │              │  │               │  │  (Telegram,  │  │
│   │  Valida quem │  │  Protege     │  │  Empresa A -> │  │   WhatsApp)  │  │
│   │  e o user    │  │  contra      │  │  NanoClaw A   │  │              │  │
│   │              │  │  abuso       │  │               │  │              │  │
│   └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  └──────┬───────┘  │
│          └─────────────────┴──────────────────┴─────────────────┘          │
│                                    │                                        │
│   Responsabilidades:                                                        │
│   - Recebe webhooks de TODOS os canais                                     │
│   - Normaliza mensagem para formato interno                                │
│   - Autentica e identifica empresa + usuario                               │
│   - Rate limiting por tenant/usuario                                       │
│   - Roteia para NanoClaw correto                                           │
│   - Retorna resposta pro canal de origem                                   │
│                                                                             │
│   Formato interno normalizado:                                              │
│   {empresa_id, user_id, channel, message, metadata}                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   CAMADA 3: NANOCLAW (Orchestrator)                        │
│                                                                             │
│   Gerencia o ciclo de vida das NCIs (NanoClaw Instances)                   │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                    LIFECYCLE MANAGER                              │      │
│   │                                                                  │      │
│   │  ┌─────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────┐   │      │
│   │  │ Spawn   │  │ Wake     │  │ Hibernate │  │ Destroy       │   │      │
│   │  │ NCI     │  │ NCI      │  │ NCI       │  │ NCI           │   │      │
│   │  │         │  │          │  │           │  │               │   │      │
│   │  │ Cria    │  │ Reativa  │  │ Suspende  │  │ Remove        │   │      │
│   │  │ nova    │  │ NCI que  │  │ NCI       │  │ NCI e limpa   │   │      │
│   │  │instancia│  │ hibernou │  │ inativa   │  │ recursos      │   │      │
│   │  └─────────┘  └──────────┘  └───────────┘  └───────────────┘   │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────────┐      │
│   │                    NCI REGISTRY                                   │      │
│   │                                                                  │      │
│   │  Empresa A --> [NCI-joao] [NCI-maria] [NCI-pedro]                │      │
│   │  Empresa B --> [NCI-ana] [NCI-carlos]                            │      │
│   │  Empresa C --> [NCI-lucia] [NCI-rafael] [NCI-paula] [NCI-tiago] │      │
│   │                                                                  │      │
│   │  Cada NCI = 1 Docker container isolado por usuario               │      │
│   └──────────────────────────────────────────────────────────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│               CAMADA 4: NCI — NanoClaw Instance                            │
│                    (1 Docker Container por Usuario)                         │
│                                                                             │
│   Injetado na criacao: CLAUDE.md com persona + permissoes + memoria        │
│                                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │              HYBRID ROUTER (4 niveis)                           │       │
│   │                                                                 │       │
│   │  Mensagem chega -> tenta resolver do mais barato ao mais caro: │       │
│   │                                                                 │       │
│   │  L1: Name Detection --> regex, palavras-chave exatas            │       │
│   │      "saldo" -> match direto                                    │       │
│   │                                                                 │       │
│   │  L2: Pattern Match  --> fuzzy, sinonimos, variacoes             │       │
│   │      "quanto tem na conta" -> similar a "consulta_saldo"        │       │
│   │                                                                 │       │
│   │  L3: LLM Classifier --> modelo leve (Ollama) classifica        │       │
│   │      "preciso de ajuda com aquilo do cliente" -> intent         │       │
│   │                                                                 │       │
│   │  L4: Concierge      --> fallback, conversa livre                │       │
│   │      "bom dia, tudo bem?" -> resposta generica                  │       │
│   │                                                                 │       │
│   └──────────────────────┬──────────────────────────────────────────┘       │
│                          │                                                   │
│                          ▼                                                   │
│   ┌─────────────────────────────────────────────────────────────────┐       │
│   │            TASK ROUTER (Decision Tree)                          │       │
│   │                                                                 │       │
│   │  Baseado no intent detectado, escolhe o executor:              │       │
│   │                                                                 │       │
│   │  Match exato?        --> WORKER (script deterministico)        │       │
│   │  Precisa API?        --> WORKER+API (HTTP a sistema externo)   │       │
│   │  Precisa raciocinio? --> AGENTE (LLM + function calling)      │       │
│   │  E clone?            --> CLONE (LLM + DNA Mental)              │       │
│   │  Precisa humano?     --> HUMANO (escalacao, notifica)          │       │
│   │                                                                 │       │
│   └────────┬────────────┬───────────┬──────────┬──────────┬─────────┘       │
│            │            │           │          │          │                  │
│            ▼            ▼           ▼          ▼          ▼                  │
│   ┌────────────┐ ┌──────────┐ ┌─────────┐ ┌────────┐ ┌─────────┐          │
│   │  WORKER    │ │WORKER+API│ │ AGENTE  │ │ CLONE  │ │ HUMANO  │          │
│   │            │ │          │ │         │ │        │ │         │          │
│   │ Script     │ │ HTTP     │ │ LLM +   │ │ LLM +  │ │ Notifica│          │
│   │ determi-   │ │ calls    │ │ Persona │ │ DNA    │ │ pessoa  │          │
│   │ nistico    │ │ a ERPs,  │ │ funcio- │ │ Mental │ │ real e  │          │
│   │ (if/else,  │ │ CRMs,    │ │ nal +   │ │ de uma │ │ espera  │          │
│   │  query)    │ │ APIs     │ │ Function│ │ pessoa │ │ resposta│          │
│   │            │ │ externas │ │ Calling │ │ real   │ │         │          │
│   │ Custo: $0  │ │ Custo:~  │ │ Custo:$ │ │Custo:$ │ │Custo:   │          │
│   │ Tempo:<1s  │ │ 1-3s     │ │ 3-15s   │ │ 3-15s  │ │ ?min    │          │
│   └────────────┘ └──────────┘ └────┬────┘ └───┬────┘ └─────────┘          │
│                                     │          │                            │
│                    Agente e Clone usam Function Calling                     │
│                                     │          │                            │
└─────────────────────────────────────┼──────────┼────────────────────────────┘
                                      │          │
                                      ▼          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│              CAMADA 5: FUNCTION CALLING + TOOL EXECUTION                   │
│                                                                             │
│   Quando AGENTE ou CLONE precisa agir no mundo, o LLM (Ollama)            │
│   decide qual funcao chamar. FastAPI valida e executa.                      │
│                                                                             │
│   ┌───────────────────────────────────────────────────────────────┐         │
│   │                      TOOL ROUTER (FastAPI)                    │         │
│   │                                                               │         │
│   │  Fluxo:                                                      │         │
│   │  1. LLM retorna: "chamar consultar_saldo(cliente='X')"      │         │
│   │  2. Valida permissao -> essa NCI pode chamar essa tool?      │         │
│   │  3. Valida argumentos -> schema correto?                     │         │
│   │  4. Registra no audit log                                    │         │
│   │  5. Executa a funcao                                         │         │
│   │  6. Retorna resultado pro LLM continuar                     │         │
│   │  7. LLM pode chamar outra tool ou gerar resposta final      │         │
│   └───────┬──────────┬──────────┬──────────┬──────────┬──────────┘         │
│           │          │          │          │          │                     │
│           ▼          ▼          ▼          ▼          ▼                     │
│   ┌───────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐           │
│   │ DB Tools  │ │ ERP/   │ │ RAG    │ │ Notif  │ │ Workflow   │           │
│   │           │ │ CRM    │ │ Search │ │ Tools  │ │ Tools      │           │
│   │ consultar │ │ Tools  │ │        │ │        │ │            │           │
│   │ _saldo()  │ │        │ │ buscar │ │ enviar │ │ aprovar    │           │
│   │ listar    │ │ criar  │ │ _docs()│ │ _email │ │ _etapa()   │           │
│   │ _clientes │ │ _pedido│ │ buscar │ │ ()     │ │ escalar    │           │
│   │ ()        │ │ ()     │ │ _faq() │ │ notif  │ │ _para      │           │
│   │ inserir   │ │ atualiz│ │        │ │ _slack │ │ _humano()  │           │
│   │ _registro │ │ ar_    │ │        │ │ ()     │ │            │           │
│   │ ()        │ │ status │ │        │ │        │ │            │           │
│   │           │ │ ()     │ │        │ │        │ │            │           │
│   └─────┬─────┘ └───┬────┘ └───┬────┘ └───┬────┘ └─────┬──────┘           │
│         │           │          │          │            │                    │
│         ▼           ▼          ▼          ▼            ▼                    │
│   ┌─────────────────────────────────────────────────────────────┐           │
│   │                    MCP LAYER (EVOLUCAO FUTURA)               │           │
│   │                                                             │           │
│   │  Hoje: tools sao funcoes Python registradas no FastAPI      │           │
│   │  Futuro: cada grupo de tools vira um MCP Server             │           │
│   │          Tool Router vira MCP Client                        │           │
│   │                                                             │           │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │           │
│   │  │ db-mcp   │ │ erp-mcp  │ │ rag-mcp  │ │ notif-mcp│      │           │
│   │  │ server   │ │ server   │ │ server   │ │ server   │      │           │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │           │
│   │                                                             │           │
│   │  Beneficios futuros:                                        │           │
│   │  - Discovery dinamico de tools                              │           │
│   │  - Protocolo padronizado                                    │           │
│   │  - Reuso de tools entre NCIs                                │           │
│   │  - Marketplace de integracoes                               │           │
│   └─────────────────────────────────────────────────────────────┘           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                 CAMADA 6: DADOS + MEMORIA + CONHECIMENTO                   │
│                                                                             │
│   ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐         │
│   │   PostgreSQL      │  │   pgvector       │  │   Redis          │         │
│   │   (dados)         │  │   (RAG)          │  │   (cache/session)│         │
│   │                   │  │                  │  │                  │         │
│   │  ┌─────────────┐ │  │  Knowledge Base  │  │  Session state   │         │
│   │  │ empresas    │ │  │  por empresa:    │  │  Tool results    │         │
│   │  │ usuarios    │ │  │                  │  │  Rate limiting   │         │
│   │  │ ncis        │ │  │  - FAQs          │  │  NCI state       │         │
│   │  │ conversas   │ │  │  - SOPs          │  │                  │         │
│   │  │ memoria     │ │  │  - Manuais       │  │                  │         │
│   │  │ audit_log   │ │  │  - Politicas     │  │                  │         │
│   │  │ tool_calls  │ │  │  - Processos     │  │                  │         │
│   │  │ workflows   │ │  │                  │  │                  │         │
│   │  └─────────────┘ │  │  Embeddings via  │  │                  │         │
│   │                   │  │  Ollama          │  │                  │         │
│   │  RLS por empresa  │  │  Filtro por NCI  │  │                  │         │
│   └──────────────────┘  └──────────────────┘  └──────────────────┘         │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │              4 CAMADAS DE MEMORIA (por NCI)                  │          │
│   │                                                              │          │
│   │  L1: Conversa atual     -> in-memory (contexto do chat)     │          │
│   │  L2: Memoria pessoal    -> PostgreSQL (preferencias, perfil)│          │
│   │  L3: Historico          -> PostgreSQL (conversas passadas)  │          │
│   │  L4: Knowledge Base     -> pgvector (docs da empresa, RAG)  │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                     CAMADA 7: INFRAESTRUTURA (VPS)                         │
│                                                                             │
│   ┌──────────────────────────────────────────────────────────────┐          │
│   │                    Docker Compose                             │          │
│   │                                                              │          │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │          │
│   │  │ FastAPI  │ │ NanoClaw │ │ Ollama   │ │ Postgres │       │          │
│   │  │ Gateway  │ │ Orchestr.│ │ LLM      │ │ + pgvect │       │          │
│   │  │ :8000    │ │ :3000    │ │ :11434   │ │ :5432    │       │          │
│   │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │          │
│   │                                                              │          │
│   │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐        │          │
│   │  │ Redis    │ │ Nginx    │ │ NCI Containers       │        │          │
│   │  │ :6379    │ │ :443     │ │ (dinamicos, 1/user)  │        │          │
│   │  └──────────┘ └──────────┘ └──────────────────────┘        │          │
│   └──────────────────────────────────────────────────────────────┘          │
│                                                                             │
│   VPS: Ubuntu 22.04+ | 16GB+ RAM | SSD | Docker 24+                       │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Clone vs Agente

### Clone (DNA Mental)

Emula uma **PESSOA REAL** da empresa.

**9 Camadas do DNA Mental:**

| # | Camada | O que define |
|---|--------|-------------|
| 1 | Identidade | Quem sou, valores |
| 2 | Comunicacao | Tom, vocabulario, estilo |
| 3 | Conhecimento | Dominio, expertise |
| 4 | Decisao | Como avalia, prioriza |
| 5 | Relacionamento | Como interage, empatia |
| 6 | Processos | Metodologias, frameworks |
| 7 | Contexto | Empresa, cultura, mercado |
| 8 | Limites | O que NAO faz, escalacoes |
| 9 | Evolucao | Aprende, adapta |

**Exemplo:** Clone do CEO responde como o CEO responderia.

**Composicao:** Ollama LLM + DNA Mental (system prompt) + RAG (knowledge base) + Function Calling (acoes)

### Agente (Funcional)

Persona criada por **DESIGN**, nao emula pessoa real.

**Exemplo:** "Assistente Financeiro" — analisa dados, gera relatorios, responde sobre financas.

**Composicao:** Ollama LLM + Persona (system prompt) + RAG (knowledge base) + Function Calling (acoes)

Construido usando metodologia AIOX (tasks, checklists, templates copiados para o sistema).

---

## Fluxo Completo — Exemplo 1: Worker (sem LLM)

```
Joao (vendedor) manda no Telegram:
"Qual o saldo do cliente Padaria Estrela?"

Telegram --> Gateway (auth: Joao = empresa X, OK)
         --> NanoClaw (NCI do Joao existe? Sim, wake)
         --> NCI Container:
               Hybrid Router L1: "saldo" detected -> match "consulta_saldo"
               Task Router: consulta_saldo = WORKER (deterministico)
               Worker executa:
                 SELECT saldo FROM clientes
                 WHERE nome ILIKE '%Padaria Estrela%'
                 AND empresa_id = 'empresa_X'  <-- RLS
                 Resultado: R$ 45.230,00
               Resposta formatada (template):
                 "Saldo do cliente Padaria Estrela: R$ 45.230,00"
         --> Gateway retorna pro Telegram

Custo LLM: R$ 0,00 (Worker, sem Ollama)
Tempo: ~200ms
```

## Fluxo Completo — Exemplo 2: Agente com Function Calling

```
Joao pergunta:
"Me ajuda a montar uma proposta pro cliente Padaria Estrela"

Telegram --> Gateway --> NanoClaw --> NCI Container:
  Hybrid Router:
    L1: sem match exato
    L2: sem pattern claro
    L3: LLM Classifier -> "gerar_proposta" (agente)
  Task Router: gerar_proposta = AGENTE (precisa LLM)

  Agente "Assistente Comercial" (Ollama):
    1. Function call: buscar_cliente("Padaria Estrela")
       -> Tool Router executa -> retorna dados do cliente
    2. Function call: buscar_historico_pedidos(cliente_id)
       -> Tool Router executa -> retorna ultimos pedidos
    3. Function call: buscar_docs("template proposta")
       -> RAG/pgvector -> retorna template da empresa
    4. LLM gera proposta personalizada com os dados

  --> Gateway retorna pro Telegram

Custo: ~$0.02 (3 tool calls + geracao)
Tempo: ~8s
```

---

## Decisoes de Arquitetura Registradas

| # | Decisao | Status |
|---|---------|--------|
| 1 | Gateway centralizado (FastAPI) na frente do NanoClaw | DECIDIDO |
| 2 | NCI = 1 Docker container por usuario | DECIDIDO |
| 3 | Hybrid Router com 4 niveis (L1-L4) | DECIDIDO |
| 4 | 5 tipos de executor: Worker, Worker+API, Agente, Clone, Humano | DECIDIDO |
| 5 | Function Calling via FastAPI (hoje), MCP (futuro) | DECIDIDO |
| 6 | 4 camadas de memoria por NCI | DECIDIDO |
| 7 | PostgreSQL + pgvector + Redis para dados | DECIDIDO |
| 8 | Ollama como LLM runtime local | DECIDIDO |
| 9 | AIOX como framework de construcao de agentes | DECIDIDO |
| 10 | Telegram como canal MVP | DECIDIDO |
| 11 | Tool Router valida permissao + audit log | DECIDIDO |
| 12 | RLS por empresa no PostgreSQL | DECIDIDO |

---

## Pendencias para Definicao do MVP

- [ ] Definir recorte minimo das camadas para MVP
- [ ] Decidir se MVP usa Docker por NCI ou processo simples
- [ ] Definir quais tools implementar primeiro
- [ ] Definir modelo Ollama para MVP (qwen2, llama3, etc.)
- [ ] Definir se MVP precisa de RAG ou so memoria simples
