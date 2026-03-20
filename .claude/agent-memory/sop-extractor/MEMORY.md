# @sop-extractor Memory - SOP Extraction Specialist

## Quick Stats
- SOPs extraídos: 1
- Fontes processadas: 1
- Validações: 1 (revisão crítica da análise do @analyst)

---

## SOPs Extraídos
<!-- Formato: [DATA] sop-name → arquivo (fonte) -->

---

## Patterns de Extração
<!-- O que funciona para extrair SOPs -->

### De Vídeos/Podcasts
- Identificar "when I do X, I always..."
- Capturar sequências numeradas
- Notar repetições (indica importância)

### De Livros/Artigos
- Buscar checklists explícitos
- Extrair "step 1, step 2..."
- Identificar "never do X without Y"

### De Entrevistas
- Perguntas sobre processo revelam SOPs
- "Walk me through..." = goldmine
- Contradições indicam nuance importante

### De PDFs de Processo (aprendido em 2026-03-18)
- Campos destacados em amarelo = regras críticas ou status especial (ex: "EM TESTE")
- Texto highlighted em azul/cinza = templates de comunicação — copiar literalmente
- Instruções em nota de rodapé ou "OBS:" = edge cases importantes que analistas frequentemente ignoram
- Sempre verificar se um e-mail e uma etapa separada ou parte de outra etapa já mapeada
- Documentos externos referenciados (planilhas, links Drive) = sub-etapas com nome próprio

---

## Erros Comuns de Analistas (padrão identificado)
- Colapsar duas etapas distintas por timing semelhante (ex: D-1 WhatsApp + D-0 e-mail)
- Não capturar etapas de "salvar/registrar" (baixa visibilidade, alto impacto)
- Subdocumentar etapas com múltiplos documentos/planilhas (tratar como "1 tarefa" quando são 3+)
- Ignorar diferenciações de fluxo por tipo de perfil (ex: SQUAD vs Low Code/Outsourcing)
- Omitir regras de veto/pre-condição do processo
- Omitir co-responsáveis não óbvios (ex: Samuel assina documento junto com cooperado)
- Contar "e-mails" sem ler os templates (pode ser 2, não 3)

---

## Formatos de Output
<!-- Templates que funcionam -->

### SOP Padrão
```markdown
## SOP: [Nome]
**Trigger:** Quando usar
**Steps:**
1. Passo 1
2. Passo 2
**Veto:** Quando NÃO usar
**Output:** O que deve existir ao final
```

---

## Erros Comuns
- Extrair processo genérico (não é SOP)
- Misturar múltiplos SOPs em um
- Não incluir veto conditions
- Não capturar templates de comunicação literais
- Não identificar dependências entre etapas (A depende de B)
- Não marcar etapas com restrições temporais estritas (timing crítico)

---

## Notas Recentes
- [2026-02-05] Agent Memory implementado - Epic AAA
