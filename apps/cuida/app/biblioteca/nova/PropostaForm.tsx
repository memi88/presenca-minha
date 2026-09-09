"use client";

import { useActionState, useState } from "react";

import { CATEGORIAS_PRATICA, type CategoriaPratica } from "@/lib/categoriasPratica";

import { propor } from "./actions";
import { PreviewConteudo } from "./PreviewConteudo";
import styles from "./page.module.css";

function rotuloCategoria(categoria: CategoriaPratica): string | null {
  return CATEGORIAS_PRATICA.find((c) => c.valor === categoria)?.rotulo ?? null;
}

export function PropostaForm() {
  const [state, action, pending] = useActionState(propor, {});
  const [tipo, setTipo] = useState<"pagina_livro_vivo" | "pratica">("pagina_livro_vivo");
  const [categoria, setCategoria] = useState<CategoriaPratica>("respiracao");
  const [escopo, setEscopo] = useState<"publico" | "privado_profissional">("publico");
  const [titulo, setTitulo] = useState("");
  const [conteudo, setConteudo] = useState("");
  const [duracao, setDuracao] = useState("");
  const [intencao, setIntencao] = useState("");
  const [capaUrl, setCapaUrl] = useState<string | null>(null);
  const [midiaUrl, setMidiaUrl] = useState<string | null>(null);
  const [midiaTipo, setMidiaTipo] = useState<"audio" | "video" | null>(null);

  if (state.sucesso) {
    return (
      <div className={styles.resultado}>
        <p className={styles.resultadoTexto}>
          Proposta enviada. Fica pendente até um admin aprovar — você não vê ela publicada ainda.
        </p>
        <a className={styles.voltar} href="/pacientes">
          ‹ voltar pra pacientes
        </a>
      </div>
    );
  }

  return (
    <div className={styles.formELayout}>
      <form className={styles.form} action={action}>
        {state.erro && <p className={styles.erro}>{state.erro}</p>}
        <input type="hidden" name="tipo" value={tipo} />
        <input type="hidden" name="escopo" value={escopo} />

        <p className={styles.grupoLabel}>Tipo de conteúdo</p>
        <div className={styles.alternador} role="radiogroup" aria-label="Tipo de conteúdo">
          <button
            type="button"
            role="radio"
            aria-checked={tipo === "pagina_livro_vivo"}
            className={`${styles.opcao} ${tipo === "pagina_livro_vivo" ? styles.opcaoAtiva : ""}`}
            onClick={() => setTipo("pagina_livro_vivo")}
          >
            página do Livro Vivo
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={tipo === "pratica"}
            className={`${styles.opcao} ${tipo === "pratica" ? styles.opcaoAtiva : ""}`}
            onClick={() => setTipo("pratica")}
          >
            prática
          </button>
        </div>

        {tipo === "pratica" && (
          <>
            <input type="hidden" name="categoria" value={categoria} />
            <p className={styles.grupoLabel}>Categoria</p>
            <div className={styles.alternador} role="radiogroup" aria-label="Categoria da prática">
              {CATEGORIAS_PRATICA.map((opcao) => (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={categoria === opcao.valor}
                  className={`${styles.opcao} ${categoria === opcao.valor ? styles.opcaoAtiva : ""}`}
                  onClick={() => setCategoria(opcao.valor)}
                >
                  {opcao.rotulo}
                </button>
              ))}
            </div>

            <input
              className={styles.field}
              type="text"
              name="duracao"
              placeholder="Duração (ex: 5 min)"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
            />
            <input
              className={styles.field}
              type="text"
              name="intencao"
              placeholder="Intenção (ex: Acalmar antes de dormir)"
              value={intencao}
              onChange={(e) => setIntencao(e.target.value)}
            />
          </>
        )}

        <input
          className={styles.field}
          type="text"
          name="titulo"
          placeholder="título"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />
        <textarea
          className={styles.field}
          name="conteudo"
          placeholder="conteúdo"
          rows={8}
          required
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />

        <p className={styles.grupoLabel}>Capa (opcional)</p>
        <input
          className={styles.field}
          type="file"
          name="capa"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setCapaUrl(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : null)}
        />

        {tipo === "pratica" && (
          <>
            <p className={styles.grupoLabel}>Conteúdo em áudio ou vídeo (opcional)</p>
            <input
              className={styles.field}
              type="file"
              name="midia"
              accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (!arquivo) {
                  setMidiaUrl(null);
                  setMidiaTipo(null);
                  return;
                }
                setMidiaUrl(URL.createObjectURL(arquivo));
                setMidiaTipo(arquivo.type.startsWith("video/") ? "video" : "audio");
              }}
            />
          </>
        )}

        <p className={styles.grupoLabel}>Escopo de publicação</p>
        <div className={styles.alternador} role="radiogroup" aria-label="Escopo de publicação">
          <button
            type="button"
            role="radio"
            aria-checked={escopo === "publico"}
            className={`${styles.opcao} ${escopo === "publico" ? styles.opcaoAtiva : ""}`}
            onClick={() => setEscopo("publico")}
          >
            público — qualquer pessoa lê
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={escopo === "privado_profissional"}
            className={`${styles.opcao} ${escopo === "privado_profissional" ? styles.opcaoAtiva : ""}`}
            onClick={() => setEscopo("privado_profissional")}
          >
            só meus pacientes
          </button>
        </div>

        <button className={styles.cta} type="submit" disabled={pending}>
          enviar pra aprovação
        </button>
      </form>

      <PreviewConteudo
        tipo={tipo}
        titulo={titulo}
        conteudo={conteudo}
        categoriaRotulo={tipo === "pratica" ? rotuloCategoria(categoria) : null}
        duracao={duracao}
        intencao={intencao}
        capaUrl={capaUrl}
        midiaUrl={midiaUrl}
        midiaTipo={midiaTipo}
      />
    </div>
  );
}
