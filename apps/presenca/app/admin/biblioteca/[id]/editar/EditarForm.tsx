"use client";

import { useActionState, useState } from "react";

import { CATEGORIAS_PRATICA, type CategoriaPratica } from "@/lib/categoriasPratica";
import { PLACEHOLDER_LIVRO_VIVO, PLACEHOLDER_PRATICA, imagemUrl } from "@/lib/placeholders";

import { editarConteudo } from "./actions";
import { PreviewConteudo } from "./PreviewConteudo";
import styles from "./page.module.css";

type Props = {
  id: string;
  tipo: "pagina_livro_vivo" | "pratica";
  tituloInicial: string;
  conteudoInicial: string;
  categoriaInicial: string | null;
  duracaoInicial: string | null;
  intencaoInicial: string | null;
  capaChaveInicial: string | null;
  midiaChaveInicial: string | null;
  midiaTipoInicial: string | null;
};

function rotuloCategoria(categoria: CategoriaPratica): string | null {
  return CATEGORIAS_PRATICA.find((c) => c.valor === categoria)?.rotulo ?? null;
}

export function EditarForm({
  id,
  tipo,
  tituloInicial,
  conteudoInicial,
  categoriaInicial,
  duracaoInicial,
  intencaoInicial,
  capaChaveInicial,
  midiaChaveInicial,
  midiaTipoInicial,
}: Props) {
  const acaoComId = editarConteudo.bind(null, id);
  const [state, action, pending] = useActionState(acaoComId, {});

  const [categoria, setCategoria] = useState<CategoriaPratica>((categoriaInicial as CategoriaPratica) ?? "respiracao");
  const [titulo, setTitulo] = useState(tituloInicial);
  const [conteudo, setConteudo] = useState(conteudoInicial);
  const [duracao, setDuracao] = useState(duracaoInicial ?? "");
  const [intencao, setIntencao] = useState(intencaoInicial ?? "");
  const [capaUrl, setCapaUrl] = useState<string | null>(
    capaChaveInicial ? imagemUrl(capaChaveInicial, tipo === "pratica" ? PLACEHOLDER_PRATICA : PLACEHOLDER_LIVRO_VIVO) : null,
  );
  const [midiaUrl, setMidiaUrl] = useState<string | null>(midiaChaveInicial ? `/imagens/${midiaChaveInicial}` : null);
  const [midiaTipo, setMidiaTipo] = useState<"audio" | "video" | null>(
    midiaTipoInicial === "video" ? "video" : midiaTipoInicial === "audio" ? "audio" : null,
  );

  return (
    <div className={styles.formELayout}>
      <form action={action} className={styles.form}>
        {state.erro && <p className={styles.erro}>{state.erro}</p>}

        {tipo === "pratica" && (
          <>
            <input type="hidden" name="categoria" value={categoria} />
            <label className={styles.label}>Categoria</label>
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

            <label className={styles.label}>Duração</label>
            <input
              className={styles.field}
              type="text"
              name="duracao"
              placeholder="ex: 5 min"
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
            />

            <label className={styles.label}>Intenção</label>
            <input
              className={styles.field}
              type="text"
              name="intencao"
              placeholder="ex: Acalmar antes de dormir"
              value={intencao}
              onChange={(e) => setIntencao(e.target.value)}
            />
          </>
        )}

        <label className={styles.label}>Título</label>
        <input
          className={styles.field}
          type="text"
          name="titulo"
          required
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <label className={styles.label}>Conteúdo</label>
        <textarea
          className={styles.field}
          name="conteudo"
          rows={10}
          required
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
        />

        <label className={styles.label}>Capa {capaUrl ? "(trocar)" : "(adicionar)"}</label>
        <input
          className={styles.field}
          type="file"
          name="capa"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setCapaUrl(e.target.files?.[0] ? URL.createObjectURL(e.target.files[0]) : capaUrl)}
        />

        {tipo === "pratica" && (
          <>
            <label className={styles.label}>Conteúdo em áudio ou vídeo {midiaUrl ? "(trocar)" : "(adicionar)"}</label>
            <input
              className={styles.field}
              type="file"
              name="midia"
              accept="audio/mpeg,audio/mp4,audio/wav,audio/ogg,video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (!arquivo) return;
                setMidiaUrl(URL.createObjectURL(arquivo));
                setMidiaTipo(arquivo.type.startsWith("video/") ? "video" : "audio");
              }}
            />
          </>
        )}

        <button className={styles.cta} type="submit" disabled={pending}>
          {pending ? "salvando…" : "Salvar alterações"}
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
