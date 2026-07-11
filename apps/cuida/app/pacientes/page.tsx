import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { logout } from "../actions";
import styles from "./page.module.css";

type VinculoComPaciente = {
  paciente_id: string;
  created_at: string;
  profiles: { nome: string | null } | null;
};

const UM_DIA_MS = 24 * 60 * 60 * 1000;

function dataRelativa(iso: string): string {
  const dias = Math.floor((Date.now() - new Date(iso).getTime()) / UM_DIA_MS);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 30) return `há ${dias} dias`;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(
    new Date(iso),
  );
}

export default async function Pacientes() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profissional } = await supabase
    .from("profissionais")
    .select("id, nome, codigo_convite")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profissional) redirect("/");

  const [{ data: vinculos }, { data: alertas }, { data: entradas }] = await Promise.all([
    supabase
      .from("vinculos")
      .select("paciente_id, created_at, profiles(nome)")
      .eq("profissional_id", profissional.id)
      .eq("ativo", true)
      .returns<VinculoComPaciente[]>(),
    supabase
      .from("alertas_risco")
      .select("paciente_id")
      .eq("profissional_id", profissional.id)
      .gte("created_at", new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("caderno_entradas")
      .select("paciente_id, created_at")
      .eq("autor_profissional_id", profissional.id)
      .eq("autor_tipo", "profissional")
      .order("created_at", { ascending: false }),
  ]);

  const pacientesComAlerta = new Set(alertas?.map((a) => a.paciente_id));

  // A primeira ocorrência de cada paciente já é a mais recente — a query
  // veio ordenada por created_at desc.
  const ultimaEntradaPorPaciente = new Map<string, string>();
  for (const entrada of entradas ?? []) {
    if (!ultimaEntradaPorPaciente.has(entrada.paciente_id)) {
      ultimaEntradaPorPaciente.set(entrada.paciente_id, entrada.created_at);
    }
  }

  return (
    <main className={styles.scene}>
      <div className={styles.topBar}>
        <p className={styles.greeting}>{profissional.nome}</p>
        <div className={styles.acoesTopo}>
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
        <p className={styles.codigo}>{profissional.codigo_convite}</p>
        <p className={styles.codigoAjuda}>passe esse código pro paciente conectar em "Terapia"</p>
      </div>

      <div className={styles.lista}>
        <p className={styles.listaTitulo}>pacientes</p>
        {!vinculos?.length && <p className={styles.vazio}>ninguém conectado ainda.</p>}
        {vinculos?.map((v) => {
          const ultimaEntrada = ultimaEntradaPorPaciente.get(v.paciente_id);
          return (
            <a key={v.paciente_id} className={styles.paciente} href={`/pacientes/${v.paciente_id}`}>
              <div className={styles.pacienteTopo}>
                <span>{v.profiles?.nome ?? "sem nome"}</span>
                {pacientesComAlerta.has(v.paciente_id) && <span className={styles.atencao}>atenção</span>}
              </div>
              <p className={styles.pacienteContexto}>
                conectado(a) desde {dataRelativa(v.created_at)} ·{" "}
                {ultimaEntrada ? `última entrada sua: ${dataRelativa(ultimaEntrada)}` : "nenhuma entrada ainda"}
              </p>
            </a>
          );
        })}
      </div>
    </main>
  );
}
