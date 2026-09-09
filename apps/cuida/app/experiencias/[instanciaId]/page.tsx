import { notFound, redirect } from "next/navigation";

import { and, asc, eq } from "drizzle-orm";
import { experienciasEtapas, experienciasInstancias, experienciasRespostas, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { DevolutivaForm } from "./DevolutivaForm";
import { liberarProximaEtapa } from "./actions";
import styles from "./page.module.css";

export default async function ExperienciaInstanciaDetalhe({
  params,
}: {
  params: Promise<{ instanciaId: string }>;
}) {
  const { instanciaId } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  const instancia = await db.query.experienciasInstancias.findFirst({
    where: eq(experienciasInstancias.id, instanciaId),
    with: {
      paciente: { columns: { nome: true } },
      experiencia: { columns: { id: true, titulo: true, especialistaId: true } },
      etapaAtual: { columns: { id: true, ordem: true, conteudo: true, tipoResposta: true } },
    },
  });
  // Autorização: só o especialista dono da experiência acessa — checado
  // explicitamente (D1 não tem RLS), mesmo padrão do resto do app.
  if (!instancia || instancia.experiencia.especialistaId !== profissional.id) notFound();

  // Todas as respostas de etapas COMPARTILHADAS desta instância — não só
  // a etapa atual, pra dar contexto completo da jornada até aqui (regra
  // do consentimento já garante que só entram aqui etapas marcadas
  // compartilhadaComEspecialista).
  const respostasCompartilhadas = await db
    .select({
      conteudo: experienciasRespostas.conteudo,
      respondidoEm: experienciasRespostas.respondidoEm,
      etapaOrdem: experienciasEtapas.ordem,
      etapaConteudo: experienciasEtapas.conteudo,
    })
    .from(experienciasRespostas)
    .innerJoin(experienciasEtapas, eq(experienciasRespostas.etapaId, experienciasEtapas.id))
    .where(and(eq(experienciasRespostas.instanciaId, instanciaId), eq(experienciasEtapas.compartilhadaComEspecialista, true)))
    .orderBy(asc(experienciasEtapas.ordem));

  let proximaEtapaExiste = false;
  if (instancia.estado === "aguardando_especialista" && instancia.etapaAtual) {
    const proxima = await db.query.experienciasEtapas.findFirst({
      where: and(
        eq(experienciasEtapas.experienciaId, instancia.experiencia.id),
        eq(experienciasEtapas.ordem, instancia.etapaAtual.ordem + 1),
      ),
      columns: { id: true },
    });
    proximaEtapaExiste = !!proxima;
  }

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/experiencias">
        ‹ experiências
      </a>
      <p className={styles.eyebrow}>{instancia.experiencia.titulo}</p>
      <h1 className={styles.headline}>{instancia.paciente?.nome ?? "sem nome"}</h1>

      <div className={styles.respostas}>
        {respostasCompartilhadas.map((r, i) => (
          <div key={i} className={styles.respostaCard}>
            <p className={styles.respostaEtapa}>Etapa {r.etapaOrdem}</p>
            <p className={styles.respostaPergunta}>{r.etapaConteudo}</p>
            <p className={styles.respostaConteudo}>{formatarResposta(r.conteudo)}</p>
          </div>
        ))}
      </div>

      {instancia.estado === "aguardando_especialista" &&
        (proximaEtapaExiste ? (
          <form action={liberarProximaEtapa.bind(null, instanciaId)}>
            <button className={styles.cta} type="submit">
              Liberar próxima etapa
            </button>
          </form>
        ) : (
          <DevolutivaForm instanciaId={instanciaId} />
        ))}

      {instancia.estado === "em_andamento" && <p className={styles.aviso}>Aguardando a pessoa responder.</p>}
      {instancia.estado === "concluida" && <p className={styles.aviso}>Jornada concluída.</p>}
    </main>
  );
}

// Resposta de etapa 'escolha' vem serializada como `{escolha,nota}` (ver
// app/experiencias/instancia/[id]/actions.ts do Presença) — desserializa
// pra exibir de forma legível; texto simples passa direto.
function formatarResposta(conteudo: string): string {
  try {
    const parsed = JSON.parse(conteudo) as { escolha?: string; nota?: string | null };
    if (parsed.escolha) return parsed.nota ? `${parsed.escolha} — "${parsed.nota}"` : parsed.escolha;
  } catch {
    // não era JSON — resposta de texto simples, segue abaixo
  }
  return conteudo;
}
