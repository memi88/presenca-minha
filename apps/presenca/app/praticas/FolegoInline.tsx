"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./FolegoInline.module.css";

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

// Antes era a rota /folego inteira — dobrada aqui dentro de /praticas/[id]
// como estado local (decisão registrada em
// docs/redesign/presenca-redesign-sistema-visual-status.md §5/§7). Some do
// painel claro e vira uma experiência em tela cheia (sempre escura, ver
// FolegoInline.module.css) quando "começar" é tocado.
export function FolegoInline({ titulo }: { titulo: string }) {
  const [iniciada, setIniciada] = useState(false);
  const [fase, setFase] = useState<Fase>("inspire");
  const [pausado, setPausado] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!iniciada || pausado) return;
    timeoutRef.current = setTimeout(() => setFase((f) => PROXIMA_FASE[f]), DURACOES_MS[fase]);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [iniciada, fase, pausado]);

  if (!iniciada) {
    return (
      <div className={styles.cartaoInterativo}>
        <h2 className={styles.tituloLeitura}>{titulo}</h2>
        <p className={styles.descricaoInterativa}>Uma prática guiada, no seu ritmo.</p>
        <button className={styles.abrirPratica} type="button" onClick={() => setIniciada(true)}>
          começar →
        </button>
      </div>
    );
  }

  const { rotulo, instrucao } = TEXTOS[fase];
  const animacao = pausado ? styles.circuloPausado : "";

  return (
    <div className={styles.scene}>
      <button className={styles.fechar} type="button" onClick={() => setIniciada(false)} aria-label="Fechar prática">
        ×
      </button>
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
          <button className={styles.encerrar} type="button" onClick={() => setIniciada(false)}>
            encerrar quando quiser — cada respiração já conta
          </button>
        </div>
      </div>
    </div>
  );
}
