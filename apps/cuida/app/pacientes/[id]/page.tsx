import { notFound, redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  // A RLS só devolve o perfil se houver vínculo ativo com este profissional
  // — se vier vazio, ou não existe esse paciente ou o vínculo não é dele.
  const { data: paciente } = await supabase
    .from("profiles")
    .select("nome")
    .eq("id", id)
    .maybeSingle();
  if (!paciente) notFound();

  const [{ data: entradas }, { data: ultimoAlerta }] = await Promise.all([
    supabase
      .from("caderno_entradas")
      .select("id, tipo, conteudo, created_at")
      .eq("paciente_id", id)
      .eq("autor_tipo", "profissional")
      .eq("autor_profissional_id", profissional.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("alertas_risco")
      .select("created_at")
      .eq("paciente_id", id)
      .eq("profissional_id", profissional.id)
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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

      <EntradaForm pacienteId={id} />

      <div className={styles.historico}>
        <p className={styles.historicoTitulo}>o que você já escreveu</p>
        {!entradas?.length && <p className={styles.vazio}>nada ainda.</p>}
        {entradas?.map((entrada) => (
          <div key={entrada.id} className={styles.entrada}>
            <p className={styles.entradaTipo}>{rotuloTipo[entrada.tipo] ?? entrada.tipo}</p>
            <p className={styles.entradaConteudo}>{entrada.conteudo}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
