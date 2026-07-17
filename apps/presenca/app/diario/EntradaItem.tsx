"use client";

import { useTransition } from "react";

import { alternarCompartilhar, alternarRevisitar, apagarEntrada } from "./actions";
import styles from "./page.module.css";

export type Entrada = {
  id: string;
  autor_tipo: "usuario" | "profissional";
  conteudo: string;
  revisitar: boolean;
  compartilhar: boolean;
  created_at: string;
  tipo: string | null;
  biblioteca_ref_id: string | null;
  conexao_conteudo: string | null;
  profissionais: { nome: string } | null;
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const TRECHO_MAX = 90;

function trecho(texto: string): string {
  return texto.length > TRECHO_MAX ? `${texto.slice(0, TRECHO_MAX).trim()}…` : texto;
}

export function EntradaItem({ entrada, temProfissional }: { entrada: Entrada; temProfissional: boolean }) {
  const [, startTransition] = useTransition();
  const ehProfissional = entrada.autor_tipo === "profissional";

  return (
    <div className={ehProfissional ? styles.entradaProfissional : styles.entradaUsuario}>
      {ehProfissional && (
        <div className={styles.autorProfissional}>
          <span className={styles.avatar} aria-hidden="true">
            {entrada.profissionais?.nome?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span className={styles.nomeProfissional}>{entrada.profissionais?.nome ?? "profissional"}</span>
        </div>
      )}
      <p className={ehProfissional ? styles.conteudoProfissional : styles.conteudo}>{entrada.conteudo}</p>
      {entrada.conexao_conteudo && (
        <p className={styles.conexao}>isso conecta com algo que você guardou: "{trecho(entrada.conexao_conteudo)}"</p>
      )}
      {entrada.tipo === "pagina_indicada" && entrada.biblioteca_ref_id && (
        <a className={styles.linkOrigem} href={`/livro-vivo/${entrada.biblioteca_ref_id}`}>
          ver no Livro Vivo →
        </a>
      )}
      <div className={styles.rodape}>
        <span className={styles.data}>{formatoData.format(new Date(entrada.created_at))}</span>
        {entrada.autor_tipo === "usuario" && (
          <div className={styles.acoes}>
            <button
              type="button"
              className={`${styles.revisitar} ${entrada.revisitar ? styles.revisitarAtivo : ""}`}
              onClick={() => startTransition(() => alternarRevisitar(entrada.id, entrada.revisitar))}
            >
              {entrada.revisitar ? "revisitar ✓" : "revisitar"}
            </button>
            {temProfissional && (
              <button
                type="button"
                className={`${styles.compartilhar} ${entrada.compartilhar ? styles.compartilharAtivo : ""}`}
                onClick={() => startTransition(() => alternarCompartilhar(entrada.id, entrada.compartilhar))}
              >
                {entrada.compartilhar ? "compartilhado ✓" : "compartilhar com terapeuta"}
              </button>
            )}
            <button
              type="button"
              className={styles.apagar}
              onClick={() => startTransition(() => apagarEntrada(entrada.id))}
            >
              apagar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
