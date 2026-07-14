import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../PageHeader";
import { sair } from "./actions";
import styles from "./page.module.css";

function formatarNascimento(data: string, hora: string | null, local: string | null): string {
  const [ano, mes, dia] = data.split("-");
  let texto = `${dia}/${mes}/${ano}`;
  if (hora) texto += `, ${hora.slice(0, 5)}`;
  if (local) texto += ` — ${local}`;
  return texto;
}

export default async function Perfil() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, data_nascimento, hora_nascimento, local_nascimento, profissional_id")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  let nomeProfissional: string | null = null;
  if (profile.profissional_id) {
    const { data: profissional } = await supabase
      .from("profissionais")
      .select("nome")
      .eq("id", profile.profissional_id)
      .maybeSingle();
    nomeProfissional = profissional?.nome ?? null;
  }

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual={null} voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>perfil</p>
        <h1 className={styles.headline}>{profile.nome}</h1>

        <div className={styles.secao}>
          <p className={styles.rotulo}>e-mail</p>
          {user.email ? (
            <p className={styles.valor}>{user.email}</p>
          ) : (
            <a className={styles.link} href="/conta">
              conta ainda não convertida — guardar meu espaço →
            </a>
          )}
        </div>

        <div className={styles.secao}>
          <p className={styles.rotulo}>nascimento</p>
          {profile.data_nascimento ? (
            <>
              <p className={styles.valor}>
                {formatarNascimento(profile.data_nascimento, profile.hora_nascimento, profile.local_nascimento)}
              </p>
              <a className={styles.link} href="/perfil/nascimento">
                editar →
              </a>
            </>
          ) : (
            <a className={styles.link} href="/perfil/nascimento">
              adicionar data de nascimento →
            </a>
          )}
        </div>

        <div className={styles.secao}>
          <p className={styles.rotulo}>profissional</p>
          {nomeProfissional ? (
            <a className={styles.link} href="/terapia">
              conectado(a) com {nomeProfissional} →
            </a>
          ) : (
            <a className={styles.link} href="/terapia">
              conectar com um profissional →
            </a>
          )}
        </div>

        <form action={sair}>
          <button className={styles.sair} type="submit">
            sair
          </button>
        </form>
      </div>
    </main>
  );
}
