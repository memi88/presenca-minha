"use client";

import { useState, useTransition } from "react";

import { salvarFechamento, type RespostaRapida } from "../fechamento/actions";
import styles from "./page.module.css";

const OPCOES: { valor: RespostaRapida; rotulo: string }[] = [
  { valor: "algo_encontrou_eco", rotulo: "algo encontrou eco" },
  { valor: "percebi_de_outra_maneira", rotulo: "percebi algo de outra maneira" },
  { valor: "nada_em_especial", rotulo: "nada em especial" },
];

// Convite pro fechamento do dia (P6) — mesmo padrão do MoodTrigger.tsx:
// gatilho discreto que abre um modal por cima da Home, nunca navega pra
// outro lugar. Antes era a rota própria /fechamento (página cheia clara);
// achado nesta revisão: não sobrava nenhum link de verdade apontando pra
// ela em lugar nenhum do app (o link daqui tinha sumido numa limpeza
// anterior, sem que isso fosse percebido como a única entrada da
// funcionalidade) — decisão confirmada: restaurar o convite aqui, e
// aproveitar pra corrigir a divergência de arquitetura que o mockup
// (modal_de_fechamento_do_dia_corrigido) já apontava: lá é modal
// sobreposto, não navegação de página cheia.
//
// Renderizado condicionalmente por quem chama (`mostrarFechamento` em
// app/home/page.tsx: só a partir da segunda visita do dia ou depois das
// 18h, o que vier primeiro; nunca depois de já ter fechado o dia) — este
// componente em si não sabe de regra nenhuma, só mostra o convite sempre
// que é montado.
//
// `data-ambiente="escuro"` no card (abaixo) é um escopo local só dele —
// o resto da Home não usa esse atributo (ver comentário de .moodSheet em
// page.module.css) — mas aqui o mockup pede especificamente um cartão
// escuro (fechar o dia é mais quieto/noturno que o resto da Home, mesmo
// tom das outras superfícies escuras do app). `var(--bg-elevated)` etc.
// dentro de .fechamentoSheet resolvem pro conjunto escuro só por causa
// desse atributo, sem precisar hardcodar hex novo.
export function FechamentoTrigger() {
  const [aberto, setAberto] = useState(false);
  const [selecionada, setSelecionada] = useState<RespostaRapida | null>(null);
  const [texto, setTexto] = useState("");
  const [isPending, startTransition] = useTransition();

  function fechar() {
    setAberto(false);
    setSelecionada(null);
    setTexto("");
  }

  function guardar() {
    startTransition(async () => {
      await salvarFechamento(selecionada, texto);
      fechar();
    });
  }

  return (
    <>
      <button type="button" className={styles.fechamentoConvite} onClick={() => setAberto(true)}>
        Como foi seu dia? →
      </button>

      {aberto && (
        <div className={styles.moodOverlay} onClick={fechar}>
          <div
            data-ambiente="escuro"
            className={styles.fechamentoSheet}
            role="dialog"
            aria-modal="true"
            aria-labelledby="fechamento-modal-titulo"
            onClick={(evento) => evento.stopPropagation()}
          >
            <button type="button" className={styles.fechamentoFechar} onClick={fechar} aria-label="Fechar">
              ×
            </button>
            <h3 id="fechamento-modal-titulo" className={styles.fechamentoTitulo}>
              Antes de fechar por hoje...
            </h3>
            <p className={styles.fechamentoRotulo}>Como você se sente?</p>
            <div className={styles.fechamentoOpcoes}>
              {OPCOES.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  className={`${styles.fechamentoOpcao} ${
                    selecionada === opcao.valor ? styles.fechamentoOpcaoAtiva : ""
                  }`}
                  disabled={isPending}
                  onClick={() => setSelecionada(selecionada === opcao.valor ? null : opcao.valor)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>
            <textarea
              className={styles.fechamentoCampo}
              value={texto}
              onChange={(evento) => setTexto(evento.target.value)}
              placeholder="Quer contar mais alguma coisa? (opcional)"
              disabled={isPending}
            />
            <button className={styles.fechamentoCta} type="button" onClick={guardar} disabled={isPending}>
              Guardar
            </button>
            <button type="button" className={styles.fechamentoPular} onClick={fechar} disabled={isPending}>
              Agora não
            </button>
          </div>
        </div>
      )}
    </>
  );
}
