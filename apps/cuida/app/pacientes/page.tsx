import { redirect } from "next/navigation";

import { and, desc, eq, gte } from "drizzle-orm";
import { alertasRisco, cadernoEntradas, profissionais, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { adiarLembretePerfil, logout } from "../actions";
import styles from "./page.module.css";

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function dataRelativa(data: Date): string {
  const dias = Math.floor((Date.now() - data.getTime()) / UM_DIA_MS);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(data);
}

export default async function Pacientes() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true, nome: true, codigoConvite: true, tipo: true, lembretePerfilEm: true },
  });
  if (!profissional) redirect("/");

  // Gate do pré-cadastro (docs/presenca-extensao-terapeutas-biblioteca copy.md
  // §2/§3) — código de convite genérico continua liberado sem essa exigência.
  const perfilIncompleto = !profissional.tipo;
  const mostrarBannerPerfil =
    perfilIncompleto && (!profissional.lembretePerfilEm || profissional.lembretePerfilEm <= new Date());

  const desde48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [vinculosAtivos, alertas, entradas] = await Promise.all([
    db.query.vinculos.findMany({
      where: and(eq(vinculos.profissionalId, profissional.id), eq(vinculos.ativo, true)),
      columns: { pacienteId: true, createdAt: true },
      with: { paciente: { columns: { nome: true } } },
    }),
    db
      .select({ pacienteId: alertasRisco.pacienteId })
      .from(alertasRisco)
      .where(and(eq(alertasRisco.profissionalId, profissional.id), gte(alertasRisco.createdAt, desde48h))),
    db.query.cadernoEntradas.findMany({
      where: and(eq(cadernoEntradas.autorProfissionalId, profissional.id), eq(cadernoEntradas.autorTipo, "profissional")),
      orderBy: desc(cadernoEntradas.createdAt),
      columns: { pacienteId: true, createdAt: true },
    }),
  ]);

  const pacientesComAlerta = new Set(alertas.map((a) => a.pacienteId));

  // A primeira ocorrência de cada paciente já é a mais recente — a query
  // veio ordenada por createdAt desc.
  const ultimaEntradaPorPaciente = new Map<string, Date>();
  for (const entrada of entradas) {
    if (!ultimaEntradaPorPaciente.has(entrada.pacienteId)) {
      ultimaEntradaPorPaciente.set(entrada.pacienteId, entrada.createdAt);
    }
  }

  return (
    <main className={styles.scene}>
      <div className={styles.topBar}>
        <p className={styles.greeting}>{profissional.nome}</p>
        <div className={styles.acoesTopo}>
          <a className={styles.perfil} href="/experiencias">
            experiências
          </a>
          <a className={styles.perfil} href="/biblioteca/nova">
            propor conteúdo
          </a>
          <a className={styles.perfil} href="/experiencias-guiadas/nova">
            propor experiência
          </a>
          <a className={styles.perfil} href="/perfil">
            meu perfil
          </a>
          <form action={logout}>
            <button className={styles.logout} type="submit">
              sair
            </button>
          </form>
        </div>
      </div>

      <div className={styles.codigoCard}>
        <p className={styles.codigoLabel}>seu código de convite</p>
        <p className={styles.codigo}>{profissional.codigoConvite}</p>
        <p className={styles.codigoAjuda}>passe esse código pro paciente conectar em "Terapia"</p>
      </div>

      {perfilIncompleto ? (
        <div className={styles.acaoBloqueada}>
          <span className={styles.acaoBloqueadaIcone} aria-hidden="true">
            🔒
          </span>
          <div className={styles.acaoBloqueadaCopy}>
            <p className={styles.acaoBloqueadaTitulo}>Pré-cadastrar um paciente</p>
            <p className={styles.acaoBloqueadaSub}>Complete seu perfil pra liberar — leva menos de um minuto.</p>
          </div>
          <a className={styles.acaoBloqueadaBtn} href="/perfil/completar?next=/pacientes/novo">
            completar perfil →
          </a>
        </div>
      ) : null}

      <div className={styles.lista}>
        <div className={styles.listaTopo}>
          <p className={styles.listaTitulo}>pacientes</p>
          {!perfilIncompleto && (
            <a className={styles.preCadastrarLink} href="/pacientes/novo">
              + pré-cadastrar paciente
            </a>
          )}
        </div>
        {!vinculosAtivos.length && <p className={styles.vazio}>ninguém conectado ainda.</p>}
        {vinculosAtivos.map((v) => {
          if (!v.pacienteId) return null;
          const ultimaEntrada = ultimaEntradaPorPaciente.get(v.pacienteId);
          return (
            <a key={v.pacienteId} className={styles.paciente} href={`/pacientes/${v.pacienteId}`}>
              <div className={styles.pacienteTopo}>
                <span>{v.paciente?.nome ?? "sem nome"}</span>
                {pacientesComAlerta.has(v.pacienteId) && <span className={styles.atencao}>atenção</span>}
              </div>
              <p className={styles.pacienteContexto}>
                conectado(a) desde {dataRelativa(v.createdAt)} ·{" "}
                {ultimaEntrada ? `última entrada sua: ${dataRelativa(ultimaEntrada)}` : "nenhuma entrada ainda"}
              </p>
            </a>
          );
        })}
      </div>

      {mostrarBannerPerfil && (
        <div className={styles.banner}>
          <div className={styles.bannerMsg}>
            Complete seu perfil
            <span className={styles.bannerSub}>Ajuda a calibrar como seus pacientes chegam até você</span>
          </div>
          <div className={styles.bannerAcoes}>
            <a className={styles.bannerPrimaria} href="/perfil/completar?next=/pacientes">
              completar
            </a>
            <form action={adiarLembretePerfil}>
              <button className={styles.bannerDispensar} type="submit">
                agora não
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
