// Frases de intenção por espaço (docs/presenca-frases-intencao-oficial.md).
// Textos finais — não alterar o conteúdo aqui, só a mecânica de exibição
// vive no componente (app/IntroEspaco.tsx).
export type EspacoIntro = "conversa" | "livroVivo" | "praticas" | "diario";

type ConteudoIntro = { titulo: string; linhas: string[] };

export const introEspacos: Record<EspacoIntro, ConteudoIntro> = {
  conversa: {
    titulo: "Um espaço para chegar como você está.",
    linhas: [
      "Você não precisa saber exatamente o que dizer.",
      "Pode começar por uma pergunta, um sentimento ou apenas contar como foi o seu dia.",
      "Isso aqui não é pra resolver nem responder — é pra você ser ouvido enquanto pensa.",
      "Às vezes uma conversa curta já é suficiente.",
    ],
  },
  livroVivo: {
    titulo: "Descobertas que permaneceram.",
    linhas: [
      "Cada página nasceu de uma experiência real.",
      "Antes de chegar até aqui, ela foi vivida, observada e amadurecida.",
      "Não é pra explorar — é pra abrir quando alguma faz sentido pro seu momento.",
      "Talvez você encontre poucas páginas. Isso é intencional.",
    ],
  },
  praticas: {
    titulo: "Quando as palavras já não bastam.",
    linhas: [
      "Algumas coisas são compreendidas pensando.",
      "Outras apenas sendo vividas.",
      "Aqui você encontrará pequenos convites para experimentar.",
      "Sem metas. Sem pressa.",
    ],
  },
  diario: {
    titulo: "Um lugar que não cobra nada de volta.",
    linhas: [
      "Nem tudo precisa virar reflexão imediata. Às vezes só guardar já ajuda.",
      "Se você tem alguém te acompanhando, essa pessoa também pode deixar algo aqui — uma pergunta, uma observação — pra você encontrar quando for a hora.",
      "Sem contagem. Sem meta. Só o que for seu.",
    ],
  },
};
