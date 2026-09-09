"use client";

import { useTransition } from "react";

import { alternarCompartilhar, alternarRevisitar, apagarEntrada } from "./actions";
import styles from "./page.module.css";

export type Entrada = {
  id: string;
  autorTipo: string;
  conteudo: string;
  revisitar: boolean;
  compartilhar: boolean;
  createdAt: Date;
  tipo: string | null;
  bibliotecaRefId: string | null;
  conexaoConteudo: string | null;
  autorProfissional: { nome: string } | null;
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

const TRECHO_MAX = 90;

function trecho(texto: string): string {
  return texto.length > TRECHO_MAX ? `${texto.slice(0, TRECHO_MAX).trim()}…` : texto;
}

export function EntradaItem({ entrada, temProfissional }: { entrada: Entrada; temProfissional: boolean }) {
  const [, startTransition] = useTransition();
  const ehProfissional = entrada.autorTipo === "profissional";

  return (
    <div className={ehProfissional ? styles.entradaProfissional : styles.entradaUsuario}>
      {ehProfissional && (
        <div className={styles.autorProfissional}>
          <span className={styles.avatar} aria-hidden="true">
            {entrada.autorProfissional?.nome?.[0]?.toUpperCase() ?? "?"}
          </span>
          <span className={styles.nomeProfissional}>{entrada.autorProfissional?.nome ?? "profissional"}</span>
        </div>
      )}
      <p className={ehProfissional ? styles.conteudoProfissional : styles.conteudo}>{entrada.conteudo}</p>
      {entrada.conexaoConteudo && (
        <p className={styles.conexao}>Isso conecta com algo que você guardou: "{trecho(entrada.conexaoConteudo)}"</p>
      )}
      {entrada.tipo === "pagina_indicada" && entrada.bibliotecaRefId && (
        <a className={styles.linkOrigem} href={`/livro-vivo/${entrada.bibliotecaRefId}`}>
          Ver no Livro Vivo →
        </a>
      )}
      <div className={styles.rodape}>
        <span className={styles.data}>{formatoData.format(entrada.createdAt)}</span>
        {entrada.autorTipo === "usuario" && (
          <div className={styles.acoes}>
            <button
              type="button"
              className={`${styles.revisitar} ${entrada.revisitar ? styles.revisitarAtivo : ""}`}
              onClick={() => startTransition(() => alternarRevisitar(entrada.id, entrada.revisitar))}
            >
              {entrada.revisitar ? "Revisitar ✓" : "Revisitar"}
            </button>
            {temProfissional && (
              <button
                type="button"
                className={`${styles.compartilhar} ${entrada.compartilhar ? styles.compartilharAtivo : ""}`}
                onClick={() => startTransition(() => alternarCompartilhar(entrada.id, entrada.compartilhar))}
              >
                {entrada.compartilhar ? "Compartilhado ✓" : "Compartilhar com terapeuta"}
              </button>
            )}
            <button
              type="button"
              className={styles.apagar}
              onClick={() => startTransition(() => apagarEntrada(entrada.id))}
            >
              Apagar
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
