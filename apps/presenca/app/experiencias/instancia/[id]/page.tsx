import { notFound, redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";
import { experienciasDevolutivas, experienciasInstancias, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../../../PageHeader";
import { consentir } from "./actions";
import { EtapaForm } from "./EtapaForm";
import styles from "./page.module.css";

export default async function ExperienciaAndamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const instancia = await db.query.experienciasInstancias.findFirst({
    where: eq(experienciasInstancias.id, id),
    with: {
      experiencia: {
        columns: { id: true, titulo: true, tipo: true },
        with: { especialista: { columns: { nome: true } } },
      },
      etapaAtual: {
        columns: {
          id: true,
          ordem: true,
          conteudo: true,
          tipoResposta: true,
          opcoes: true,
          compartilhadaComEspecialista: true,
        },
      },
      consentimento: { columns: { consentido: true, revogadoEm: true } },
    },
  });
  // Autorização: instância precisa existir E pertencer a este paciente —
  // checado explicitamente (D1 não tem RLS), não só via WHERE na query
  // acima pra deixar o 404 e o "não é seu" com o mesmo resultado visível.
  if (!instancia || instancia.pacienteId !== profile.id) notFound();

  const consentiu = !!instancia.consentimento?.consentido && !instancia.consentimento.revogadoEm;
  const precisaConsentir =
    instancia.experiencia.tipo === "acompanhada" &&
    !!instancia.etapaAtual?.compartilhadaComEspecialista &&
    !consentiu &&
    instancia.estado === "em_andamento";

  let devolutiva: { conteudo: string } | null = null;
  if (instancia.estado === "concluida" && instancia.experiencia.tipo === "acompanhada") {
    devolutiva =
      (await db.query.experienciasDevolutivas.findFirst({
        where: eq(experienciasDevolutivas.instanciaId, instancia.id),
        orderBy: desc(experienciasDevolutivas.criadoEm),
        columns: { conteudo: true },
      })) ?? null;
  }

  return (
    <main className={styles.scene}>
      <PageHeader titulo={instancia.experiencia.titulo} nome={profile.nome} atual={null} voltar={{ href: "/experiencias" }} />
      <div className={styles.content}>
        {instancia.estado === "concluida" && (
          <>
            <p className={styles.eyebrow}>concluída</p>
            <h1 className={styles.headline}>{instancia.experiencia.titulo}</h1>
            {devolutiva ? (
              <div className={styles.devolutivaCard}>
                <p className={styles.devolutivaRotulo}>Devolutiva de {instancia.experiencia.especialista?.nome}</p>
                <p className={styles.devolutivaTexto}>{devolutiva.conteudo}</p>
              </div>
            ) : instancia.experiencia.tipo === "acompanhada" ? (
              <p className={styles.subtext}>Sua jornada terminou — a devolutiva está sendo preparada.</p>
            ) : (
              <p className={styles.subtext}>Você concluiu essa experiência.</p>
            )}
            <a className={styles.voltarLink} href="/experiencias">
              ← Ver outras experiências
            </a>
          </>
        )}

        {instancia.estado === "aguardando_especialista" && (
          <>
            <p className={styles.eyebrow}>Etapa {instancia.etapaAtual?.ordem}</p>
            <h1 className={styles.headline}>Sua resposta foi enviada</h1>
            <p className={styles.subtext}>
              {instancia.experiencia.especialista?.nome ?? "O especialista"} vai ler o que você escreveu e
              preparar o próximo passo. Sem prazo prometido — você é avisado assim que houver novidade.
            </p>
          </>
        )}

        {instancia.estado === "em_andamento" && instancia.etapaAtual && (
          <>
            <p className={styles.eyebrow}>Etapa {instancia.etapaAtual.ordem}</p>
            <p className={styles.etapaConteudo}>{instancia.etapaAtual.conteudo}</p>

            {precisaConsentir ? (
              <div className={styles.consentimentoCard}>
                <p className={styles.consentimentoTitulo}>Um acordo de cuidado antes de continuar</p>
                <p className={styles.consentimentoTexto}>
                  Nesta etapa, {instancia.experiencia.especialista?.nome ?? "o especialista"} vai ler o que
                  você escrever, com sigilo profissional, pra preparar uma devolutiva pessoal. Nenhuma
                  inteligência artificial interpreta seu relato — e você pode revogar isso a qualquer
                  momento no seu perfil.
                </p>
                <form action={consentir.bind(null, instancia.id)}>
                  <button className={styles.cta} type="submit">
                    Concordo e continuo →
                  </button>
                </form>
              </div>
            ) : (
              <EtapaForm
                instanciaId={instancia.id}
                tipoResposta={instancia.etapaAtual.tipoResposta as "texto" | "escolha"}
                opcoes={instancia.etapaAtual.opcoes}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}
