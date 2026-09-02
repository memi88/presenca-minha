"use client";

import { useState } from "react";

import { type RespostaRapida, salvarFechamento } from "./actions";
import styles from "./page.module.css";

const OPCOES: { valor: RespostaRapida; rotulo: string }[] = [
  { valor: "algo_encontrou_eco", rotulo: "algo encontrou eco" },
  { valor: "percebi_de_outra_maneira", rotulo: "percebi algo de outra maneira" },
  { valor: "nada_em_especial", rotulo: "nada em especial" },
];

export function FechamentoForm() {
  const [selecionada, setSelecionada] = useState<RespostaRapida | null>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function salvar() {
    if (enviando) return;
    setEnviando(true);
    await salvarFechamento(selecionada, texto);
    window.location.href = "/home";
  }

  return (
    <>
      <div className={styles.opcoes}>
        {OPCOES.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            className={`${styles.opcao} ${selecionada === opcao.valor ? styles.opcaoSelecionada : ""}`}
            onClick={() => setSelecionada(selecionada === opcao.valor ? null : opcao.valor)}
            disabled={enviando}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <textarea
        className={styles.campoLivre}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="quer contar mais alguma coisa? (opcional)"
        disabled={enviando}
      />

      <div className={styles.acoes}>
        <button className={styles.cta} type="button" onClick={salvar} disabled={enviando}>
          guardar
        </button>
        <a className={styles.pular} href="/home">
          agora não
        </a>
      </div>
    </>
  );
}
