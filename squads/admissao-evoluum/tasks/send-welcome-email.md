---
id: send-welcome-email
name: Send Welcome Email with Asana Form
agent: admissao-comms
category: communication
complexity: low
---

# Send Welcome Email with Asana Form

## Purpose

Enviar e-mail de boas-vindas ao cooperado com link do formulario Asana, SOMENTE apos aceite da proposta.

## Input

### Required Parameters

- **candidate_name**: `string`
- **email**: `string` - E-mail pessoal do cooperado

### From Config

- **form_link**: loaded from `data/asana-config.yaml`
- **template**: loaded from `templates/email-boas-vindas.yaml`
- **sender**: loaded from `data/asana-config.yaml` (e-mail da Pati)

## Pre-conditions

- [ ] Proposta foi aceita pelo candidato (estado PROPOSAL_ACCEPTED)
- [ ] E-mail pessoal do candidato e valido

## Process

### Step 1: Load Template

1. Carregar template: `templates/email-boas-vindas.yaml`
2. Carregar link do formulario: `data/asana-config.yaml`

### Step 2: Fill Template

1. Substituir `[NOME]` -> candidate_name
2. Substituir `[DATA_LIMITE]` -> data atual + 24h
3. Substituir `[LINK_ASANA_FORM]` -> form_link do config

### Step 3: Send Email

1. Enviar via Gmail API
2. Remetente: e-mail da Pati (config)
3. Destinatario: email pessoal do cooperado
4. Titulo: "Seja Bem-Vindo(a) a Evoluum!"

### Step 4: Update State

1. Notificar Nova: estado -> WELCOME_SENT
2. Log: "E-mail de boas-vindas enviado para {candidate_name}"

## Output

- **email_sent**: `boolean`
- **sent_at**: `string` (timestamp)
- **form_deadline**: `string` (data limite para responder)
