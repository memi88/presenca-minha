# Presente — Biblioteca de conhecimento e práticas

## 1. Princípio

A IA não é a fonte da tradição.

Conhecimento e práticas devem possuir proveniência explícita.

## 2. Tipos de origem

### `TRADITIONAL_MAYA`
Conteúdo/prática proveniente de tradição maia viva (ex.: Chol Q'ij/Nawales), com fonte e contexto cultural.

### `LAW_OF_TIME`
Conteúdo/prática documentado na Lei do Tempo/Dreamspell.

### `HUMAN_DESIGN`
Conteúdo/prática de Design Humano, quando a trilha for adicionada.

### `KABBALAH`
Conteúdo/prática de Cabala, quando a trilha for adicionada.

### `PRESENTE`
Reflexões e práticas criadas pelo Método Presente.

## 3. Regra para práticas tradicionais

Nunca apresentar uma prática criada pelo Presente como "cerimônia maia", "prática de Cabala" etc.

Para práticas tradicionais:
- registrar fonte;
- registrar contexto;
- indicar se pode ser ensinada/reproduzida;
- registrar se requer orientação de praticante;
- evitar descontextualização;
- preservar nomenclatura original quando necessário.

Algumas práticas podem ser apenas descritas/conhecidas, não transformadas em exercício do app.

## 4. Modelo sugerido

```text
KnowledgeItem
  id
  system
  concept_type
  concept_key
  title
  canonical_summary
  source_type
  source_reference
  curator
  curation_status
  interpretation_allowed
  version
  notes

Practice
  id
  title
  origin
  system
  related_concepts[]
  category
  duration_minutes
  instructions
  source_reference
  context_notes
  adaptation_allowed
  requires_guidance
  safety_notes
  curation_status
  version
```

## 5. Categorias de prática

- contemplação;
- respiração/atenção;
- escrita;
- corpo;
- natureza;
- relação;
- criação;
- simbólica/ritual;
- estudo.

## 6. Seleção de prática

Ordem preferida:

1. prática curada diretamente adequada ao contexto;
2. prática Presente já existente e validada;
3. geração/adaptação de nova prática Presente.

A IA pode sugerir uma prática nova apenas com:
- `origin = PRESENTE`;
- duração curta;
- sem alegação de efeito energético/terapêutico não sustentado;
- sem apropriação de ritual tradicional;
- revisão pelo QA interpretativo.

## 7. Repetição e memória

O seletor pode considerar:
- práticas recentes;
- preferência explícita do usuário;
- se a pessoa costuma executar ou ignorar;
- evitar repetição excessiva.

Não transformar "não fez a prática" em falha do usuário.

## 8. Biblioteca de Nawales — futuro

Criar trilha própria quando houver estudo/fonte suficiente.

Cada Nawal deve separar:
- nome e grafias;
- origem/tradição;
- significado documentado;
- práticas/cerimônias documentadas;
- contexto cultural;
- o que pode ser apresentado como conhecimento;
- o que pode ser praticado no app;
- o que exige mediação humana;
- divergências entre escolas/fontes.

Não misturar automaticamente essa biblioteca com Dreamspell.
