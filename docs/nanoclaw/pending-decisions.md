# Decisoes Pendentes — Consolidado

> **Atualizado:** 2026-03-22
> **Fonte unica de verdade** para todas as decisoes pendentes da plataforma.
> Decisoes ja tomadas estao em `architecture-decisions.md`, `NCI-ARCHITECTURE-DECISIONS.md` e `full-architecture.md`.

---

## Resumo

| Prioridade | Total | Descricao |
|------------|-------|-----------|
| CRITICA | 4 | Bloqueia inicio da implementacao |
| ALTA | 4 | Decidir antes ou durante MVP |
| MEDIA | 4 | Decidir antes do lancamento |
| BAIXA | 2 | Pode evoluir depois |
| ADR (AIOX) | 2 | Propostas do framework AIOX aguardando aprovacao |

---

## CRITICAS — bloqueiam implementacao

### P1. Lifecycle do Container NCI
- **Origem:** `NCI-ARCHITECTURE-DECISIONS.md` #10 + `architecture-decisions.md` 5.8
- **Perguntas:**
  - Hibernacao de NCI: timeout fixo? Baseado em atividade? Quanto tempo?
  - Hibernacao de NanoClaw process (empresa): quanto tempo sem atividade?
  - Sync de memoria container → PostgreSQL: hook pos-sessao? Streaming?
  - Health check de NCIs: frequencia? O que monitora?
- **Impacto:** Sem isso nao da pra gerenciar recursos e custos de containers

### P2. Seguranca, Permissoes e RLS
- **Origem:** `architecture-decisions.md` 5.7 + `NCI-ARCHITECTURE-DECISIONS.md` #14
- **Perguntas:**
  - Modelo de permissoes detalhado (quem pode o que)
  - RLS policies no PostgreSQL (como implementar isolamento por empresa)
  - Como `memory_access` do agente se traduz em queries SQL
  - Audit log de acessos sensiveis (o que logar, onde armazenar)
- **Impacto:** Sem RLS, dados de uma empresa podem vazar para outra

### P3. Persistencia e Memoria entre Sessoes
- **Origem:** `NCI-ARCHITECTURE-DECISIONS.md` #12
- **Perguntas:**
  - O que sobrevive quando um container NCI e destruido?
  - Memoria pessoal: sync automatico ou manual?
  - Historico de conversas: armazenar completo ou resumido?
  - Limite de historico por NCI (ultimas N conversas? ultimos N dias?)
- **Impacto:** Sem isso, usuarios perdem contexto entre sessoes

### P4. Modelo de Dados / Schema
- **Origem:** `NCI-ARCHITECTURE-DECISIONS.md` #13
- **Perguntas:**
  - Schema PostgreSQL completo (tabelas, relacoes, indices)
  - Formato das definicoes de agents/clones no banco (JSON? YAML serializado?)
  - Schema de tasks, commands, workflows
  - Versionamento de agent definitions
- **Impacto:** Sem schema definido, nao da pra implementar nada

---

## ALTAS — decidir antes ou durante MVP

### P5. Base de Conhecimento de Gestao
- **Origem:** `architecture-decisions.md` 5.3
- **Perguntas:**
  - Qual o formato dessa base? (PDFs, documentos, frameworks, metodologias?)
  - E conteudo proprietario ou publico?
  - Como integrar: como knowledge base padrao (RAG) ou como system prompt?
  - Diferencial competitivo: agents aconselham com base em frameworks comprovados (OKR, BSC, Lean)?
- **Impacto:** Define se a plataforma e "chatbot com docs" ou "consultor de gestao com IA"

### P6. Agents Genericos para Implantacao
- **Origem:** `architecture-decisions.md` 5.4
- **Perguntas:**
  - Quais agents genericos criar primeiro? (RH, Financeiro, Marketing, Vendas, Suporte, Juridico)
  - Qual a ordem de prioridade?
  - Cada agent generico vem com quais tasks pre-configuradas?
- **Impacto:** Define o catalogo inicial do produto

### P7. Estrutura do Repo da Plataforma
- **Origem:** `architecture-decisions.md` 5.5
- **Perguntas:**
  - Confirmar estrutura proposta (server/ + web/ + db/ + docker/ + agents/ + docs/)
  - Nome do repo
  - Monorepo ou multi-repo? (proposta atual: monorepo)
- **Impacto:** Precisa estar definido antes de comecar a codar

### P8. Comunicacao entre NCIs
- **Origem:** `NCI-ARCHITECTURE-DECISIONS.md` #11
- **Perguntas:**
  - Quando agentes de containers diferentes precisam interagir?
  - Cenarios: transferencia de conversa, consulta cross-agent, workflow multi-NCI
  - Protocolo: via PostgreSQL (shared state)? Via IPC? Via API?
- **Impacto:** Afeta workflows que envolvem multiplos departamentos

---

## MEDIAS — decidir antes do lancamento

### P9. Autenticacao Cross-Channel
- **Origem:** `architecture-decisions.md` 5.8 (sub-item)
- **Perguntas:**
  - Como identificar o mesmo usuario em Telegram vs WebChat vs WhatsApp?
  - OAuth? Token por canal? SSO? Vinculacao manual?
- **Impacto:** Necessario quando adicionar segundo canal alem do Telegram

### P10. Scaling Horizontal
- **Origem:** `architecture-decisions.md` 5.8 (sub-item)
- **Perguntas:**
  - Multiplos hosts rodando Lifecycle Managers?
  - Como distribuir NCIs entre hosts?
  - Service discovery entre hosts
- **Impacto:** Necessario quando volume de usuarios crescer

### P11. Observabilidade
- **Origem:** `NCI-ARCHITECTURE-DECISIONS.md` #15
- **Perguntas:**
  - Logs: formato, retencao, onde armazenar
  - Metricas: quais coletar (latencia, tokens, custos, errors)
  - Dashboards: ferramentas (Grafana? Custom? CLI First!)
  - Alertas: quando e como notificar
- **Impacto:** CLI First — observabilidade deve funcionar via CLI antes de qualquer dashboard

### P12. Workflow de Admissao (Exemplo de Referencia)
- **Origem:** `architecture-decisions.md` 5.6
- **Contexto:** 10 steps com mixed executors, integracao ClickUp, human-in-the-loop bidirecional
- **Status:** Discutido como exemplo, nao implementado
- **Acao:** Usar como caso de teste do Workflow Engine quando implementar

---

## BAIXAS — podem evoluir depois

### P13. Modelo de Pricing/Billing
- **Origem:** `architecture-decisions.md` 5.9
- **Status:** NAO DISCUTIDO
- **Contexto:** Como cobrar clientes (por NCI? por mensagem? por empresa? flat fee?)

### P14. Nome da Plataforma
- **Origem:** `architecture-decisions.md` 5.10
- **Status:** NAO DISCUTIDO
- **Contexto:** NanoClaw e o framework, nao o produto. Precisamos de um nome.

---

## ADRs do AIOX (framework) — aguardando aprovacao

Estas decisoes sao do **framework AIOX**, nao da plataforma. Listadas aqui para referencia.

### ADR-HCS: Health Check System
- **Arquivo:** `docs/pt/architecture/adr/adr-hcs-health-check-system.md`
- **Status:** Proposto
- **Resumo:** Sistema de health check para diagnosticar problemas no AIOX

### ADR-COLLAB-2: Branch Protection / Contribuicao Externa
- **Arquivo:** `docs/pt/architecture/adr/ADR-COLLAB-2-proposed-configuration.md`
- **Status:** Proposto
- **Resumo:** Configuracao de branch protection e workflow de contribuidores externos

---

## Decisoes Ja Tomadas (referencia rapida)

Documentadas em detalhe nos arquivos originais. Resumo:

| # | Decisao | Onde |
|---|---------|------|
| 1 | Repo separado, NanoClaw via IPC | `architecture-decisions.md` 3.1 |
| 2 | PostgreSQL (substituindo SQLite) | `architecture-decisions.md` 3.2 |
| 3 | Telegram como canal MVP | `architecture-decisions.md` 3.3 |
| 4 | Um bot Telegram por cliente | `architecture-decisions.md` 3.4 |
| 5 | Ollama on-premise (modelo 8B) | `architecture-decisions.md` 3.5 |
| 6 | 1 NanoClaw Process/empresa, 1 NCI/usuario | `architecture-decisions.md` 3.6 |
| 7 | Knowledge Base via RAG/pgvector | `architecture-decisions.md` 3.7 |
| 8 | Admin UI em Next.js | `architecture-decisions.md` 3.8 |
| 9 | Deploy VPS com Docker Compose | `architecture-decisions.md` 3.9 |
| 10 | Formato rico de agents (inspirado AIOX) | `architecture-decisions.md` 3.10 |
| 11 | Task-first com 5 executores | `architecture-decisions.md` 3.11 |
| 12 | Backend Python/FastAPI | `architecture-decisions.md` 3.12 |
| 13 | Hybrid Router 4 niveis | `NCI-ARCHITECTURE-DECISIONS.md` #1-2 |
| 14 | 5 tipos de executor + decision tree | `NCI-ARCHITECTURE-DECISIONS.md` #2-3 |
| 15 | Agent vs Clone (DNA Mental) | `NCI-ARCHITECTURE-DECISIONS.md` #4 |
| 16 | Mesmo modelo LLM para agents e clones | `NCI-ARCHITECTURE-DECISIONS.md` #5 |
| 17 | Pipeline de clones (inspirado @oalanicolas) | `NCI-ARCHITECTURE-DECISIONS.md` #8 |
| 18 | Governanca de clones | `NCI-ARCHITECTURE-DECISIONS.md` #9 |
| 19 | Gateway centralizado (FastAPI) | `full-architecture.md` #1 |
| 20 | Task Router (Hybrid Router + Decision Tree) | `architecture-decisions.md` 5.1 |
| 21 | Function Calling hoje, MCP futuro | `architecture-decisions.md` 5.2 |
| 22 | 4 camadas de memoria por NCI | `full-architecture.md` #6 |
| 23 | RLS por empresa no PostgreSQL | `full-architecture.md` #12 |
| 24 | Tool Router com validacao + audit | `full-architecture.md` #11 |
| 25 | 7 camadas de arquitetura | `full-architecture.md` |

---

*Documento consolidado — fonte unica de decisoes pendentes*
*Atualizado: 2026-03-22 | Sessao: claude/analyze-image-tr45K*
