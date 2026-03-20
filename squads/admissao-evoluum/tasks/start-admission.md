---
id: start-admission
name: Start Admission Process
agent: admissao-orchestrator
category: admission
complexity: low
---

# Start Admission Process

## Purpose

Iniciar o processo de admissao para um novo candidato aprovado, seja via webhook Asana (automatico) ou manualmente via comando.

## Input

### Required Parameters

- **candidate_name**: `string`
  - Description: Nome completo do candidato aprovado
  - Validation: Must be at least 3 characters

- **source**: `string`
  - Options: `"webhook"` (Asana trigger), `"manual"` (comando direto)
  - Default: `"manual"`

### Optional Parameters (required if source=manual)

- **cargo**: `string`
- **time**: `string`
- **gestao_direta**: `string`
- **salario**: `number`
- **email_pessoal**: `string`
- **telefone**: `string`
- **data_inicio**: `string` (DD/MM/YYYY)

## Process

### Step 1: Validate Input

1. Verificar se todos os dados obrigatorios estao presentes
2. Se source=webhook: extrair dados dos comentarios da tarefa Asana
3. Se source=manual: usar dados fornecidos no comando

### Step 2: Create Admission Record

1. Gerar admission_id: `adm-{YYYYMMDD}-{candidato_first_name}`
2. Criar arquivo de estado: `data/admissions/{admission_id}.json`
3. Estado inicial: `TRIGGERED`
4. Salvar todos os dados do candidato

### Step 3: Dispatch to Iris

1. Notificar @iris para gerar proposta (E01)
2. Atualizar estado para `PROPOSAL_GENERATING`
3. Log: "Admissao {admission_id} iniciada para {candidate_name}"

### Step 4: Notify Pati

1. Criar comentario na tarefa Asana: "Processo de admissao iniciado. Proposta sendo gerada."
2. (Opcional) Notificar Pati via Slack

## Output

- **admission_id**: `string` - ID unico da admissao
- **state**: `string` - Estado atual (TRIGGERED)
- **next_action**: `string` - Proxima acao esperada

## Error Handling

- **Strategy:** retry
- **Missing data:** Solicitar dados faltantes ao usuario
- **Asana API error:** Retry 2x, depois notificar usuario
