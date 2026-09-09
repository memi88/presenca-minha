"use client";

import { useActionState, useState } from "react";

import { responderEtapa } from "./actions";
import styles from "./page.module.css";

type Opcao = { valor: string; rotulo: string; descricao?: string; orientacao?: string };

export function EtapaForm({
  instanciaId,
  tipoResposta,
  opcoes,
}: {
  instanciaId: string;
  tipoResposta: "texto" | "escolha";
  opcoes: Opcao[] | null;
}) {
  const acaoComId = responderEtapa.bind(null, instanciaId);
  const [state, action, pending] = useActionState(acaoComId, {});
  const [escolhida, setEscolhida] = useState<string | null>(null);

  const opcaoAtiva = opcoes?.find((o) => o.valor === escolhida);

  return (
    <form action={action} className={styles.etapaForm}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}

      {tipoResposta === "escolha" ? (
        <>
          <input type="hidden" name="escolha" value={escolhida ?? ""} />
          <div className={styles.opcoesLista} role="radiogroup">
            {(opcoes ?? []).map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                role="radio"
                aria-checked={escolhida === opcao.valor}
                className={`${styles.opcaoEscolha} ${escolhida === opcao.valor ? styles.opcaoEscolhaAtiva : ""}`}
                onClick={() => setEscolhida(opcao.valor)}
              >
                <span className={styles.opcaoRotulo}>{opcao.rotulo}</span>
                {opcao.descricao && <span className={styles.opcaoDescricao}>{opcao.descricao}</span>}
              </button>
            ))}
          </div>
          {opcaoAtiva?.orientacao && <div className={styles.orientacao}>{opcaoAtiva.orientacao}</div>}
          <textarea
            className={styles.field}
            name="nota"
            rows={2}
            placeholder="Se quiser, registre uma palavra ou frase (opcional)"
          />
        </>
      ) : (
        <textarea className={styles.field} name="resposta" rows={6} placeholder="Escreva aqui..." required />
      )}

      <button className={styles.cta} type="submit" disabled={pending || (tipoResposta === "escolha" && !escolhida)}>
        {pending ? "enviando…" : "Continuar →"}
      </button>
    </form>
  );
}
