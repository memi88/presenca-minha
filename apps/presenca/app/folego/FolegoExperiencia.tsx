"use client";

import { useEffect, useRef, useState } from "react";

import { PageHeader } from "../PageHeader";
import styles from "./page.module.css";

type Fase = "inspire" | "segure" | "expire";

// 4-7-8: inspira 4s, segura 7s, expira 8s, repete (ciclo de 19s).
const DURACOES_MS: Record<Fase, number> = { inspire: 4000, segure: 7000, expire: 8000 };
const PROXIMA_FASE: Record<Fase, Fase> = { inspire: "segure", segure: "expire", expire: "inspire" };

const TEXTOS: Record<Fase, { rotulo: string; instrucao: string }> = {
  inspire: { rotulo: "inspire", instrucao: "deixe o ar entrar devagar, contando até quatro" },
  segure: { rotulo: "segure", instrucao: "fique só um instante com o ar dentro" },
  expire: { rotulo: "expire", instrucao: "solte bem devagar, contando até oito" },
};

function NumeroFase({ valor, rotulo, ativo }: { valor: string; rotulo: string; ativo: boolean }) {
  return (
    <div className={ativo ? styles.numeroAtivo : styles.numero}>
      <div className={styles.numeroValor}>{valor}</div>
      <div className={styles.numeroRotulo}>{rotulo}</div>
    </div>
  );
}

export function FolegoExperiencia({ nome }: { nome: string }) {
  const [fase, setFase] = useState<Fase>("inspire");
  const [pausado, setPausado] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (pausado) return;
    timeoutRef.current = setTimeout(() => setFase((f) => PROXIMA_FASE[f]), DURACOES_MS[fase]);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [fase, pausado]);

  const { rotulo, instrucao } = TEXTOS[fase];
  const animacao = pausado ? styles.circuloPausado : "";

  return (
    <main className={styles.scene}>
      <PageHeader nome={nome} atual="pratica" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.conteudo}>
        <div className={styles.contador}>
          <NumeroFase valor="4" rotulo="INSPIRE" ativo={fase === "inspire"} />
          <span className={styles.ponto}>·</span>
          <NumeroFase valor="7" rotulo="SEGURE" ativo={fase === "segure"} />
          <span className={styles.ponto}>·</span>
          <NumeroFase valor="8" rotulo="EXPIRE" ativo={fase === "expire"} />
        </div>

        <div className={styles.centro}>
          <div className={styles.circuloContainer}>
            <div className={`${styles.circuloGlow} ${animacao}`} />
            <div className={`${styles.circuloBorda} ${animacao}`} />
            <div className={styles.circuloBordaInterna} />
            <div className={styles.rotuloFase}>{rotulo}</div>
          </div>
          <p className={styles.instrucao}>{instrucao}</p>
        </div>

        <div className={styles.rodape}>
          <button className={styles.pausar} type="button" onClick={() => setPausado((p) => !p)}>
            {pausado ? "continuar" : "pausar"}
          </button>
          <a className={styles.encerrar} href="/home">
            encerrar quando quiser — cada respiração já conta
          </a>
        </div>
      </div>
    </main>
  );
}
