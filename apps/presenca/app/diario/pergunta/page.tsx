import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { PageHeader } from "../../PageHeader";
import { RespostaForm } from "./RespostaForm";
import styles from "./page.module.css";

// Tela focada pra responder uma pergunta em aberto do terapeuta (mockup
// docs/redesign/pergunta_do_terapeuta) — sem lista, sem mais nada, só a
// pergunta e o espaço pra responder. A resposta é uma entrada comum no
// Diário (mesma action `criarEntrada`); não existe vínculo estruturado
// pergunta→resposta no schema, é ordem cronológica mesmo (igual sempre
// foi). Mesma condição do "perguntaEmAberto" da Home (lib menuHome não
// exporta isso — replicado aqui de propósito, é uma checagem de 2 campos,
// não vale extrair só por isso).
export default async function DiarioPergunta() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: profile } = await supabase.from("profiles").select("nome").eq("id", user.id).maybeSingle();
  if (!profile?.nome) redirect("/chegada");

  const { data: ultimaEntrada } = await supabase
    .from("caderno_entradas")
    .select("id, autor_tipo, tipo, conteudo")
    .eq("paciente_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const perguntaEmAberto = ultimaEntrada?.autor_tipo === "profissional" && ultimaEntrada?.tipo === "pergunta";
  // Sem pergunta pendente — nada focado pra mostrar, manda pro Diário
  // completo em vez de uma tela vazia.
  if (!perguntaEmAberto || !ultimaEntrada?.conteudo) redirect("/diario");

  return (
    <main className={styles.scene}>
      <PageHeader nome={profile.nome} atual="escrever" voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.content}>
        <blockquote className={styles.pergunta}>“{ultimaEntrada.conteudo}”</blockquote>
        <RespostaForm />
      </div>
    </main>
  );
}
