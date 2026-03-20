---
id: extract-form-data
name: Extract Form Data from Asana Submission
agent: admissao-orchestrator
category: data
complexity: medium
---

# Extract Form Data from Asana Submission

## Purpose

Extrair e estruturar os dados do formulario Asana preenchido pelo cooperado, organizando em 3 blocos para uso nas fases seguintes.

## Input

- **admission_id**: `string`
- **form_submission_id**: `string` (Asana form submission ID)

## Process

### Step 1: Fetch Form Data

1. Usar Asana API para buscar submission completa
2. Extrair todos os campos respondidos

### Step 2: Parse and Structure

1. Organizar em 3 blocos:

**Bloco 1 - Dados Cadastrais:**
- nome_completo, email_pessoal, endereco (rua, n, complemento, bairro, cidade, estado, CEP)
- data_nascimento, cpf, rg, celular
- deficiencia, genero, escolaridade, ingles, pronome, etnia_raca
- estado_civil, filhos, conta_bancaria, contato_emergencial

**Bloco 2 - Documentos:**
- certificado_escolar (URL do upload)
- consentimento_lgpd (boolean)

**Bloco 3 - Conhecer Voce:**
- sobrenome_preferido_email, tamanho_camisa, apelido
- cidade_natal, pets, hobbies, musica_banda, serie, jogo, curiosidade
- selfie (URL do upload), fotos_pets_hobbies (URLs)

### Step 3: Validate Critical Fields

1. Verificar campos obrigatorios preenchidos
2. Validar formato do CPF
3. Verificar upload do certificado escolar
4. Verificar consentimento LGPD = true

### Step 4: Save Structured Data

1. Atualizar arquivo de estado: `data/admissions/{admission_id}.json`
2. Adicionar campo `form_data` com os 3 blocos estruturados
3. Atualizar estado: FORM_COMPLETED -> PHASE_2_READY

## Output

- **form_data**: `object` - Dados estruturados em 3 blocos
- **validation_errors**: `array` - Campos com problemas (se houver)
- **email_format**: `string` - E-mail Evoluum sugerido: {nome}.{sobrenome_escolhido}@evoluum.com.br
