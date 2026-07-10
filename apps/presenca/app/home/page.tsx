import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { adiarConversao } from "./actions";
import styles from "./page.module.css";

// Saudação por hora do dia — cálculo determinístico simples, não é a
// variação por sinal (lua, histórico, humor) da Fase 7. "Home básica... sem
// personalização ainda" é o escopo explícito da Fase 1.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 5) return "boa noite";
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome, lembrete_conversao_em")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.nome) redirect("/chegada");

  const mostrarConviteConversao =
    user.is_anonymous === true &&
    (!profile.lembrete_conversao_em || new Date(profile.lembrete_conversao_em) <= new Date());

  return (
    <main className={styles.scene}>
      <div className={styles.topBar}>
        <p className={styles.greeting}>
          {saudacao()}, {profile.nome}
        </p>
        <div className={styles.menuDots} aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>

      {mostrarConviteConversao && (
        <div className={styles.convite}>
          <p>
            Quer poder voltar de qualquer lugar? <a href="/conta">guardar meu espaço</a>
          </p>
          <form action={adiarConversao}>
            <button type="submit" className={styles.conviteDispensar}>
              agora não
            </button>
          </form>
        </div>
      )}

      <div className={styles.bottom}>
        <div className={styles.card}>
          <p className={styles.question}>
            Tem algo pesando
            <br />
            hoje?
          </p>
          {/* Conversa (chat) é fora do escopo da Fase 1 — fica pra quando o
              pipeline de conversa existir. */}
          <button className={styles.ctaStub} type="button" disabled>
            conversar
          </button>
        </div>
        <p className={styles.livroVivo}>ou visitar o Livro Vivo →</p>
      </div>
    </main>
  );
}
