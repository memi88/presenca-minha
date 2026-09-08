import { redirect } from "next/navigation";

import { and, eq } from "drizzle-orm";
import { profiles, profissionais, vinculos } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { PLACEHOLDER_TERAPEUTA, imagemUrl } from "@/lib/placeholders";

import { IconeConversa } from "../IconeConversa";
import { IconeDiario } from "../IconeDiario";
import { PageHeader } from "../PageHeader";
import { ContaForm } from "../conta/ContaForm";
import { definirCompartilharLivroVivo, definirCompartilharPraticas, desconectarTerapeuta } from "./actions";
import { CompartilhamentoToggle } from "./CompartilhamentoToggle";
import { ConectarForm } from "./ConectarForm";
import { DesconectarBotao } from "./DesconectarBotao";
import styles from "./page.module.css";

export default async function Terapia() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: { id: true, nome: true, profissionalId: true },
  });
  if (!profile?.nome) redirect("/chegada");

  if (sessao.user.isAnonymous) {
    return (
      <main className={styles.scene}>
        <PageHeader titulo="Terapia" nome={profile.nome} atual={null} voltar={{ href: "/perfil" }} />
        <div className={styles.content}>
          <h2 className={styles.headline}>
            Antes de conectar,{" "}
            <br className={styles.quebra} />
            vamos guardar seu espaço
          </h2>
          <p className={styles.subtext}>
            Perder esse vínculo por não ter um jeito de voltar seria grave demais — por isso, pra
            conectar com um profissional, primeiro a gente guarda seu espaço com e-mail e senha.
          </p>
          <ContaForm next="/terapia" />
        </div>
      </main>
    );
  }

  if (profile.profissionalId) {
    const [profissional, vinculo] = await Promise.all([
      db.query.profissionais.findFirst({
        where: eq(profissionais.id, profile.profissionalId),
        columns: { nome: true, fotoChave: true },
      }),
      db.query.vinculos.findFirst({
        where: and(eq(vinculos.pacienteId, profile.id), eq(vinculos.ativo, true)),
        columns: { createdAt: true, compartilharPraticas: true, compartilharLivroVivo: true },
      }),
    ]);

    const conectadoDesde = vinculo?.createdAt
      ? new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(vinculo.createdAt)
      : null;

    return (
      <main className={styles.scene}>
        <PageHeader titulo="Terapia" nome={profile.nome} atual={null} voltar={{ href: "/perfil" }} />
        <div className={styles.content}>
          <div className={styles.perfilTerapeuta}>
            <div
              className={styles.avatarTerapeuta}
              style={{ backgroundImage: `url(${imagemUrl(profissional?.fotoChave, PLACEHOLDER_TERAPEUTA)})` }}
              aria-hidden="true"
            />
            <h2 className={styles.nomeTerapeuta}>{profissional?.nome ?? "seu profissional"}</h2>
            {conectadoDesde && <p className={styles.conectadoDesde}>conectado(a) desde {conectadoDesde}</p>}
          </div>

          <div className={styles.compartilhamentoSecao}>
            <p className={styles.compartilhamentoRotulo}>Compartilhamento</p>
            <CompartilhamentoToggle
              label="Compartilhar práticas realizadas"
              valorInicial={vinculo?.compartilharPraticas ?? false}
              aoMudar={definirCompartilharPraticas}
            />
            <CompartilhamentoToggle
              label="Compartilhar páginas lidas do Livro Vivo"
              valorInicial={vinculo?.compartilharLivroVivo ?? false}
              aoMudar={definirCompartilharLivroVivo}
            />
          </div>

          <div className={styles.avisoPrivacidade}>
            <svg
              className={styles.avisoPrivacidadeIcone}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" strokeLinecap="round" />
              <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
            </svg>
            <p>
              Conversas específicas e reflexões profundas são compartilhadas individualmente após cada sessão,
              garantindo que seu espaço de anotações permaneça privado até que você decida revelar.
            </p>
          </div>

          <DesconectarBotao desconectar={desconectarTerapeuta} />
        </div>
      </main>
    );
  }

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Terapia" nome={profile.nome} atual={null} voltar={{ href: "/perfil" }} />
      <div className={styles.content}>
        <h2 className={styles.headline}>
          Tem um código{" "}
          <br className={styles.quebra} />
          de convite?
        </h2>
        <p className={styles.subtext}>
          Quem te acompanha pode te passar um código pra conectar seu espaço aqui com o
          acompanhamento dela.
        </p>

        <div className={styles.dinamicaCard}>
          <h3 className={styles.dinamicaTitulo}>Dinâmica da conexão</h3>
          <div className={styles.dinamicaItem}>
            <IconeDiario className={styles.dinamicaIcone} />
            <div>
              <p className={styles.dinamicaItemTitulo}>Acompanhamento contínuo</p>
              <p className={styles.dinamicaItemTexto}>
                Seu terapeuta pode sugerir práticas e escrever anotações direto no seu Diário, entre
                as sessões.
              </p>
            </div>
          </div>
          <div className={styles.dinamicaItem}>
            <IconeConversa className={styles.dinamicaIcone} />
            <div>
              <p className={styles.dinamicaItemTitulo}>Canal de apoio</p>
              <p className={styles.dinamicaItemTexto}>
                Em Recursos, você pode avisar seu terapeuta quando estiver passando por um momento
                difícil.
              </p>
            </div>
          </div>
        </div>

        <p className={styles.subtext}>
          Ao conectar, seu profissional passa a poder escrever no seu Diário e você pode avisar
          ela caso precise de apoio — combinado agora, não pedido de novo depois.
        </p>
        <ConectarForm />
      </div>
    </main>
  );
}
