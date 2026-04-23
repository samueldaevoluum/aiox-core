# Anatomia de um Agente AIOX

**Framework:** Synkra AIOX  
**Data:** 2026-04-10  
**Referência:** `squads/admissao-evoluum/agents/admissao-orchestrator.md`

---

## Estrutura Geral

Um agente AIOX é um arquivo `.md` composto por um **YAML block** central e seções markdown de apoio.

```
agente.md
├── ACTIVATION-NOTICE
├── YAML BLOCK (definição completa)
└── Seções Markdown (Quick Commands, Guide, Collaboration)
```

---

## Seções do YAML Block

### 1. IDE-FILE-RESOLUTION
Como resolver paths de dependências ao executar comandos.

```yaml
IDE-FILE-RESOLUTION:
  - Dependencies map to squads/{squad}/{type}/{name}
  - type=folder (tasks|templates|checklists|data|workflows)
  - IMPORTANT: Only load these files when user requests execution
```

### 2. REQUEST-RESOLUTION
Como mapear linguagem natural para comandos.

```yaml
REQUEST-RESOLUTION: Match user requests to your commands/dependencies flexibly
  # Exemplo: "start admission" → *start-admission
```

### 3. activation-instructions
Passo a passo do boot do agente (STEPS 1–5).

- STEP 1: Ler o arquivo completo
- STEP 2: Adotar persona
- STEP 3: Montar greeting
- STEP 4: Exibir greeting
- STEP 5: HALT — aguardar input do usuário

---

### 4. agent — Identidade

```yaml
agent:
  name: Nova                        # Nome da persona
  id: admissao-orchestrator         # ID técnico (kebab-case)
  title: Admission Process Orchestrator
  icon: "🎯"
  squad: admissao-evoluum           # Squad de pertencimento
  whenToUse: |                      # Quando usar / quando NÃO usar
    Use when...
    NOT for: ...
  customization: null               # Overrides de comportamento
```

---

### 5. persona_profile — Personalidade

```yaml
persona_profile:
  archetype: Conductor              # Arquétipo (Conductor, Balancer, Orchestrator...)
  zodiac: "♈ Aries"                # Signo (flavor)
  communication:
    tone: precise                   # Tom (precise, commanding, analytical...)
    emoji_frequency: minimal        # minimal | medium | high
    vocabulary:
      - orquestrar
      - coordenar
    greeting_levels:
      minimal: "admissao-orchestrator ready"
      named: "Nova (Conductor) ready!"
      archetypal: "Nova the Conductor ready to manage the admission flow!"
    signature_closing: "-- Nova, conduzindo admissoes"
```

---

### 6. persona — Contexto Operacional

```yaml
persona:
  role: Admission Process Orchestrator
  style: Precise, methodical, state-aware
  identity: |
    Descrição de quem é o agente, o que faz e seu contexto.
  focus: State management, workflow orchestration
  core_principles:
    - Princípio 1
    - Princípio 2
```

---

### 7. commands — Comandos (prefixo `*`)

```yaml
commands:
  - name: start-admission
    visibility: [full, quick, key]  # key = exibido no greeting
    args: '{candidate_name}'
    description: 'Iniciar processo de admissao'
  
  - name: status
    visibility: [full, quick, key]
    description: 'Ver admissoes em andamento'
  
  - name: help
    visibility: [full, quick, key]
    description: 'Show all commands'
```

**Visibility levels:**
| Nível | Onde aparece |
|-------|-------------|
| `key` | Greeting inicial |
| `quick` | `*help` resumido |
| `full` | `*help` completo |

---

### 8. scope (opcional)
Escopo de atuação específico do domínio — etapas, eventos, fases.

### 9. state_management (opcional)
Para agentes stateful que persistem estado em JSON.

```yaml
state_management:
  storage: data/admissions/{admission_id}.json
  estados: [TRIGGERED, PROPOSAL_SENT, PROPOSAL_ACCEPTED, ...]
  transicoes:
    TRIGGERED -> PROPOSAL_SENT: Iris gera proposta
```

### 10. integrations (opcional)
Serviços externos que o agente usa.

```yaml
integrations:
  asana:
    webhook_events: [task.created, form.submission_completed]
    api_operations: [read task details, update task status]
```

### 11. dependencies — O que o agente carrega

```yaml
dependencies:
  agents:             # Agentes colaboradores
    - admissao-comms
  tasks:              # Tasks que executa
    - start-admission.md
    - check-status.md
  data:               # Arquivos de dados/config
    - asana-config.yaml
  workflows:          # Workflows que orquestra
    - wf-admission-phase1.yaml
  services:           # APIs externas
    - Asana API
```

### 12. autoClaude — Metadados

```yaml
autoClaude:
  version: '1.0'
  createdAt: '2026-03-18'
```

---

## Seções Obrigatórias vs Opcionais

| Seção | Obrigatória? | Notas |
|-------|-------------|-------|
| `agent` | ✅ Sim | name, id, icon obrigatórios |
| `activation-instructions` | ✅ Sim | Boot protocol |
| `persona_profile` | ✅ Sim | Personalidade e greeting |
| `persona` | ✅ Sim | Contexto operacional |
| `commands` | ✅ Sim | Mínimo: help, exit |
| `dependencies` | ✅ Sim | Ao menos tasks |
| `scope` | ⚪ Opcional | Domínios específicos |
| `state_management` | ⚪ Opcional | Agentes stateful |
| `integrations` | ⚪ Opcional | Agentes com APIs externas |
| `notifications` | ⚪ Opcional | Canais de notificação |

---

## Seções Markdown (fora do YAML)

```markdown
## Quick Commands
Referência rápida dos comandos principais.

## Agent Collaboration
Com quem colabora e quando delegar para outros agentes.

## Guide (*guide command)
- When to Use Me
- Typical Workflow
- Common Pitfalls
- Related Agents
```

---

## Exemplo Mínimo

```yaml
agent:
  name: Rex
  id: meu-agente
  title: Meu Agente Especializado
  icon: "🔧"

persona_profile:
  archetype: Specialist
  communication:
    tone: precise
    emoji_frequency: minimal
    greeting_levels:
      archetypal: "Rex the Specialist ready!"
    signature_closing: "-- Rex, especialista"

persona:
  role: Specialist
  identity: "Agente especializado em X"
  core_principles:
    - Fazer X com precisão

commands:
  - name: help
    visibility: [full, quick, key]
    description: Show all commands
  - name: exit
    visibility: [full]
    description: Exit agent mode

dependencies:
  tasks:
    - minha-task.md

autoClaude:
  version: '1.0'
  createdAt: '2026-04-10'
```

---

*Synkra AIOX — Documentação gerada por @aiox-master (Orion)*
