# Squad: admissao-evoluum

Squad de automacao do processo de admissao cooperativa da Evoluum.

## Agentes

| Agente | Nome | Papel |
|--------|------|-------|
| admissao-orchestrator | Nova | Orquestra fluxo, gerencia estado, webhooks Asana |
| admissao-comms | Iris | Gera propostas, envia e-mails |

## Fase Atual: 1 - Recepcao

| Etapa | Descricao | Agente | Tipo |
|-------|-----------|--------|------|
| E01 | Gerar e enviar proposta | Iris | Semi-Auto |
| E02 | Aguardar aceite | Nova | Aguardar |
| E03 | Enviar boas-vindas + formulario | Iris | Auto |
| E04 | Aguardar formulario preenchido | Nova | Aguardar |

## Estrutura

```
admissao-evoluum/
  config.yaml              # Configuracao do squad
  README.md                # Este arquivo
  agents/
    admissao-orchestrator.md  # Nova
    admissao-comms.md         # Iris
  tasks/
    start-admission.md
    generate-proposal.md
    send-welcome-email.md
    extract-form-data.md
    check-status.md
    preview-proposal.md
  templates/
    proposta-cooperativa.yaml
    email-boas-vindas.yaml
  data/
    asana-config.yaml
    beneficios-evoluum.yaml
    gptw-rules.yaml
    admission-states.yaml
  workflows/
    wf-admission-phase1.yaml
  checklists/
    admission-phase1-checklist.md
  scripts/
    (vazio - sera preenchido na implementacao)
```

## Referencia

- SOP: `../../sop-processo-admissao-v2.md`
- PDF original: PPI 0002 - Processo de Admissao Cooperativa
