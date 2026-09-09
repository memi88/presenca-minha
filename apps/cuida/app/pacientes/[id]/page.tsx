import { notFound, redirect } from "next/navigation";

import { and, desc, eq, gte } from "drizzle-orm";
import { alertasRisco, biblioteca, cadernoEntradas, profiles, profissionais, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { EntradaForm } from "./EntradaForm";
import styles from "./page.module.css";

const rotuloTipo: Record<string, string> = {
  pergunta: "pergunta",
  pratica_indicada: "prática indicada",
  pagina_indicada: "página indicada",
  reflexao: "reflexão",
  simbolo: "símbolo",
};

export default async function DetalhePaciente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profissional = await db.query.profissionais.findFirst({
    where: eq(profissionais.userId, sessao.user.id),
    columns: { id: true },
  });
  if (!profissional) redirect("/");

  // Substitui a RLS antiga ("paciente lê só se houver vínculo ativo com
  // este profissional") — sem essa checagem explícita, qualquer
  // profissional autenticado poderia ler/escrever no caderno de qualquer
  // paciente só adivinhando o id na URL.
  const vinculo = await db.query.vinculos.findFirst({
    where: and(eq(vinculos.profissionalId, profissional.id), eq(vinculos.pacienteId, id), eq(vinculos.ativo, true)),
    columns: { pacienteId: true },
  });
  if (!vinculo) notFound();

  const paciente = await db.query.profiles.findFirst({
    where: eq(profiles.id, id),
    columns: { nome: true },
  });
  if (!paciente) notFound();

  const desde48h = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const [entradas, compartilhadas, ultimoAlerta, itensBiblioteca] = await Promise.all([
    db.query.cadernoEntradas.findMany({
      where: and(
        eq(cadernoEntradas.pacienteId, id),
        eq(cadernoEntradas.autorTipo, "profissional"),
        eq(cadernoEntradas.autorProfissionalId, profissional.id),
      ),
      orderBy: desc(cadernoEntradas.createdAt),
      columns: { id: true, tipo: true, conteudo: true },
    }),
    // A checagem de vínculo ativo já foi feita acima — aqui só falta o
    // filtro de opt-in por entrada (compartilhar = true), que sempre foi
    // uma checagem separada da RLS antiga, não substituída por ela.
    db.query.cadernoEntradas.findMany({
      where: and(
        eq(cadernoEntradas.pacienteId, id),
        eq(cadernoEntradas.autorTipo, "usuario"),
        eq(cadernoEntradas.compartilhar, true),
      ),
      orderBy: desc(cadernoEntradas.createdAt),
      columns: { id: true, tipo: true, conteudo: true },
    }),
    db.query.alertasRisco.findFirst({
      where: and(
        eq(alertasRisco.pacienteId, id),
        eq(alertasRisco.profissionalId, profissional.id),
        gte(alertasRisco.createdAt, desde48h),
      ),
      orderBy: desc(alertasRisco.createdAt),
      columns: { createdAt: true },
    }),
    // Catálogo pra "prática indicada"/"página indicada" apontarem pra um
    // item de verdade em vez de só texto livre — só publicado (RLS antiga
    // de `biblioteca` também exigia isso; nada pendente aparece aqui).
    db.query.biblioteca.findMany({
      where: eq(biblioteca.publicado, true),
      orderBy: biblioteca.titulo,
      columns: { id: true, tipo: true, titulo: true },
    }),
  ]);

  return (
    <main className={styles.scene}>
      <a className={styles.voltar} href="/pacientes">
        ‹ pacientes
      </a>
      <h1 className={styles.titulo}>{paciente.nome}</h1>

      {ultimoAlerta && (
        <p className={styles.alerta}>
          {paciente.nome} avisou que está passando por um momento difícil, nas últimas 48h.
        </p>
      )}

      <EntradaForm pacienteId={id} itensBiblioteca={itensBiblioteca} />

      <div className={styles.historico}>
        <p className={styles.historicoTitulo}>o que {paciente.nome} compartilhou com você</p>
        {!compartilhadas.length && <p className={styles.vazio}>nada compartilhado ainda.</p>}
        {compartilhadas.map((entrada) => (
          <div key={entrada.id} className={styles.entrada}>
            <p className={styles.entradaTipo}>{rotuloTipo[entrada.tipo] ?? entrada.tipo}</p>
            <p className={styles.entradaConteudo}>{entrada.conteudo}</p>
          </div>
        ))}
      </div>

      <div className={styles.historico}>
        <p className={styles.historicoTitulo}>o que você já escreveu</p>
        {!entradas.length && <p className={styles.vazio}>nada ainda.</p>}
        {entradas.map((entrada) => (
          <div key={entrada.id} className={styles.entrada}>
            <p className={styles.entradaTipo}>{rotuloTipo[entrada.tipo] ?? entrada.tipo}</p>
            <p className={styles.entradaConteudo}>{entrada.conteudo}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
