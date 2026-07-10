"use client";

import { useTransition } from "react";

import { alternarRevisitar, apagarEntrada } from "./actions";
import styles from "./page.module.css";

export type Entrada = {
  id: string;
  autor_tipo: "usuario" | "profissional";
  conteudo: string;
  revisitar: boolean;
  created_at: string;
  profissionais: { nome: string } | null;
};

const formatoData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" });

export function EntradaItem({ entrada }: { entrada: Entrada }) {
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
      <p className={styles.conteudo}>{entrada.conteudo}</p>
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
