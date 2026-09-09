# Presença — Frases de intenção por espaço

> Origem: feedback de uma psicóloga que testou o app como usuária ("a gente tende a se conectar mais com o que entende" — silêncio total sem contexto gera confusão, não presença). Objetivo: uma frase curta, na primeira entrada de cada espaço principal, explicando **o que esperar ali** — nunca como usar (não é tutorial), nunca decoração permanente competindo com o conteúdo real.

## Textos finais

### Conversa
**Título:** Um espaço para chegar como você está.

**Texto:**
Você não precisa saber exatamente o que dizer.
Pode começar por uma pergunta, um sentimento ou apenas contar como foi o seu dia.
Isso aqui não é pra resolver nem responder — é pra você ser ouvido enquanto pensa.
Às vezes uma conversa curta já é suficiente.

### Livro Vivo
**Título:** Descobertas que permaneceram.

**Texto:**
Cada página nasceu de uma experiência real.
Antes de chegar até aqui, ela foi vivida, observada e amadurecida.
Não é pra explorar — é pra abrir quando alguma faz sentido pro seu momento.
Talvez você encontre poucas páginas. Isso é intencional.

### Práticas
**Título:** Quando as palavras já não bastam.

**Texto:**
Algumas coisas são compreendidas pensando.
Outras apenas sendo vividas.
Aqui você encontrará pequenos convites para experimentar.
Sem metas. Sem pressa.

### Diário
**Título:** Um lugar que não cobra nada de volta.

**Texto:**
Nem tudo precisa virar reflexão imediata. Às vezes só guardar já ajuda.
Se você tem alguém te acompanhando, essa pessoa também pode deixar algo aqui — uma pergunta, uma observação — pra você encontrar quando for a hora.
Sem contagem. Sem meta. Só o que for seu.

---

## Mecânica de exibição

**Primeira entrada em cada espaço:** mostrar o bloco completo (título + texto), num tom visual consistente com o resto do produto (mesma família tipográfica em itálico já usada pros títulos, texto em corpo normal — não itálico, seguindo o ajuste de legibilidade já combinado). Não é modal bloqueante — a pessoa pode interagir com o espaço normalmente por trás/abaixo, o bloco não impede uso, só antecede.

**Entradas seguintes:** o bloco completo não reaparece. Em vez disso, fica disponível de forma reduzida — só o título, como um link/rótulo discreto (ex: "sobre este espaço") em posição fixa e consistente entre os quatro espaços — que expande pro texto completo se a pessoa quiser reler, sem forçar reencontro automático.

**Persistência:** o estado de "já viu a intenção deste espaço" precisa ser por conta de usuário (banco), não só localStorage do navegador — já existe um problema documentado de sessão anônima se perder ao trocar de aparelho ou limpar dados, e não faz sentido a pessoa ver a introdução completa de novo por causa disso. Se o Claude Code identificar que já existe alguma tabela de preferências/estado de usuário, reaproveitar; senão, criar a estrutura mínima necessária (ex: `seen_intro_conversa`, `seen_intro_livro_vivo`, `seen_intro_praticas`, `seen_intro_diario` como booleanos, ou uma estrutura única mais flexível — decisão de implementação do Code).

## Critério de aceite
- Cada um dos quatro espaços mostra sua frase completa na primeira vez que a pessoa (daquela conta) entra ali.
- Da segunda vez em diante, só o título reduzido aparece, expansível sob demanda.
- O texto nunca bloqueia ou atrasa o uso do espaço — pessoa pode ignorar e seguir direto pra ação principal da tela.
- Nenhum dos quatro textos é alterado no conteúdo — usar exatamente o que está definido acima.

## Testando
Validar em `cf:preview`, desktop e mobile: entrar pela primeira vez em cada um dos quatro espaços (pode ser necessário resetar o estado via conta de teste), confirmar exibição completa; sair e voltar, confirmar que reduz para o título; expandir o título reduzido, confirmar que mostra o texto completo de novo.
