# Presente Alpha — Pipeline de interpretação

## 1. Objetivo

Impedir que uma IA receba dezenas de símbolos e produza uma narrativa arbitrária.

O pipeline separa cálculo, conhecimento, seleção, interpretação e QA.

```text
CALCULAR
  ↓
RECUPERAR CONHECIMENTO CURADO
  ↓
DETECTAR RELAÇÕES
  ↓
RANQUEAR RELEVÂNCIA
  ↓
SELECIONAR O MÍNIMO NECESSÁRIO
  ↓
INTERPRETAR
  ↓
QA DA INTERPRETAÇÃO
  ↓
TRADUZIR PARA LINGUAGEM COTIDIANA
  ↓
PERGUNTA
  ↓
PRÁTICA OPCIONAL
  ↓
ENTREGAR + CONGELAR
```

## 2. Calculation Engine

Determinístico. IA não participa.

Para o Alpha diário Dreamspell, retornar no mínimo:
- Kin natal;
- Selo/Tom natal;
- Onda natal e posição;
- Oráculo natal validado;
- Kin do ano, quando validado pelo engine;
- posição no Sincronário de 13 Luas, quando validada;
- Kin diário;
- Selo/Tom diário;
- Onda diária e posição;
- Castelo/Harmônica como profundidade;
- Heptada/Plasma como dado estrutural, sem interpretação enquanto a base não estiver validada.

## 3. Knowledge Engine

Retorna somente conteúdo curado e versionado.

Cada item deve possuir:
- `system`;
- `concept_type`;
- `concept_key`;
- `canonical_keywords`;
- `source_type`;
- `source_reference`;
- `curation_status`;
- `interpretation_allowed`;
- `notes`.

A IA não cria significado tradicional ausente.

## 4. Relationship Detector

### Nível A — estrutural direto
Exemplos:
- mesmo Selo;
- relação de Oráculo validada;
- mesma posição/estrutura quando houver regra documentada.

### Nível B — relação temática
Interseção sem nome formal na tradição, por exemplo:
- "fluxo" × "forma".

É permitida somente como **Método Presente**, nunca como regra Dreamspell.

### Nível C — associação livre
Associação biográfica ou metafórica sem sustentação estrutural suficiente.

**Default do Alpha: não usar.**

### NONE
Nenhuma relação pessoal relevante.

Deve ser uma saída de primeira classe.

## 5. Relevance Engine

Entrada:
- momento calculado;
- perfil natal;
- relações detectadas;
- conhecimento curado;
- contexto explícito permitido;
- histórico recente permitido.

Saída: payload pequeno.

### Critérios de prioridade
1. proximidade temporal;
2. relação estrutural;
3. relevância para o contexto explicitamente trazido;
4. novidade/não repetição;
5. possibilidade de virar pergunta aberta;
6. possibilidade de prática simples;
7. segurança contra determinismo.

### Princípio da menor interpretação suficiente

> Usar o menor número de elementos simbólicos necessário para produzir uma reflexão coerente com a estrutura consultada.

## 6. Contexto humano

O contexto humano não deve ser inferido do mapa.

Pode vir de:
- registro voluntário do participante;
- conversa atual explicitamente autorizada;
- resposta do fechamento anterior.

O contexto:
- ajuda a escolher entre interpretações possíveis;
- não altera cálculo;
- não cria relações estruturais;
- não deve ser usado para "fazer bater".

## 7. Interpretation Engine

Recebe apenas o payload filtrado.

Deve gerar:
- `reflection`;
- `question`;
- `practice` opcional;
- `personal_echo` opcional;
- `derivation_summary` para `Entender`.

### Regras
- uma tensão principal por leitura;
- linguagem cotidiana;
- sem jargão na superfície;
- sem previsão;
- sem diagnóstico;
- sem imperativo existencial;
- sem alegar causalidade;
- sem "o universo está dizendo";
- sem "você é...";
- pergunta deve permitir que a pessoa responda "não faz sentido".

## 8. QA da interpretação

Antes de persistir, executar uma revisão independente (regra determinística + segunda passagem de modelo ou validator).

Checklist:
- afirmou algo sobre a pessoa sem base?
- fez previsão?
- transformou coincidência em causalidade?
- forçou personalização?
- usou conceito não validado?
- misturou tradição com Método Presente?
- usou símbolos demais?
- a pergunta é aberta?
- a prática tenta decidir pela pessoa?
- a prática está marcada com origem correta?
- o texto parece genérico a ponto de servir para qualquer contexto?

Se falhar: reescrever ou retornar versão mais simples.

## 9. Uso de memória longitudinal

No Alpha:
- leitura diária é congelada após geração;
- registros nunca reescrevem leitura anterior;
- memória não é necessária para gerar todos os dias;
- usar histórico somente se uma regra de relevância justificar;
- limitar janela recente;
- sempre preservar a possibilidade de `memory_used = false`.

Futuro:
- detectar temas recorrentes;
- revisitar perguntas;
- mostrar evolução;
- nunca transformar recorrência em diagnóstico.

## 10. Exemplo de payload

```json
{
  "moment": {
    "daily_theme": "experimentar",
    "stage": "encontrar estrutura",
    "wave_context": "expressao"
  },
  "relationships": [
    {
      "type": "same_seal",
      "scope": "natal_year",
      "strength": "A"
    }
  ],
  "selected_tension": "definir antes x descobrir fazendo",
  "personalization_status": "background_only",
  "avoid": [
    "prediction",
    "causal_synchronicity",
    "unvalidated_plasma_interpretation"
  ]
}
```

O modelo de linguagem recebe isso, não o mapa completo.
