# Descricao do Projeto — Plataforma de Agentes IA para Negocios

> **Data:** 2026-03-23
> **Status:** Pre-MVP
> **Cliente inicial:** Evoluum (empresa do fundador)

---

## O que e este projeto

Este projeto e uma plataforma de agentes de inteligencia artificial voltada para empresas. A ideia central e simples: colaboradores de uma empresa conversam com agentes especializados pelo Telegram, e esses agentes entendem o contexto do negocio, respondem com inteligencia e executam acoes reais nos sistemas da empresa — como criar tasks no Asana, consultar deals no Pipedrive ou acompanhar processos internos.

O primeiro cliente e a propria Evoluum, empresa do fundador. O MVP atende dois departamentos: RH e Comercial. O agente de RH, chamado Helena, ajuda com processos de admissao, duvidas sobre ferias, beneficios e politicas internas. O agente Comercial auxilia com pipeline de vendas, acompanhamento de deals e follow-ups. Ambos conversam em portugues brasileiro, cada um com seu tom e suas regras — Helena e acolhedora e precisa, o Comercial e direto e orientado a resultados.

A plataforma nao e construida do zero. Ela se apoia em tres pecas distintas que trabalham juntas. A primeira e o AIOX, um framework de construcao de agentes que serve como inspiracao e referencia para o formato rico de definicao de agentes — com personas, arquetipos, estilos de comunicacao, principios e comandos. A segunda e o NanoClaw, um orquestrador open-source leve (~3.900 linhas de codigo, ~15 arquivos) que ja oferece integracao nativa com Telegram, isolamento por container Docker, filas de mensagem por grupo, memoria persistente e suporte ao Claude Agent SDK. A terceira peca e a plataforma em si — o produto que estamos construindo — que usa o NanoClaw como motor de orquestracao e adiciona tudo o que ele nao tem: backend robusto em Python com FastAPI, banco PostgreSQL, integracoes bidirecionais com ferramentas externas, webhooks, logging e, no futuro, knowledge base com RAG via pgvector, workflow engine com executores mistos e interface web administrativa.

A arquitetura do MVP e intencionalmente simples. O NanoClaw recebe mensagens do Telegram, processa via Claude API e, quando precisa agir no mundo, faz chamadas HTTP (function calling) para o FastAPI, que executa a logica de negocio — consultar o Asana, atualizar o Pipedrive, registrar no banco. O PostgreSQL armazena usuarios, logs de chamadas de tools, eventos de webhooks e acompanhamento de processos. Tudo roda em Docker Compose numa VPS.

O routing entre agentes nao exige implementacao de codigo. O CLAUDE.md — arquivo que serve como system prompt do Claude — define quem sao os agentes, quando cada um deve ser ativado, qual tom usar e quais regras seguir. O Claude decide sozinho, pelo contexto da mensagem, qual persona ativar. Isso elimina a necessidade de um router customizado na Fase 1.

A implementacao segue tres fases. A primeira estabelece a conversa funcionando: bot no Telegram, NanoClaw configurado, Claude respondendo com as personas corretas, FastAPI esqueleto e banco pronto. A segunda adiciona as integracoes reais com Asana e Pipedrive — tools implementados, webhooks bidirecionais, agentes que consultam e atuam nos sistemas. A terceira leva para producao com SSL, Nginx e deploy na VPS com webhooks publicos.

A visao de longo prazo inclui multi-tenancy (multiplas empresas), knowledge base com RAG para consultas a documentos internos, clones com DNA Mental que emulam pessoas reais da empresa, workflow engine com processos multi-step e executores mistos (workers deterministicos, agentes IA e escalacao humana), e migracao para modelos open-source on-premise via Ollama para controle de custo e privacidade.

---

*Descricao do Projeto — 2026-03-23*
*Sessao: claude/analyze-image-tr45K*
