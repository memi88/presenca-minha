"use client";

import { useState } from "react";

import styles from "./AutoriaBiblioteca.module.css";

type Props = {
  profissionalId: string;
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
// nada novo. "ver perfil" leva pra Página do Autor (app/autor/[id]) —
// sempre visível, diferente do CTA de conectar (que só faz sentido pra
// quem ainda não tem profissional vinculado).
export function AutoriaBiblioteca({ profissionalId, nome, tipo, formaDeTrabalho, mostrarCta }: Props) {
  const [expandido, setExpandido] = useState(false);
  const descricao = tipo === "Outra" ? (formaDeTrabalho ?? tipo) : tipo;

  return (
    <div className={styles.wrap}>
      <button className={styles.gatilho} type="button" onClick={() => setExpandido((v) => !v)}>
        Escrito por {nome}
      </button>
      {expandido && (
        <div className={styles.cartao}>
          <p className={styles.nome}>{nome}</p>
          <p className={styles.descricao}>{descricao}</p>
          <a className={styles.cta} href={`/autor/${profissionalId}`}>
            Ver perfil de {nome}
          </a>
          {mostrarCta && (
            <a className={styles.cta} href="/terapia">
              Conectar com {nome}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
