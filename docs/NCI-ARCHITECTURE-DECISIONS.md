# NCI Architecture Decisions Log

**Date:** 2026-03-22
**Status:** In Progress (Architecture Phase)
**Session:** claude/analyze-image-tr45K

---

## 1. O Que É o NCI

**NCI = Namespace de Colaborador Inteligente**

Container Docker isolado por colaborador da empresa. Cada funcionário tem seu próprio NCI com agentes de IA personalizados para sua empresa.

### Exemplo

```
Empresa ACME Corp
├── NCI do João (container isolado)
│   ├── Helena (agente RH)
│   ├── Carlos (agente Financeiro)
│   └── Clone do CEO (mentoria)
├── NCI da Maria (container isolado)
│   ├── Helena (agente RH)
│   ├── Carlos (agente Financeiro)
│   └── Clone do CEO (mentoria)
└── NCI do Pedro (container isolado)
    └── ... (mesmos agentes, dados isolados)
```

---

## 2. Routing: Estratégia Híbrida (DECIDIDO)

### Agent Router (quem responde)

4 níveis em cascata:

```
Mensagem do colaborador
        │
        ▼
Level 1: Name Detection (regex)
  "Helena" → agent_id: rh
        │ não match
        ▼
Level 2: Pattern Match (fuzzy)
  "saldo de férias" → rh.saldo-ferias
  (varre match_patterns de TODOS agentes)
        │ não match
        ▼
Level 3: LLM Classifier (modelo leve)
  Prompt curto + lista de agentes/commands
  → classifica intent → agente + command
        │ não match
        ▼
Level 4: Concierge (fallback)
  Agente default responde
  "Não entendi, posso te direcionar..."
```

### Task Router (o que fazer)

Após identificar o agente, resolve o command:

```
Level 1: Command explícito (veio do pattern match)
Level 2: Type match (command.type mapping)
Level 3: Tag match (command.tags)
Level 4: Keyword inference na mensagem
```

### Inspiração AIOX

| Módulo AIOX | Equivalente NCI | Função |
|---|---|---|
| `l2-agent.js` | `agent-router.js` | Detectar agente na mensagem |
| `l7-star-command.js` | `task-router.js` (patterns) | Match de patterns |
| `subagent-dispatcher.js` | `task-router.js` (inference) | Inferência por type/tags/keywords |
| `skill-dispatcher.js` | `executor-dispatch.js` | Despachar para executor correto |
| `session-manager.js` | `session-state.js` | Contexto da conversa |

### Diferença-chave AIOX vs NCI

| Aspecto | AIOX | NCI |
|---|---|---|
| Quem invoca | Dev técnico (`@dev`, `*task`) | Colaborador leigo ("Helena, me ajuda") |
| Sintaxe | Explícita (`@agent`, `*command`) | Natural (linguagem livre) |
| Level 2 (patterns) | Regex exato (`*command`) | Fuzzy match (sinônimos, variações) |
| Level 3 (inferência) | Keywords hardcoded | LLM leve (linguagem muito variada) |
| Executor | Sempre LLM (Claude/Gemini) | Worker / Worker API / Agente / Clone / Humano |

---

## 3. Executor Types: 5 Tipos (DECIDIDO)

### Princípio Fundamental (do AIOX)

> **"Everything is a Task. Executors are attributes."**

Tasks são definidas universalmente. O executor é um campo (`responsavel_type`) que pode mudar sem reescrever a task.

### Os 5 Tipos

| Type | LLM? | API? | Humano? | Custo | Latência | Determinístico? |
|---|---|---|---|---|---|---|
| **Worker** | Não | Não | Não | $0 | <1s | Sim |
| **Worker API** | Não | Sim (não-AI) | Não | $ | ~1-3s | Sim |
| **Agente** | Sim | — | Não | $$$ | 3-10s | Não |
| **Clone** | Sim + DNA | — | Não | $$$$ | 5-15s | Parcial |
| **Humano** | Não | — | Sim | $$$$$ | min-horas | Não |

### Decision Tree

```
Task a executar
      │
      ▼
  Determinístico?  ─── SIM ─── Chama API? ─── SIM → Worker API
  (mesma entrada       │                   └── NÃO → Worker
   = mesma saída)      │
      │               NÃO
      ▼
  Decisão crítica  ─── SIM → Humano
  (legal/financeira/    │
   sensível)?           │
      │               NÃO
      ▼
  Metodologia      ─── SIM → Clone
  específica           │     (CEO, mentor,
  de alguém?           │      especialista)
      │               NÃO
      ▼
                    Agente (IA genérica)
```

### Workers na Hierarquia

Workers estão no **nível de TASK** (atributo `responsavel_type`), NÃO no nível de Agent. Relação Agent ↔ Worker é ortogonal:

- **Agents** = Quem responde (persona, tom, regras)
- **Workers/Executors** = Como executa (script, LLM, humano)

### Estratégias Híbridas de Execução

| Estratégia | Como funciona | Exemplo NCI |
|---|---|---|
| **Agente + Worker fallback** | IA tenta, se falha → script | Classificar chamado: IA classifica, se timeout → regra default |
| **Agente + Humano escalation** | IA faz, se baixa confiança → humano | Aprovação de compra: IA avalia, se >R$10k → gestor humano |
| **Clone + Agente** | Clone valida, Agente executa | Mentoria: clone do CEO valida, agente formata resposta |

### Substituição Progressiva

```yaml
# Evolução natural de uma task ao longo do tempo:

# Mês 1 - Novo, sem dados
classificar-chamado:
  responsavel_type: Agente    # IA classifica (caro, mas funciona)

# Mês 3 - Acumulou padrões
classificar-chamado:
  responsavel_type: Worker    # Regras extraídas dos dados da IA
  fallback: Agente            # IA só nos casos edge

# Mês 6 - Maduro
classificar-chamado:
  responsavel_type: Worker    # 95% dos casos resolvidos por regra
  fallback: Humano            # 5% edge cases → pessoa real
```

---

## 4. Agent vs Clone (DECIDIDO)

### Distinção

| Conceito | Agent | Clone (Mind Clone) |
|---|---|---|
| **O que é** | Persona funcional criada por design | Emulação cognitiva de uma pessoa real |
| **Origem** | Template + regras | DNA Mental extraído de fontes reais |
| **Voz** | Definida por design (genérica) | Extraída da pessoa real (Voice DNA) |
| **Raciocínio** | Regras e checklists | Frameworks e heurísticas da pessoa (Thinking DNA) |
| **Qualidade** | Boa para tarefas funcionais | Superior para decisões e consultoria |

### DNA Mental (Simplificado para MVP, Arquitetura Completa Prevista)

O AIOX usa 9 camadas (DNA Mental™). Para o NCI:

- **MVP:** Voice DNA + Thinking DNA + Identity (3 arquivos YAML)
- **Futuro:** Pipeline completo com as 9 camadas do AIOX

```
Camadas AIOX (referência futura):
L0: Viability Assessment    → "Essa pessoa é clonável?"
L1: Source Collection       → Livros, talks, entrevistas, artigos
L2-L3: Behavioral Patterns  → Como reage, padrões de estado
L4-L5: Mental Models        → Frameworks, heurísticas de decisão
L6-L8: Identity Core        → Valores, obsessões, contradições
       ⚠️ HUMAN CHECKPOINT  → Humano valida fidelidade
L9: Latticework Integration → Unifica tudo num modelo coerente
```

### Pipeline de Criação de Clones

Inspirado no `@oalanicolas` (Alan Nicolas) do AIOX. Localizado em pasta separada no código AIOX.

### Governança de Clones

Bloqueia criação de clones sem DNA extraído (mesmo modelo do AIOX com `mind-clone-governance.py`).

---

## 5. Modelo LLM (DECIDIDO)

- **Mesmo modelo** para Agents e Clones
- Diferença está no **prompt** (Clone tem DNA completo como system prompt)
- **Cache** de DNA do Clone (prompts grandes ~3-5K tokens)

---

## 6. Fluxo Completo: Mensagem → Resposta

```
Usuário digita: "Helena, quantos dias de férias eu tenho?"
                    │
                    ▼
┌─────────────────────────────────────────────────────┐
│  NCI (Container Docker do João)                      │
│                                                      │
│  1. AGENT ROUTER                                     │
│     "Helena" → match nome → agent_id: rh             │
│                                                      │
│  2. TASK ROUTER                                      │
│     "quantos dias de férias" →                       │
│     match_patterns → command: saldo-ferias           │
│                                                      │
│  3. EXECUTOR DISPATCH                                │
│     command.responsavel_type: worker                  │
│     → workers/erp-query.js(vacation, balance)         │
│                                                      │
│  4. RESPONSE                                         │
│     template: "Seu saldo: {result.days} dias"        │
│     + tom da Helena (acolhedor, profissional)         │
│     → "Seu saldo: 12 dias"                           │
└─────────────────────────────────────────────────────┘
```

---

## 7. Estrutura de Arquivos do NCI

```
nci-container/
├── router/
│   ├── agent-router.js        # Quem responde (qual agente/clone)
│   ├── task-router.js         # O que fazer (qual command)
│   └── executor-dispatch.js   # Como executar (qual executor type)
│
├── executors/
│   ├── worker.js              # Funções determinísticas locais
│   ├── worker-api.js          # Chama APIs externas (não-AI)
│   ├── agent.js               # LLM com persona genérica
│   ├── clone.js               # LLM com DNA Mental
│   └── human.js               # Escalation para humano real
│
├── agents/                    # Definições de persona (tom, regras)
│   ├── helena-rh.yaml
│   ├── carlos-finance.yaml
│   └── concierge.yaml
│
├── clones/                    # DNA Mental extraído
│   └── ceo-joao/
│       ├── voice-dna.yaml
│       ├── thinking-dna.yaml
│       └── identity.yaml
│
├── tasks/                     # Task definitions (universal)
│   ├── saldo-ferias.yaml      # responsavel_type: worker
│   ├── orientar-beneficios.yaml   # responsavel_type: agente
│   ├── aprovar-compra.yaml    # responsavel_type: humano
│   └── mentoria-ceo.yaml     # responsavel_type: clone
│
└── workers/                   # Implementações dos workers
    ├── erp-query.js
    ├── ticket-create.js
    └── report-generate.js
```

---

## 8. Tabela de Decisões Consolidadas

| # | Item | Decisão | Status |
|---|---|---|---|
| 1 | Estratégia de routing | Híbrida (patterns → LLM → concierge) | ✅ DECIDIDO |
| 2 | Tipos de executor | 5: Worker, Worker API, Agente, Clone, Humano | ✅ DECIDIDO |
| 3 | Worker na hierarquia | Nível de TASK (atributo), não de Agent | ✅ DECIDIDO |
| 4 | Agent vs Clone | Separados. Clone = DNA Mental de pessoa real | ✅ DECIDIDO |
| 5 | DNA para clones | Simplificado MVP (3 YAMLs), arquitetura completa prevista | ✅ DECIDIDO |
| 6 | Modelo LLM | Mesmo modelo para agents e clones | ✅ DECIDIDO |
| 7 | Cache de DNA | Sim, DNA em cache (prompts grandes) | ✅ DECIDIDO |
| 8 | Pipeline de clones | Inspirado no @oalanicolas do AIOX | ✅ DECIDIDO |
| 9 | Governança de clones | Sim, bloqueia criação sem DNA extraído | ✅ DECIDIDO |
| 10 | Lifecycle do container | — | ⏳ PENDENTE |
| 11 | Comunicação entre NCIs | — | ⏳ PENDENTE |
| 12 | Persistência e memória | — | ⏳ PENDENTE |
| 13 | Modelo de dados (schema) | — | ⏳ PENDENTE |
| 14 | Segurança e isolamento | — | ⏳ PENDENTE |
| 15 | Observabilidade | — | ⏳ PENDENTE |

---

## 9. Referências AIOX Consultadas

| Módulo AIOX | Path | Relevância |
|---|---|---|
| L2 Agent Layer | `.aiox-core/core/synapse/layers/l2-agent.js` | Agent detection patterns |
| L7 Star-Command Layer | `.aiox-core/core/synapse/layers/l7-star-command.js` | Pattern matching |
| Skill Dispatcher | `.aiox-core/core/orchestration/skill-dispatcher.js` | Agent → Skill mapping |
| Subagent Dispatcher | `.aiox-core/core/execution/subagent-dispatcher.js` | Task routing (4 levels) |
| Workflow Orchestrator | `.aiox-core/core/orchestration/workflow-orchestrator.js` | Multi-agent sequencing |
| Prompt Builder | `.aiox-core/core/orchestration/subagent-prompt-builder.js` | Prompt assembly |
| Session Manager | `.aiox-core/core/synapse/session/session-manager.js` | Session state |
| Context Detector | `.aiox-core/core/session/context-detector.js` | Session type detection |
| Executor Decision Tree | `.aiox-core/docs/standards/EXECUTOR-DECISION-TREE.md` | 4 executor types + decision flow |
| Service Registry | `.aiox-core/core/registry/service-registry.json` | 199 workers cataloged |
| Clone Mind Skill | `.claude/skills/clone-mind.md` | DNA Mental pipeline |
| Mind Clone Governance | `.claude/hooks/mind-clone-governance.py` | Clone creation governance |
| Business Model | `.aiox-core/docs/standards/AIOX-LIVRO-DE-OURO-V2.1-COMPLETE.md` | Agent vs Clone vs Worker distinction |

---

## 10. Próximos Passos

Para continuar na próxima sessão:

1. **Lifecycle do container** — Spawn, idle timeout, destroy, scaling
2. **Comunicação entre NCIs** — Quando agentes de containers diferentes interagem
3. **Persistência e memória** — O que sobrevive entre sessões
4. **Modelo de dados** — Schema das tasks, agents, clones (YAML definitions)
5. **Segurança e isolamento** — RLS, secrets, permissões por NCI
6. **Observabilidade** — Logs, métricas, dashboards (CLI First!)

---

*NCI Architecture Decisions — Session 2026-03-22*
*Branch: claude/analyze-image-tr45K*
