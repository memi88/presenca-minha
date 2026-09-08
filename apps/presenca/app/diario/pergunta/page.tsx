import { redirect } from "next/navigation";

import { desc, eq } from "drizzle-orm";
import { cadernoEntradas, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

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
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true },
  });
  if (!profile?.nome) redirect("/chegada");

  const ultimaEntrada = await db.query.cadernoEntradas.findFirst({
    where: eq(cadernoEntradas.pacienteId, profile.id),
    orderBy: desc(cadernoEntradas.createdAt),
    columns: { autorTipo: true, tipo: true, conteudo: true },
  });

  const perguntaEmAberto = ultimaEntrada?.autorTipo === "profissional" && ultimaEntrada?.tipo === "pergunta";
  // Sem pergunta pendente — nada focado pra mostrar, manda pro Diário
  // completo em vez de uma tela vazia.
  if (!perguntaEmAberto || !ultimaEntrada?.conteudo) redirect("/diario");

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Diário" nome={profile.nome} atual="escrever" voltar={{ href: "/home" }} />
      <div className={styles.content}>
        <blockquote className={styles.pergunta}>“{ultimaEntrada.conteudo}”</blockquote>
        <RespostaForm />
      </div>
    </main>
  );
}
