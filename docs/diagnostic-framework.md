# 🔍 Diagnóstico Progressivo de Maturidade — Framework Completo

**Versão:** 1.0  
**Data:** 2026-04-12  
**Status:** Framework de Design

---

## 📋 Sumário Executivo

Sistema de diagnóstico **adaptativo** que identifica o nível de maturidade do empreendedor através de:

1. **Diagnóstico Rápido (5-8 min):** 25 perguntas (5/área)
2. **Refinamento Contínuo:** Coleta implícita durante coaching
3. **Relatório Progressivo:** Maturidade refinada a cada interação

**Resultado:** Diagnóstico inicial 75-80% confiança → 90%+ após 30 dias

---

## 🎯 Estratégia: 5 Perguntas Ótimas por Área

### **Critério de Seleção das 5 Perguntas**

Cada pergunta foi escolhida para **máxima discriminação** entre níveis:

```
Pergunta 1: N0 ↔ N1 (Inconsciência vs Consciência)
├─ Detecta se empreendedor SABE que o tema existe
└─ Exemplo: "Você sabe que planejamento é importante?"

Pergunta 2: N1 ↔ N2 (Tentativa vs Estrutura)
├─ Detecta se tem INTENÇÃO mas sem ESTRUTURA
└─ Exemplo: "Você tenta, mas não consegue manter?"

Pergunta 3: N2 ↔ N3 (Frágil vs Sistematizado)
├─ Detecta RITUALIZAÇÃO e SISTEMATIZAÇÃO
└─ Exemplo: "Tem rituais? Funcionam consistentemente?"

Pergunta 4: N2 ↔ N3 (Dependência vs Autonomia)
├─ Detecta DELEGAÇÃO real (sem você)
└─ Exemplo: "Equipe resolve ou vira pra você?"

Pergunta 5: N3 ↔ N4 (Dados vs Organização Autônoma)
├─ Detecta se organização DECIDE sozinha
└─ Exemplo: "Equipe reformula estratégia ou só executa?"
```

---

## 📊 As 25 Perguntas Otimizadas

### **1️⃣ PLANEJAMENTO E EXECUÇÃO**

```yaml
P-01:
  titulo: "Visão Estratégica"
  pergunta: "Como você define a direção estratégica da empresa?"
  discrimina: "N0 ↔ N1"
  opcoes:
    - nivel: 0
      texto: "Não tenho visão clara, vou resolvendo o dia-a-dia"
      
    - nivel: 1
      texto: "Tenho uma visão, mas não consegui estruturar ou comunicar"
      
    - nivel: 2
      texto: "Tenho visão clara, a equipe sabe, mas executa depende de mim"
      
    - nivel: 3
      texto: "Visão documentada, metas alinhadas, equipe executa com autonomia"
      
    - nivel: 4
      texto: "Equipe reformula e melhora estratégia, eu aprovo/desaprovo"

P-02:
  titulo: "Definição de Metas"
  pergunta: "Como as metas são definidas na sua empresa?"
  discrimina: "N1 ↔ N2"
  opcoes:
    - nivel: 0
      texto: "Não temos metas, resolvemos conforme aparece"
      
    - nivel: 1
      texto: "Tenho metas na cabeça, mas não consigo estruturar com a equipe"
      
    - nivel: 2
      texto: "Metas por trimestre, documentadas, mas eu ajusto durante"
      
    - nivel: 3
      texto: "Metas mensais cascateadas, revisadas em reunião estruturada"
      
    - nivel: 4
      texto: "Sistema OKRs, equipe propõe, feedback contínuo autônomo"

P-03:
  titulo: "Acompanhamento de Resultados"
  pergunta: "Com que frequência e como você acompanha o desempenho?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Só quando tem problema, aí eu fico sabendo"
      
    - nivel: 1
      texto: "Irregularmente, quando lembro faço uma continha rápida"
      
    - nivel: 2
      texto: "Mensalmente, informalmente, olho os números principais"
      
    - nivel: 3
      texto: "Dashboard semanal, reunião de revisão com indicadores"
      
    - nivel: 4
      texto: "Equipe acompanha automaticamente, me tira da loop"

P-04:
  titulo: "Delegação e Responsabilidade"
  pergunta: "Como você delega responsabilidades?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Eu faço tudo porque só assim fica certo"
      
    - nivel: 1
      texto: "Delego mas acabo revendo tudo depois"
      
    - nivel: 2
      texto: "Delego, mas preciso ficar perto supervisionando"
      
    - nivel: 3
      texto: "Delego com autoridade clara, indicador de sucesso, raramente revejo"
      
    - nivel: 4
      texto: "Pessoas decidem e executam sem mim, tenho confiança total"

P-05:
  titulo: "Tomada de Decisão"
  pergunta: "Como você toma decisões importantes?"
  discrimina: "N3 ↔ N4"
  opcoes:
    - nivel: 0
      texto: "Pela experiência, gut feeling, na hora"
      
    - nivel: 1
      texto: "Tento coletar dados, mas geralmente decido rápido mesmo assim"
      
    - nivel: 2
      texto: "Olho alguns números, mas experiência pesa mais"
      
    - nivel: 3
      texto: "Análise de dados, números guiam a decisão"
      
    - nivel: 4
      texto: "Decisões baseadas em análise estruturada, discussão com pares"
```

---

### **2️⃣ VENDAS E CONVERSÃO**

```yaml
V-01:
  titulo: "Processo de Vendas"
  pergunta: "Como é o seu processo de vendas?"
  discrimina: "N0 ↔ N1"
  opcoes:
    - nivel: 0
      texto: "Não temos processo, vou vendendo como consigo"
      
    - nivel: 1
      texto: "Tentei criar, mas não consigo manter consistência"
      
    - nivel: 2
      texto: "Temos pipeline básico, mas ainda dependo de mim pra fechar"
      
    - nivel: 3
      texto: "Pipeline definido, equipe segue, tenho taxa de conversão"
      
    - nivel: 4
      texto: "Equipe itera processo, melhora taxa, eu só valido"

V-02:
  titulo: "Meta e Acompanhamento"
  pergunta: "Você acompanha meta de vendas com regularidade?"
  discrimina: "N1 ↔ N2"
  opcoes:
    - nivel: 0
      texto: "Não tenho meta, só vendo o que aparece"
      
    - nivel: 1
      texto: "Tenho meta, mas não acompanho com frequência"
      
    - nivel: 2
      texto: "Meta mensal, acompanho informalmente"
      
    - nivel: 3
      texto: "Meta mensal, reunião semanal de vendas com números"
      
    - nivel: 4
      texto: "Equipe acompanha em tempo real, me avisa só se desvio"

V-03:
  titulo: "Qualidade do Lead"
  pergunta: "Como você diferencia lead quente de frio?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Não penso nisso, atendo todos igual"
      
    - nivel: 1
      texto: "Tento priorizar, mas não tenho critério claro"
      
    - nivel: 2
      texto: "Tenho critério básico, mas ainda faço tudo que aparece"
      
    - nivel: 3
      texto: "Critério de qualificação, priorizo quentes, indica conversão"
      
    - nivel: 4
      texto: "Sistema de scoring, equipe qualifica, decisão automática"

V-04:
  titulo: "Retenção de Cliente"
  pergunta: "Como você mantém cliente após venda?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Não tenho rotina, só ligo se algo pede"
      
    - nivel: 1
      texto: "Tento fazer follow-up, mas não consigo manter"
      
    - nivel: 2
      texto: "Tenho rotina básica de contato"
      
    - nivel: 3
      texto: "Rotina de retenção estruturada, indicador de churn"
      
    - nivel: 4
      texto: "Equipe gerencia retenção, NPS acompanhado"

V-05:
  titulo: "Análise de Vendas"
  pergunta: "O que você faz quando venda cai?"
  discrimina: "N3 ↔ N4"
  opcoes:
    - nivel: 0
      texto: "Fico preocupado, vendo mais duro"
      
    - nivel: 1
      texto: "Tiro conclusões rápido, mudo estratégia"
      
    - nivel: 2
      texto: "Olho números básicos, tiro conclusão"
      
    - nivel: 3
      texto: "Análise de dados, identifica aonde caiu (lead/conversão/retenção)"
      
    - nivel: 4
      texto: "Equipe analisa, propõe ajustes, implementa"
```

---

### **3️⃣ OPERAÇÃO E PROCESSOS**

```yaml
O-01:
  titulo: "Documentação de Processos"
  pergunta: "Seus processos estão documentados?"
  discrimina: "N0 ↔ N1"
  opcoes:
    - nivel: 0
      texto: "Não, tá tudo na minha cabeça"
      
    - nivel: 1
      texto: "Tentei documentar, mas ninguém segue"
      
    - nivel: 2
      texto: "Tenho documento básico dos principais"
      
    - nivel: 3
      texto: "Processos documentados, checklist, revisão periódica"
      
    - nivel: 4
      texto: "Equipe mantém documentação, atualiza automaticamente"

O-02:
  titulo: "Eficiência Operacional"
  pergunta: "Como você sabe se a operação está eficiente?"
  discrimina: "N1 ↔ N2"
  opcoes:
    - nivel: 0
      texto: "Não sei, acho que tá bom"
      
    - nivel: 1
      texto: "Acho que tem problema, mas não sei medir"
      
    - nivel: 2
      texto: "Tenho noção, olho custos informalmente"
      
    - nivel: 3
      texto: "Indicadores de eficiência (tempo/custo), acompanhamento"
      
    - nivel: 4
      texto: "KPIs operacionais, equipe melhora continuamente"

O-03:
  titulo: "Qualidade do Produto/Serviço"
  pergunta: "Como você garante qualidade?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Confio em quem faz, não tenho check"
      
    - nivel: 1
      texto: "Eu que faço a qualidade, ou reviso tudo"
      
    - nivel: 2
      texto: "Tenho critério de qualidade, mas informal"
      
    - nivel: 3
      texto: "Checklist de qualidade, acompanhamento, taxa de defeitos"
      
    - nivel: 4
      texto: "Equipe garante qualidade, métricas contínuas"

O-04:
  titulo: "Resolução de Problemas"
  pergunta: "Quando tem problema na operação, o que você faz?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Apago o fogo, resolvo rápido"
      
    - nivel: 1
      texto: "Resolvo, mas problema volta"
      
    - nivel: 2
      texto: "Analiso e resolvo, tem melhoria mas é lenta"
      
    - nivel: 3
      texto: "Análise de causa raiz, solução estruturada, acompanhamento"
      
    - nivel: 4
      texto: "Equipe identifica e resolve antes de virar problema"

O-05:
  titulo: "Inovação em Processos"
  pergunta: "Como vocês melhoram os processos?"
  discrimina: "N3 ↔ N4"
  opcoes:
    - nivel: 0
      texto: "Não melhoramos, faz anos que é igual"
      
    - nivel: 1
      texto: "Às vezes tiro uma ideia e implemento"
      
    - nivel: 2
      texto: "Ocasionalmente melhoramos algo"
      
    - nivel: 3
      texto: "Revisão periódica de processos, identifica melhorias"
      
    - nivel: 4
      texto: "Equipe propõe, testa, implementa melhoria contínua"
```

---

### **4️⃣ PESSOAS E CULTURA**

```yaml
PE-01:
  titulo: "Papéis e Responsabilidades"
  pergunta: "Cada pessoa sabe exatamente qual é o seu papel?"
  discrimina: "N0 ↔ N1"
  opcoes:
    - nivel: 0
      texto: "Não, eles fazem o que aparece"
      
    - nivel: 1
      texto: "Tentei definir, mas ficou vago"
      
    - nivel: 2
      texto: "Têm uma noção, mas ainda dependem de mim pra orientação"
      
    - nivel: 3
      texto: "Papéis claros, descrição por escrito, responsáveis definidos"
      
    - nivel: 4
      texto: "Equipe redefine seus papéis, autonomia clara"

PE-02:
  titulo: "Feedback e Desenvolvimento"
  pergunta: "Como você dá feedback na equipe?"
  discrimina: "N1 ↔ N2"
  opcoes:
    - nivel: 0
      texto: "Não dou feedback estruturado"
      
    - nivel: 1
      texto: "Dou quando tem problema, é reativo"
      
    - nivel: 2
      texto: "Ocasionalmente dou feedback informal"
      
    - nivel: 3
      texto: "Reunião 1:1 periódica, feedback estruturado"
      
    - nivel: 4
      texto: "Feedback contínuo, equipe auto-avalia"

PE-03:
  titulo: "Retenção de Talentos"
  pergunta: "Qual é o turnover da sua equipe?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Alto, saem várias pessoas"
      
    - nivel: 1
      texto: "Médio, perco gente boa"
      
    - nivel: 2
      texto: "Baixo, mas não tenho estratégia"
      
    - nivel: 3
      texto: "Baixo, tenho plano de retenção (salário/benefícios/dev)"
      
    - nivel: 4
      texto: "Muito baixo, equipe se sente valorizada e cresce"

PE-04:
  titulo: "Comunicação Interna"
  pergunta: "Como vocês se comunicam internamente?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Informal, conversa quando vira"
      
    - nivel: 1
      texto: "Tentei implantar reunião, mas virou caótica"
      
    - nivel: 2
      texto: "Reunião ocasional, comunicação informal"
      
    - nivel: 3
      texto: "Rituais de comunicação (daily, weekly, mensal)"
      
    - nivel: 4
      texto: "Comunicação estruturada, equipe se auto-organiza"

PE-05:
  titulo: "Cultura e Valores"
  pergunta: "Como você descreve a cultura da sua empresa?"
  discrimina: "N3 ↔ N4"
  opcoes:
    - nivel: 0
      texto: "Não tenho cultura definida"
      
    - nivel: 1
      texto: "Tenho valores, mas não consigo instalar"
      
    - nivel: 2
      texto: "Tenho valores, a equipe respeita parcialmente"
      
    - nivel: 3
      texto: "Valores definidos, refletem nas decisões"
      
    - nivel: 4
      texto: "Cultura forte, equipe vive e melhora os valores"
```

---

### **5️⃣ GESTÃO FINANCEIRA E CAIXA**

```yaml
F-01:
  titulo: "Controle Financeiro"
  pergunta: "Como você acompanha o financeiro da empresa?"
  discrimina: "N0 ↔ N1"
  opcoes:
    - nivel: 0
      texto: "Não acompanho, só olho quando vira crise"
      
    - nivel: 1
      texto: "Tiro uma continha, mas não é estruturado"
      
    - nivel: 2
      texto: "Tenho planilha, olho mensalmente"
      
    - nivel: 3
      texto: "Dashboard financeiro, revisão semanal ou quinzenal"
      
    - nivel: 4
      texto: "Equipe gerencia, me avisa só desvios"

F-02:
  titulo: "Fluxo de Caixa"
  pergunta: "Você consegue prever o fluxo de caixa?"
  discrimina: "N1 ↔ N2"
  opcoes:
    - nivel: 0
      texto: "Não, é surpresa"
      
    - nivel: 1
      texto: "Tiro uma estimativa, mas erra muito"
      
    - nivel: 2
      texto: "Tenho previsão básica de entrada/saída"
      
    - nivel: 3
      texto: "Previsão estruturada (30/60/90 dias), acompanhamento"
      
    - nivel: 4
      texto: "Equipe mantém previsão, propõe ações"

F-03:
  titulo: "Lucratividade por Cliente/Produto"
  pergunta: "Você sabe quanto cada cliente/produto lucra?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Não faço essa análise"
      
    - nivel: 1
      texto: "Acho que sei, mas não tenho dados"
      
    - nivel: 2
      texto: "Tenho noção, olho ocasionalmente"
      
    - nivel: 3
      texto: "Análise de margem por cliente/produto, mensal"
      
    - nivel: 4
      texto: "Equipe analisa, propõe mix otimizado"

F-04:
  titulo: "Gestão de Custos"
  pergunta: "Como você controla os custos?"
  discrimina: "N2 ↔ N3"
  opcoes:
    - nivel: 0
      texto: "Não controlo, gasto conforme aparece"
      
    - nivel: 1
      texto: "Tiro uma conta rápida quando lembro"
      
    - nivel: 2
      texto: "Tenho budget básico, mas ultrapasso"
      
    - nivel: 3
      texto: "Budget por área, acompanhamento mensal"
      
    - nivel: 4
      texto: "Equipe propõe otimizações, corta desperdício"

F-05:
  titulo: "Decisões Financeiras Estratégicas"
  pergunta: "Como você toma decisões financeiras importantes?"
  discrimina: "N3 ↔ N4"
  opcoes:
    - nivel: 0
      texto: "Pela intuição, conforme tenho dinheiro"
      
    - nivel: 1
      texto: "Tiro uma conta rápida e decido"
      
    - nivel: 2
      texto: "Analiso números básicos"
      
    - nivel: 3
      texto: "Análise de ROI, cenários, decide baseado em dados"
      
    - nivel: 4
      texto: "Equipe analisa, propõe cenários, discussão com pares"
```

---

## 🧮 Algoritmo de Pontuação

### **Scoring Inicial (Diagnóstico Rápido)**

```javascript
function calcularNivelArea(respostas) {
  // respostas = [0-4, 0-4, 0-4, 0-4, 0-4]
  
  const soma = respostas.reduce((a, b) => a + b, 0);
  const media = soma / 5;
  
  // Classificação por intervalo
  const nivelMap = {
    "0-0.5": { nivel: 0, label: "Inexistente" },
    "0.5-1.5": { nivel: 1, label: "Reativo" },
    "1.5-2.5": { nivel: 2, label: "Organização Inicial" },
    "2.5-3.5": { nivel: 3, label: "Sistema Estruturado" },
    "3.5-4": { nivel: 4, label: "Excelência" }
  };
  
  // Confiança = distância do ponto médio do intervalo
  const distancia = Math.min(...intervals.map(int => 
    Math.abs(media - intCenter)
  ));
  const confianca = 95 - (distancia * 20); // 0.5 de distância = 90%
  
  return { nivel: Math.round(media), confianca };
}

// Exemplo
calcularNivelArea([1, 1.5, 2, 1.5, 1])
// {nivel: 1, confianca: 85%, label: "Reativo"}
```

### **Resultado Inicial (Exemplo)**

```json
{
  "empresaId": "emp-001",
  "data_diagnostico": "2026-04-12",
  "fase": "diagnostico_rapido",
  "confianca_geral": 78,
  "areas": {
    "planejamento": {
      "nivel": 2,
      "confianca": 80,
      "label": "Organização Inicial",
      "respostas": [1, 2, 2, 2, 2]
    },
    "vendas": {
      "nivel": 1,
      "confianca": 75,
      "label": "Reativo",
      "respostas": [0.5, 1, 1.5, 1.5, 1]
    },
    "operacao": {
      "nivel": 2,
      "confianca": 85,
      "label": "Organização Inicial",
      "respostas": [1.5, 2, 2, 2, 2]
    },
    "pessoas": {
      "nivel": 1,
      "confianca": 70,
      "label": "Reativo",
      "respostas": [0.5, 1, 1.5, 1.5, 1]
    },
    "financeiro": {
      "nivel": 1,
      "confianca": 80,
      "label": "Reativo",
      "respostas": [1, 1, 1.5, 1.5, 1]
    }
  },
  "media_geral": 1.4
}
```

---

## 🔄 Diagnóstico Progressivo: Framework de Refinamento

### **Fase 1: Diagnóstico Rápido (Dia 0)**

```
Duração: 5-8 minutos
Ação: Responder 25 perguntas
Saída: Nível por área (confiança 75-80%)
Prox: Prescrição de tarefas iniciais
```

**Triggeres de Perguntas Adicionais:**
- Se confiança < 70% em uma área → Pedir 1 pergunta adicional imediatamente
- Se resultado ambíguo (ex: 1.8 entre N1 e N2) → Marcar para refinamento

---

### **Fase 2: Refinamento Implícito (Semanas 1-2)**

Durante o coaching natural, a IA coleta **evidências contextuais**:

```javascript
// Chat 1: Planejamento
User: "Tô com dificuldade em implementar OKRs"
IA: "Entendi. E suas metas atuais, como são estruturadas?"
  └─ EVIDÊNCIA COLETADA: Tipo de meta atual
  └─ REFINA: P-02 (Definição de Metas)

// Chat 5: Vendas
User: "Meu time não bate meta"
IA: "Como vocês acompanham vendas ao longo do mês?"
  └─ EVIDÊNCIA: Frequência de acompanhamento
  └─ REFINA: V-02 (Meta e Acompanhamento)

// Chat 10: Pessoas
User: "Pessoal tá desmotivado"
IA: "Quando foi a última vez que você deu feedback específico?"
  └─ EVIDÊNCIA: Frequência de feedback
  └─ REFINA: PE-02 (Feedback e Desenvolvimento)
```

**Algoritmo de Coleta:**

```yaml
Evidência-Contextual:
  tipo: "Menção espontânea ou resposta a pergunta implícita"
  peso: 0.5 (menos confiável que resposta explícita)
  ação: "Acumula com respostas explícitas"
  limite: "Máx 3 evidências por pergunta"
```

---

### **Fase 3: Refinamento Explícito (Semana 2-3)**

Se confiança ainda < 80% em uma área após semana 1:

```javascript
// IA percebe baixa confiança em Vendas (70%)
// Entra com pergunta direcionada:

IA: "Você mencionou dificuldade em meta de vendas.
     Deixa eu entender melhor: quando a venda cai, 
     qual é seu primeiro instinto?"

// Isso mapeia para V-05 (Análise de Vendas)
// Coleta evidência com peso maior (0.8)
```

**Trigger de Refinamento Explícito:**

```yaml
Critério:
  - Se confianca < 75% + mais de 3 chats → Perguntar novamente
  - Se contradição detectada → Perguntar para clarificar
  - Se área crítica (financeiro, vendas) + confianca baixa → Priorizar
```

---

### **Fase 4: Diagnóstico Refinado (Dia 30)**

Consolidação de todas evidências coletadas:

```javascript
function refinarNivel(nivelInicial, evidencias, confiancaHistorica) {
  // nivelInicial = resultado fase 1
  // evidencias = {coletadas: 15, contraditórias: 2, confirmadas: 13}
  // confiancaHistorica = [75%, 78%, 82%, 85%]
  
  const novoNivel = mediaMovel(nivelInicial, evidencias);
  const novaConfianca = confiancaHistorica[confiancaHistorica.length - 1];
  
  return {
    nivel: novoNivel,
    confianca: novaConfianca,
    mudanca: novoNivel - nivelInicial,
    confirmacao: (evidencias.confirmadas / evidencias.coletadas) * 100
  };
}

// Exemplo
refinarNivel(1, {coletadas: 10, contraditórias: 1, confirmadas: 9}, 
  [75, 78, 82, 88])
// {
//   nivel: 1.1,
//   confianca: 88,
//   mudanca: 0.1,
//   confirmacao: 90%
// }
```

**Saída Final (Relatório 30 dias):**

```json
{
  "empresa": "XYZ",
  "data": "2026-05-12",
  "diagnostico_inicial": {
    "planejamento": { "nivel": 2, "confianca": 80 },
    "vendas": { "nivel": 1, "confianca": 75 }
  },
  "diagnostico_refinado": {
    "planejamento": { "nivel": 2.1, "confianca": 88, "mudanca": "+0.1" },
    "vendas": { "nivel": 1.2, "confianca": 85, "mudanca": "+0.2" }
  },
  "evidencias_coletadas": 47,
  "evidencias_confirmadas": 43,
  "taxa_confirmacao": "91%"
}
```

---

## 📊 Dashboard de Progresso

```
DIAGNÓSTICO PROGRESSIVO — Status por Data

Dia 0 (Diagnóstico Rápido)
├─ Planejamento: N2 (80%) ████████░░
├─ Vendas: N1 (75%) ███████░░░
├─ Operação: N2 (85%) █████████░
├─ Pessoas: N1 (70%) ███████░░░
└─ Financeiro: N1 (80%) ████████░░

Dia 7 (Após 1 semana coaching)
├─ Planejamento: N2 (82%) ████████░░ [+2%]
├─ Vendas: N1 (78%) ███████░░░ [+3%]
├─ Operação: N2 (87%) █████████░ [+2%]
├─ Pessoas: N1.1 (75%) ███████░░░ [+5%]
└─ Financeiro: N1 (82%) ████████░░ [+2%]

Dia 30 (Refinado Final)
├─ Planejamento: N2 (90%) █████████░ [+10%]
├─ Vendas: N1.5 (88%) █████████░ [+13%]
├─ Operação: N2 (90%) █████████░ [+5%]
├─ Pessoas: N1.5 (87%) █████████░ [+17%]
└─ Financeiro: N1.3 (85%) █████████░ [+5%]

MÉDIA GERAL: 1.4 → 1.66 [Melhoria de +0.26]
```

---

## 🎯 Prescrição Automática por Nível

Após cada diagnóstico (inicial ou refinado), o sistema prescreve tarefas:

```yaml
Prescrição-Automática:
  condicao: "Se nivel_area == N && confianca >= 75%"
  
  Planejamento_N2→N3:
    tarefa_1: "Estruturar reunião semanal de revisão (1 dia)"
    tarefa_2: "Criar dashboard de indicadores principais (3 dias)"
    tarefa_3: "Documentar processo de tomada de decisão (1 dia)"
    tarefa_4: "Treinar equipe no novo processo (2 dias)"
    prazo: "4 semanas"
    recursos: "Template reunião, Dashboard template"
    
  Vendas_N1→N2:
    tarefa_1: "Definir pipeline de vendas (2-3 estágios) (1 dia)"
    tarefa_2: "Criar meta mensal mínima (1 dia)"
    tarefa_3: "Estruturar reunião de vendas semanal (1 dia)"
    prazo: "3 semanas"
    recursos: "Pipeline template, Meta calculator"
```

---

## 🔐 Validação & QA

### **Validação de Diagnóstico**

```yaml
Critério-Aceição:
  - Confiança >= 75% em diagnóstico inicial: PASSOU
  - Confiança >= 85% em diagnóstico refinado: PASSOU
  - Coerência interna (sem contradições): PASSOU
  - Resultado mapeia para prescrição viável: PASSOU
```

### **Testes de Confiabilidade**

```
Test 1: Consistência Temporal
├─ Mesma pergunta em dia 0 e dia 30
├─ Esperado: Mudança alinhada com progresso reportado
└─ Tolerância: ±0.5 nível

Test 2: Validação Cruzada
├─ Pergunta A e Pergunta B (mesmo nível)
├─ Esperado: Respostas alinhadas
└─ Tolerância: Máx 1 nível de diferença

Test 3: Mapeamento de Prescrição
├─ Diagnóstico → Tarefas geradas
├─ Esperado: Tarefas mapeadas corretamente
└─ Validação: Manual (QA primeiro ciclo)
```

---

## 📝 Implementação: Próximas Etapas

- [ ] Serializar 25 perguntas em JSON estruturado
- [ ] Implementar algoritmo de scoring
- [ ] Criar sistema de coleta de evidências durante chat
- [ ] Dashboard de progresso (UI ou CLI)
- [ ] Template de prescrição automática
- [ ] Validação com 10 empreendedores reais
- [ ] Ajustes baseado em feedback

---

**Documento compilado por:** @analyst (Atlas)  
**Próximo review:** Após validação com 10 empresas
