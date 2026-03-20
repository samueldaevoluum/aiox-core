---
id: generate-proposal
name: Generate Admission Proposal
agent: admissao-comms
category: communication
complexity: medium
---

# Generate Admission Proposal

## Purpose

Gerar proposta visual de contratacao cooperativa para candidato aprovado, seguindo o layout Evoluum e regras GPTW.

## Input

### Required Parameters

- **candidate_name**: `string`
- **cargo**: `string`
- **valor_mensal**: `number`
- **data_inicio**: `string` (DD/MM/YYYY)

### From Config

- **beneficios**: loaded from `data/beneficios-evoluum.yaml`
- **gptw_rules**: loaded from `data/gptw-rules.yaml`
- **template**: loaded from `templates/proposta-cooperativa.yaml`

## Process

### Step 1: Load Template and Data

1. Carregar template da proposta: `templates/proposta-cooperativa.yaml`
2. Carregar lista de beneficios: `data/beneficios-evoluum.yaml`
3. Carregar regras GPTW: `data/gptw-rules.yaml`

### Step 2: Fill Template

1. Substituir campos dinamicos:
   - `[NOME]` -> candidate_name
   - `[CARGO]` -> cargo
   - `[VALOR]` -> valor_mensal formatado (R$ X.XXX,00)
   - `[VALOR_EXTENSO]` -> valor por extenso
   - `[DATA_INICIO]` -> data_inicio formatada
2. Manter conteudo fixo (beneficios, empresa, call to action)

### Step 3: Apply GPTW Rules

1. Verificar posicionamento dos selos GPTW conforme regras
2. Incluir: "Melhores Empresas Para Trabalhar"
3. Incluir: "Great Place To Work Certified"
4. Validar que logos estao no formato e posicao corretos

### Step 4: Generate Visual

1. Opcao A: Canva Connect API (preencher template existente)
2. Opcao B: Geracao via IA (seguindo layout de referencia)
3. Output: PDF ou imagem da proposta

### Step 5: Request Human Validation

1. Enviar preview para Pati (Asana comment ou Slack)
2. Aguardar aprovacao: "Proposta OK?" (SIM/NAO)
3. Se NAO: solicitar correcoes e voltar ao Step 2
4. Se SIM: marcar como aprovada, pronta para envio

## Output

- **proposal_file**: `string` - Path do arquivo gerado (PDF/imagem)
- **status**: `string` - "approved" ou "pending_review"
- **preview_sent_to**: `string` - Canal onde preview foi enviado

## Checklist

- [ ] Todos campos dinamicos preenchidos corretamente
- [ ] Lista de beneficios completa (11 itens)
- [ ] Logos GPTW posicionadas conforme regras
- [ ] Valor por extenso confere com valor numerico
- [ ] Preview enviado para validacao da Pati
- [ ] Pati aprovou a proposta
