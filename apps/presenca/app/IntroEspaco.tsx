"use client";

import { useState } from "react";

import { introEspacos, type EspacoIntro } from "../lib/introEspacos";
import styles from "./IntroEspaco.module.css";

type Props = {
  espaco: EspacoIntro;
  // Vem do servidor: true só na primeira entrada da conta neste espaço
  // (profiles.intro_*_vista_em ainda nulo no momento do carregamento).
  expandidaInicialmente: boolean;
};

// Bloco de intenção (docs/presenca-frases-intencao-oficial.md) — na primeira
// entrada mostra o texto completo; nas seguintes, só um rótulo reduzido,
// expansível sob demanda. O "já visto" é persistido no servidor (por conta,
// não localStorage); aqui só controlamos a expansão dentro da sessão atual.
//
// De propósito sem cartão/borda: é prefácio do espaço, não um alerta de UI
// — deve ler como texto do produto, na mesma coluna do título que vem
// logo abaixo (por isso não tem alinhamento próprio: quem chama posiciona
// isto dentro do container que já teria o eyebrow/título).
export function IntroEspaco({ espaco, expandidaInicialmente }: Props) {
  const [expandida, setExpandida] = useState(expandidaInicialmente);
  const { titulo, linhas } = introEspacos[espaco];

  if (!expandida) {
    return (
      <button className={styles.rotulo} type="button" onClick={() => setExpandida(true)}>
        sobre este espaço
      </button>
    );
  }

  return (
    <div className={styles.bloco}>
      <p className={styles.titulo}>{titulo}</p>
      {linhas.map((linha, i) => (
        <p key={i} className={styles.linha}>
          {linha}
        </p>
      ))}
    </div>
  );
}
