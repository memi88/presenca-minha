"use client";

import styles from "./page.module.css";

type Props = {
  tipo: "pagina_livro_vivo" | "pratica";
  titulo: string;
  conteudo: string;
  categoriaRotulo?: string | null;
  duracao?: string;
  intencao?: string;
  capaUrl?: string | null;
  midiaUrl?: string | null;
  midiaTipo?: "audio" | "video" | null;
};

// Pré-visualização de como o conteúdo ficaria pra quem lê — não é uma
// cópia pixel-a-pixel da tela real do Presença (apps diferentes, cada um
// com o próprio sistema visual), só a MESMA estrutura de informação
// (capa, categoria/duração, intenção, corpo já com quebra de linha
// preservada) pra dar confiança antes de enviar pra aprovação.
export function PreviewConteudo({
  tipo,
  titulo,
  conteudo,
  categoriaRotulo,
  duracao,
  intencao,
  capaUrl,
  midiaUrl,
  midiaTipo,
}: Props) {
  const paragrafos = conteudo.split(/\n{2,}/).filter(Boolean);
  const meta = [categoriaRotulo, duracao].filter(Boolean).join(" · ");

  return (
    <div className={styles.preview}>
      <p className={styles.previewRotulo}>Pré-visualização</p>
      <div className={styles.previewCard}>
        {capaUrl && <div className={styles.previewCapa} style={{ backgroundImage: `url(${capaUrl})` }} />}
        {meta && <p className={styles.previewMeta}>{meta}</p>}
        <h3 className={styles.previewTitulo}>{titulo || "(sem título ainda)"}</h3>
        {tipo === "pratica" && intencao && <p className={styles.previewIntencao}>{intencao}</p>}
        {midiaUrl &&
          (midiaTipo === "video" ? (
            <video className={styles.previewMidia} controls src={midiaUrl} />
          ) : (
            <audio className={styles.previewMidia} controls src={midiaUrl} />
          ))}
        <div className={styles.previewCorpo}>
          {paragrafos.length ? (
            paragrafos.map((p, i) => (
              <p key={i} className={styles.previewParagrafo}>
                {p}
              </p>
            ))
          ) : (
            <p className={styles.previewVazio}>O conteúdo aparece aqui conforme você escreve.</p>
          )}
        </div>
      </div>
    </div>
  );
}
