import { notFound, redirect } from "next/navigation";

import { and, count, eq } from "drizzle-orm";
import { experienciasEtapas, experienciasGuiadas, experienciasInstancias, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { PLACEHOLDER_TERAPEUTA, imagemUrl } from "@/lib/placeholders";

import { PageHeader } from "../../PageHeader";
import { iniciarExperiencia } from "./actions";
import styles from "./page.module.css";

const ROTULO_TIPO: Record<string, string> = {
  autoguiada: "Autoguiada",
  guiada_metodo: "Guiada pelo método",
  acompanhada: "Acompanhada",
};

const EXPLICACAO_TIPO: Record<string, string> = {
  autoguiada:
    "Sem espera: você percorre as etapas no seu tempo, sem intervenção humana durante o caminho.",
  guiada_metodo:
    "As etapas mudam conforme suas respostas, seguindo uma metodologia já validada pelo especialista.",
  acompanhada:
    "Um humano real vai ler o que você escrever em certas etapas e preparar uma devolutiva pessoal ao final.",
};

export default async function ExperienciaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const [experiencia, contagemEtapas, instanciaExistente] = await Promise.all([
    db.query.experienciasGuiadas.findFirst({
      where: and(eq(experienciasGuiadas.id, id), eq(experienciasGuiadas.publicado, true)),
      columns: { id: true, titulo: true, tipo: true, descricao: true, estimativaFormato: true },
      with: { especialista: { columns: { nome: true, tipo: true, formaDeTrabalho: true, fotoChave: true } } },
    }),
    db.select({ total: count() }).from(experienciasEtapas).where(eq(experienciasEtapas.experienciaId, id)),
    db.query.experienciasInstancias.findFirst({
      where: and(eq(experienciasInstancias.pacienteId, profile.id), eq(experienciasInstancias.experienciaId, id)),
      columns: { id: true },
    }),
  ]);

  if (!experiencia) notFound();
  if (instanciaExistente) redirect(`/experiencias/instancia/${instanciaExistente.id}`);

  const totalEtapas = contagemEtapas[0]?.total ?? 0;
  const descricaoEspecialista = experiencia.especialista
    ? experiencia.especialista.tipo === "Outra"
      ? (experiencia.especialista.formaDeTrabalho ?? experiencia.especialista.tipo)
      : experiencia.especialista.tipo
    : null;

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Experiência" nome={profile.nome} atual={null} voltar={{ href: "/experiencias" }} />
      <div className={styles.content}>
        <span className={styles.badge}>{ROTULO_TIPO[experiencia.tipo] ?? experiencia.tipo}</span>
        <h1 className={styles.headline}>{experiencia.titulo}</h1>
        <p className={styles.subtext}>{experiencia.descricao}</p>

        {experiencia.especialista && (
          <div className={styles.especialistaCard}>
            <div
              className={styles.especialistaAvatar}
              style={{ backgroundImage: `url(${imagemUrl(experiencia.especialista.fotoChave, PLACEHOLDER_TERAPEUTA)})` }}
              aria-hidden="true"
            />
            <div>
              <p className={styles.especialistaRotulo}>Conduzido por</p>
              <p className={styles.especialistaNome}>{experiencia.especialista.nome}</p>
              {descricaoEspecialista && <p className={styles.especialistaTipo}>{descricaoEspecialista}</p>}
            </div>
          </div>
        )}

        <div className={styles.tipoCard}>
          <p className={styles.tipoTitulo}>Como funciona</p>
          <p className={styles.tipoTexto}>{EXPLICACAO_TIPO[experiencia.tipo]}</p>
        </div>

        <div className={styles.ritmoCard}>
          <p className={styles.ritmoTitulo}>Ritmo e formato honesto</p>
          <p className={styles.ritmoTexto}>
            {totalEtapas} {totalEtapas === 1 ? "etapa" : "etapas"}
            {experiencia.estimativaFormato ? ` — ${experiencia.estimativaFormato}` : ""}. Você pode
            interromper ou pausar a qualquer momento.
          </p>
        </div>

        <form action={iniciarExperiencia.bind(null, experiencia.id)}>
          <button className={styles.cta} type="submit">
            Começar →
          </button>
        </form>
      </div>
    </main>
  );
}
