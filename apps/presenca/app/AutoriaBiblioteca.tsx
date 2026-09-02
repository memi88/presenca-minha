"use client";

import { useState } from "react";

import styles from "./AutoriaBiblioteca.module.css";

type Props = {
  nome: string;
  tipo: string;
  formaDeTrabalho: string | null;
  mostrarCta: boolean;
};

// Atribuição discreta de autoria (docs/presenca-extensao-terapeutas-biblioteca.md
// seção 6) — rodapé de página/prática escrita por um terapeuta. Conteúdo
// curado por Guilherme (profissional_autor_id nulo) nunca passa por aqui,
// continua só com o `autor` texto de sempre. Tocar no nome expande um
// cartão pequeno com os mesmos campos do cadastro do terapeuta (seção 2) —
// nada novo.
export function AutoriaBiblioteca({ nome, tipo, formaDeTrabalho, mostrarCta }: Props) {
  const [expandido, setExpandido] = useState(false);
  const descricao = tipo === "Outra" ? (formaDeTrabalho ?? tipo) : tipo;

  return (
    <div className={styles.wrap}>
      <button className={styles.gatilho} type="button" onClick={() => setExpandido((v) => !v)}>
        escrito por {nome}
      </button>
      {expandido && (
        <div className={styles.cartao}>
          <p className={styles.nome}>{nome}</p>
          <p className={styles.descricao}>{descricao}</p>
          {mostrarCta && (
            <a className={styles.cta} href="/terapia">
              conectar com {nome}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
