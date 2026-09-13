# Presente Alpha — Delta de modelo de dados e API

## 1. Objetivo

Adicionar ao projeto atual somente o necessário para o Alpha diário, preservando os perfis e motores existentes.

## 2. Novas entidades sugeridas

### `daily_moment`
Fotografia determinística do momento.

```text
id
participant_id
reference_date
timezone
dreamspell_payload_json
engine_version
calculated_at
unique(participant_id, reference_date)
```

### `relevance_result`
Resultado versionado do Relevance Engine.

```text
id
daily_moment_id
participant_id
selected_elements_json
detected_relationships_json
personalization_status
memory_used boolean
memory_refs[]
ruleset_version
created_at
```

`personalization_status`:
- `none`
- `daily`
- `background_only`
- `strong`

### `daily_present`
Conteúdo entregue ao usuário. Imutável após publicação.

```text
id
participant_id
reference_date
pilot_day_number
relevance_result_id
reflection
question
practice_id nullable
practice_text_snapshot nullable
personal_echo nullable
derivation_summary
model_name
prompt_version
qa_status
created_at
published_at
immutable=true
```

### `daily_reflection`
Registro humano.

```text
id
daily_present_id
participant_id
free_text nullable
quick_marker nullable
created_at
```

`quick_marker`:
- `echo`
- `different_view`
- `nothing_special`

### `pilot_feedback`
Perguntas de laboratório.

```text
id
daily_present_id
participant_id
spontaneous_recall       # none|once|some|many
different_perception     # no|maybe|yes
confirmation_seeking     # no|a_little|yes
question_value           # no|a_little|a_lot|unsure
practice_done            # yes|no|not_offered
practice_experience      # helped|neutral|felt_like_task|null
felt_forced              # yes|no
counterfactual_value     # no|maybe|yes|unsure
feedback_text nullable
created_at
```

### `knowledge_item`
Conforme `05_KNOWLEDGE_AND_PRACTICES.md`.

### `practice`
Conforme `05_KNOWLEDGE_AND_PRACTICES.md`.

## 3. Relação com entidades existentes

Não substituir:
- participante;
- perfis natais;
- elementos calculados;
- base de conhecimento;
- leituras já existentes;
- divergências.

O Claude deve propor migração mínima e evitar duplicação se entidades atuais já suportarem os contratos acima.

## 4. Endpoints sugeridos

### `GET /api/presente/today`
Retorna o `daily_present` publicado para o participante/data atual.

Se ainda não existir:
1. calcula/faz lookup do momento;
2. executa relevância;
3. gera interpretação;
4. executa QA;
5. congela;
6. retorna.

A implementação pode preferir pré-geração; manter a regra de imutabilidade.

### `GET /api/presente/today/explain`
Retorna:
- elementos calculados;
- conhecimento usado;
- relações detectadas;
- elementos não usados;
- distinção tradição vs Método Presente;
- uso ou não de memória.

### `POST /api/presente/today/reflection`
Salva registro humano sem alterar `daily_present`.

### `POST /api/presente/today/feedback`
Salva perguntas do laboratório.

### `GET /api/presente/pilot/status`
Retorna:
- dia atual do piloto;
- dias concluídos;
- quantidade de registros;
- sem streak punitivo.

## 5. Geração

Separar funções:

```text
compute_daily_moment(participant, date)
detect_relationships(moment, natal)
rank_relevance(moment, relationships, allowed_context)
generate_daily_present(relevance_payload)
validate_daily_present(generated, provenance)
publish_daily_present(validated)
```

## 6. Segurança e privacidade

- dados de nascimento são dados pessoais;
- reflexões podem conter conteúdo íntimo;
- isolamento por participante é obrigatório;
- logs não devem despejar reflexão livre;
- não usar reflexão de um participante para gerar conteúdo de outro;
- não expor prompts internos;
- não enviar mais contexto ao modelo do que o necessário;
- permitir exclusão dos registros do piloto futuramente.

## 7. Observabilidade mínima

Registrar sem conteúdo sensível:
- tempo de cálculo;
- tempo de geração;
- falha de QA;
- `personalization_status`;
- prática oferecida/sim-não;
- abertura de `Entender`;
- conclusão do feedback.

## 8. Testes mínimos

### Determinísticos
- golden profile;
- Kin diário;
- Onda/posição;
- relações de Oráculo;
- ano/Lua somente onde validados.

### Relevance Engine
- relação forte selecionada;
- relação fraca ignorada;
- `none` funciona;
- conceitos não validados não entram;
- memória não é usada por default.

### Interpretation QA
Casos que devem falhar:
- previsão;
- causalidade;
- diagnóstico;
- "você é";
- "o universo quer";
- prática tradicional sem origem;
- personalização inventada.

### API
- leitura imutável;
- reflexão não altera leitura;
- dados isolados;
- timezone correto;
- mesmo dia retorna mesma leitura publicada.
