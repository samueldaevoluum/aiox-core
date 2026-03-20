---
id: check-status
name: Check Admission Status
agent: admissao-orchestrator
category: monitoring
complexity: low
---

# Check Admission Status

## Purpose

Listar todas as admissoes em andamento com seus estados atuais.

## Process

1. Listar arquivos em `data/admissions/*.json`
2. Para cada admissao, mostrar:
   - admission_id
   - candidate_name
   - estado atual
   - ultima atualizacao
   - proxima acao esperada
3. Formatar como tabela

## Output

Tabela com todas as admissoes ativas e seus estados.
