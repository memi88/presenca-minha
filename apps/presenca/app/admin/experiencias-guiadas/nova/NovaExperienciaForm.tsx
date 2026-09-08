"use client";

import { useActionState, useState } from "react";

import { criarExperiencia } from "./actions";
import styles from "./NovaExperienciaForm.module.css";

type TipoExperiencia = "autoguiada" | "guiada_metodo" | "acompanhada";
type TipoResposta = "texto" | "escolha";

type Opcao = { valor: string; rotulo: string; descricao: string; orientacao: string };
type Etapa = {
  conteudo: string;
  tipoResposta: TipoResposta;
  compartilhadaComEspecialista: boolean;
  opcoes: Opcao[];
};

const ETAPA_VAZIA: Etapa = { conteudo: "", tipoResposta: "texto", compartilhadaComEspecialista: false, opcoes: [] };
const OPCAO_VAZIA: Opcao = { valor: "", rotulo: "", descricao: "", orientacao: "" };

const ROTULO_TIPO: Record<TipoExperiencia, string> = {
  autoguiada: "autoguiada",
  guiada_metodo: "guiada pelo método",
  acompanhada: "acompanhada",
};

export function NovaExperienciaForm({ profissionais }: { profissionais: { id: string; nome: string }[] }) {
  const [state, action, pending] = useActionState(criarExperiencia, {});
  const [tipo, setTipo] = useState<TipoExperiencia>("autoguiada");
  const [etapas, setEtapas] = useState<Etapa[]>([{ ...ETAPA_VAZIA }]);

  function atualizarEtapa(indice: number, patch: Partial<Etapa>) {
    setEtapas((prev) => prev.map((etapa, i) => (i === indice ? { ...etapa, ...patch } : etapa)));
  }
  function adicionarEtapa() {
    setEtapas((prev) => [...prev, { ...ETAPA_VAZIA, opcoes: [] }]);
  }
  function removerEtapa(indice: number) {
    setEtapas((prev) => prev.filter((_, i) => i !== indice));
  }
  function adicionarOpcao(indice: number) {
    const opcoesAtuais = etapas[indice]?.opcoes ?? [];
    atualizarEtapa(indice, { opcoes: [...opcoesAtuais, { ...OPCAO_VAZIA }] });
  }
  function atualizarOpcao(indiceEtapa: number, indiceOpcao: number, patch: Partial<Opcao>) {
    const opcoesAtuais = etapas[indiceEtapa]?.opcoes ?? [];
    const novasOpcoes = opcoesAtuais.map((opcao, i) => (i === indiceOpcao ? { ...opcao, ...patch } : opcao));
    atualizarEtapa(indiceEtapa, { opcoes: novasOpcoes });
  }
  function removerOpcao(indiceEtapa: number, indiceOpcao: number) {
    const opcoesAtuais = etapas[indiceEtapa]?.opcoes ?? [];
    atualizarEtapa(indiceEtapa, { opcoes: opcoesAtuais.filter((_, i) => i !== indiceOpcao) });
  }

  return (
    <form action={action} className={styles.form}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input type="hidden" name="etapas" value={JSON.stringify(etapas)} />
      <input type="hidden" name="tipo" value={tipo} />

      <label className={styles.label}>Título</label>
      <input className={styles.field} type="text" name="titulo" required />

      <label className={styles.label}>Tipo</label>
      <div className={styles.alternador} role="radiogroup" aria-label="Tipo de experiência">
        {(Object.keys(ROTULO_TIPO) as TipoExperiencia[]).map((valor) => (
          <button
            key={valor}
            type="button"
            role="radio"
            aria-checked={tipo === valor}
            className={`${styles.opcao} ${tipo === valor ? styles.opcaoAtiva : ""}`}
            onClick={() => setTipo(valor)}
          >
            {ROTULO_TIPO[valor]}
          </button>
        ))}
      </div>

      <label className={styles.label}>Especialista responsável</label>
      <select className={styles.field} name="especialistaId" required defaultValue="">
        <option value="" disabled>
          Escolha...
        </option>
        {profissionais.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <label className={styles.label}>Descrição</label>
      <textarea className={styles.field} name="descricao" rows={3} required />

      <label className={styles.label}>Formato (texto livre — nunca minutos)</label>
      <input
        className={styles.field}
        type="text"
        name="estimativaFormato"
        placeholder='ex: "4 etapas ao longo de alguns dias"'
      />

      <p className={styles.etapasTitulo}>Etapas</p>
      {etapas.map((etapa, indice) => (
        <div key={indice} className={styles.etapaCard}>
          <div className={styles.etapaTopo}>
            <span className={styles.etapaNumero}>Etapa {indice + 1}</span>
            {etapas.length > 1 && (
              <button type="button" className={styles.remover} onClick={() => removerEtapa(indice)}>
                remover etapa
              </button>
            )}
          </div>

          <textarea
            className={styles.field}
            rows={3}
            placeholder="Conteúdo da etapa"
            value={etapa.conteudo}
            onChange={(e) => atualizarEtapa(indice, { conteudo: e.target.value })}
          />

          <div className={styles.alternador} role="radiogroup" aria-label="Tipo de resposta">
            <button
              type="button"
              role="radio"
              aria-checked={etapa.tipoResposta === "texto"}
              className={`${styles.opcao} ${etapa.tipoResposta === "texto" ? styles.opcaoAtiva : ""}`}
              onClick={() => atualizarEtapa(indice, { tipoResposta: "texto" })}
            >
              resposta em texto
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={etapa.tipoResposta === "escolha"}
              className={`${styles.opcao} ${etapa.tipoResposta === "escolha" ? styles.opcaoAtiva : ""}`}
              onClick={() => atualizarEtapa(indice, { tipoResposta: "escolha" })}
            >
              múltipla escolha
            </button>
          </div>

          {tipo === "acompanhada" && (
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={etapa.compartilhadaComEspecialista}
                onChange={(e) => atualizarEtapa(indice, { compartilhadaComEspecialista: e.target.checked })}
              />
              O especialista lê a resposta desta etapa
            </label>
          )}

          {etapa.tipoResposta === "escolha" && (
            <div className={styles.opcoesBloco}>
              <p className={styles.opcoesTitulo}>Opções</p>
              {etapa.opcoes.map((opcao, indiceOpcao) => (
                <div key={indiceOpcao} className={styles.opcaoCard}>
                  <input
                    className={styles.fieldPequeno}
                    placeholder="valor (ex: tensao)"
                    value={opcao.valor}
                    onChange={(e) => atualizarOpcao(indice, indiceOpcao, { valor: e.target.value })}
                  />
                  <input
                    className={styles.fieldPequeno}
                    placeholder="rótulo (ex: Tensão nos ombros)"
                    value={opcao.rotulo}
                    onChange={(e) => atualizarOpcao(indice, indiceOpcao, { rotulo: e.target.value })}
                  />
                  <input
                    className={styles.fieldPequeno}
                    placeholder="descrição curta (opcional)"
                    value={opcao.descricao}
                    onChange={(e) => atualizarOpcao(indice, indiceOpcao, { descricao: e.target.value })}
                  />
                  <textarea
                    className={styles.fieldPequeno}
                    rows={2}
                    placeholder="orientação ao escolher (opcional)"
                    value={opcao.orientacao}
                    onChange={(e) => atualizarOpcao(indice, indiceOpcao, { orientacao: e.target.value })}
                  />
                  <button
                    type="button"
                    className={styles.removerPequeno}
                    onClick={() => removerOpcao(indice, indiceOpcao)}
                  >
                    remover opção
                  </button>
                </div>
              ))}
              <button type="button" className={styles.adicionar} onClick={() => adicionarOpcao(indice)}>
                + opção
              </button>
            </div>
          )}
        </div>
      ))}
      <button type="button" className={styles.adicionar} onClick={adicionarEtapa}>
        + etapa
      </button>

      <button className={styles.cta} type="submit" disabled={pending}>
        {pending ? "salvando…" : "Criar experiência"}
      </button>
    </form>
  );
}
