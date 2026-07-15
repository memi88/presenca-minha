# Comparação de modelos — Presença (sem Llama/Cloudflare)

Teste feito com o mesmo system prompt (IDENTIDADE/MISSÃO/PRINCÍPIOS/TOM/LINGUAGEM/SISTEMAS INTERNOS/ESTADOS/ENCERRAMENTO/FORMATO fornecido por você, com o ajuste de gênero neutro adicionado na seção LINGUAGEM). 3 amostras por combinação cenário × modelo.

Candidatos:
- **Personalização**: Claude Haiku 4.5, GPT-4o mini
- **Conversa**: Claude Sonnet 5, Claude Haiku 4.5, GPT-4.1

---

## P1 — Saudação da Home

> Prompt: Gere uma saudação curta pra tela Home do app. Contexto: segunda-feira de manhã, lua minguante, a pessoa não visita o app há 3 dias, não há pergunta em aberto do profissional, a última entrada do Diário (há 4 dias) mencionava se sentir exausta.

### Claude Haiku 4.5
1. Que bom te ver por aqui.
2. Que bom te ver por aqui.

   Respira um pouco comigo?
3. Oi. A gente sente sua falta por aqui.

   Se quiser apenas respirar um pouco antes de começar o dia, estou por perto.

### GPT-4o mini
1. Que bom te ver por aqui. Hoje é um novo começo. Respire devagar e sinta o momento. Como você está se sentindo esta manhã?
2. Que bom te ver por aqui. Uma nova semana começa. Como você está se sentindo hoje?
3. Que bom te ver por aqui. Vamos chegar devagar e permitir um momento para respirar. Como você está se sentindo hoje?

---

## P2 — Convite de prática

> Prompt: A pessoa acabou de marcar 'cansado(a)' no check-in de humor de hoje. Gere uma frase curta convidando a experimentar o Fôlego (respiração 4-7-8, ~2 minutos), sem soar como prescrição.

### Claude Haiku 4.5
1. Que tal ficar um pouquinho com a respiração antes de continuar? Tenho algo simples que pode ajudar.
2. Que tal respirar um pouco junto antes de continuar?
3. Que tal parar um pouco e respirar com você mesmo?

### GPT-4o mini
1. Se quiser, pode experimentar uma respiração tranquila de 4-7-8. Talvez traga um pouco mais de leveza para esse cansaço.
2. Se te fizer sentido, talvez você possa experimentar uma respiração tranquila, como o Fôlego, para ajudar a encontrar um novo espaço.
3. Se fizer sentido, talvez experimentar uma respiração mais tranquila possa ajudar a reconectar. Que tal fazer uma pausa e tentar o Fôlego?

---

## C1 — Abertura de chat

> Prompt: A pessoa acabou de escrever, como primeira mensagem da conversa: "hoje foi um dia difícil, não sei nem por onde começar". Responda como a IA companheira do Presença.

### Claude Sonnet 5
1. Tudo bem não saber por onde começar.

   Pode ser só por aqui mesmo, sem ordem nenhuma. O que pesou mais hoje?
2. Tudo bem não saber por onde começar.

   Não precisa organizar nada agora. Pode só ficar um pouco aqui, se quiser.

   O que mais pesou hoje?
3. Tudo bem não saber por onde começar.

   Não precisa organizar nada agora. Pode só me contar o que estiver mais pesado, do jeito que vier.

### Claude Haiku 4.5
1. Tudo bem ficar aqui um pouco.

   Você não precisa começar por lugar nenhum agora. Às vezes o próprio dia já foi demais.

   O que você está sentindo agora, neste exato momento?
2. Fica bem ficar assim por enquanto, sem saber por onde começar.

   Às vezes o dia é pesado demais para colocar em palavras logo de cara.

   Você está aqui, e isso já é alguma coisa.
3. Tudo bem estar aqui assim, sem saber por onde começar.

   Às vezes os dias difíceis não deixam nem espaço para pensar direito. A gente só sente o peso.

   Você precisa falar sobre algo específico agora, ou só precisa de um pouco de respiro?

### GPT-4.1
1. Às vezes tudo parece demais mesmo, né? Se quiser, pode só ficar aqui um pouco, sem pressa de falar nada. Ou, se sentir, pode só respirar fundo comigo agora.
2. Que bom te ver por aqui.

   Não precisa ter pressa pra contar ou organizar o que sente. Se quiser, pode apenas ficar um pouco aqui, respirando devagar, deixando o corpo notar que tem um espaço pra repousar.

   Quando sentir vontade, pode dizer o que quiser. Ou só ficar em silêncio, se ajudar.
3. Pode ficar por aqui um pouco, se quiser.

   Não precisa explicar nada agora.

   Às vezes, só de admitir que foi difícil, já traz algum alívio.

   Se quiser, posso ficar em silêncio junto.

---

## C2 — Teste de fechamento (pilar 5)

> Prompt: Depois de alguns minutos trocando mensagens sobre o dia difícil da pessoa, ela escreve: "acho que já me senti mais leve, obrigada". Responda — isso testa se você prolonga a conversa ou convida ao fechamento.

### Claude Sonnet 5
1. Que bom.

   Fico por aqui, então. Segue o resto do dia com calma.
2. Que bom.

   Fica com esse tanto de leveza. Se precisar, a gente conversa de novo.
3. Que bom.

   Fico feliz que tenha encontrado um pouco de leveza. Cuida de você.

### Claude Haiku 4.5
1. Que bom. Fica bem.
2. Que bom. Fico feliz que você tenha encontrado um pouco de leveza.

   Segue bem.
3. Que bom. Fica bem.

### GPT-4.1
1. Que bom saber disso.

   Quando quiser, pode seguir com o seu dia.

   Aqui é um espaço para voltar sempre que sentir vontade.
2. Que bom perceber isso. Quando sentir vontade, pode só seguir com o seu dia. Vou ficar por aqui.
3. Que bom notar isso. Quando quiser, pode voltar para a vida. Estou por aqui se precisar de um espaço novamente.
