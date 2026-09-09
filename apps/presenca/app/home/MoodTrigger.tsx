"use client";

import { useState, useTransition } from "react";

import styles from "./page.module.css";

const OPCOES_PRESENCA = [
  { valor: "confuso", rotulo: "Confuso" },
  { valor: "em_paz", rotulo: "Em paz" },
  { valor: "cansado", rotulo: "Cansado" },
  { valor: "curioso", rotulo: "Curioso" },
  { valor: "nao_sei", rotulo: "Não sei responder" },
] as const;

type Props = {
  moodAtual: string | null;
  registrarPresenca: (momento: string) => Promise<void>;
};

// Antes era um portão de tela cheia obrigatório (bloqueava o resto da Home
// até responder, ver histórico de precisaVisitaCheckin em lib/checkin.ts).
// No redesign vira um gatilho sempre disponível perto da saudação, que abre
// este modal por cima da tela — o resto da Home nunca fica escondido atrás
// dele (docs/redesign/stitch_presen_a_home_experience 4).
export function MoodTrigger({ moodAtual, registrarPresenca }: Props) {
  const [aberto, setAberto] = useState(false);
  const [isPending, startTransition] = useTransition();

  const opcaoAtual = OPCOES_PRESENCA.find((opcao) => opcao.valor === moodAtual) ?? null;

  function escolher(valor: string) {
    startTransition(async () => {
      await registrarPresenca(valor);
      setAberto(false);
    });
  }

  return (
    <>
      <button
        type="button"
        className={styles.moodTrigger}
        onClick={() => setAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={aberto}
      >
        <span>Como você está hoje?</span>
        <svg
          className={styles.moodTriggerIcone}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>
      {opcaoAtual && <p className={styles.moodAtualTexto}>{opcaoAtual.rotulo.toLowerCase()}</p>}

      {aberto && (
        <div className={styles.moodOverlay} onClick={() => setAberto(false)}>
          <div
            className={styles.moodSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="mood-modal-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <div className={styles.moodTopo}>
              <h3 id="mood-modal-titulo" className={styles.moodTitulo}>
                Como você está hoje?
              </h3>
              <button
                type="button"
                className={styles.moodFechar}
                onClick={() => setAberto(false)}
                aria-label="Fechar"
              >
                ×
              </button>
            </div>
            <p className={styles.moodSubtitulo}>
              Escolha uma palavra pro seu momento — você pode mudar a qualquer hora.
            </p>
            <div className={styles.moodOpcoes}>
              {OPCOES_PRESENCA.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  className={styles.moodOpcao}
                  disabled={isPending}
                  onClick={() => escolher(opcao.valor)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
