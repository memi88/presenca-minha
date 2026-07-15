import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { precisaCheckin, precisaVisitaCheckin } from "@/lib/checkin";
import {
  HEADLINE_CONTINUAR,
  HEADLINE_CONTINUAR_SEM_HISTORICO,
  HEADLINE_MOOD,
  HEADLINE_RETOMADA,
  destinoIdDeUltimoDestino,
  listaDestinos,
  ordemComDestaque,
  ordemPorMood,
} from "@/lib/menuHome";
import { atualizarStreak } from "@/lib/streak";

import { CirculoRespirando } from "../CirculoRespirando";
import { MonogramaP } from "../MonogramaP";
import { adiarConversao, adiarNascimento } from "./actions";
import { InstalarPWABanner } from "./InstalarPWABanner";
import styles from "./page.module.css";

// Saudação por hora do dia — separada do menu de destinos (que varia por
// sinal, ver lib/menuHome.ts). Esta aqui é só o "bom dia/boa tarde/boa
// noite" de topo.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 5) return "boa noite";
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

const DIAS_PARA_CONVITE_NASCIMENTO = 3;

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "nome, lembrete_conversao_em, presenca_hoje, presenca_hoje_em, ultima_visita_em, ultimo_destino, data_nascimento, streak_dias_consecutivos, streak_atualizado_em, lembrete_nascimento_em",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.nome) redirect("/chegada");
  // Gatilho do check-in: 2+ dias desde a última VISITA (não desde a última
  // resposta de humor) — ver lib/checkin.ts. registrarPresenca já atualiza
  // ultima_visita_em ao responder, então isso não vira loop.
  if (precisaVisitaCheckin(profile.ultima_visita_em)) redirect("/hoje");

  // O humor só continua guiando a ordem do menu enquanto estiver "fresco"
  // (mesma janela de 12h de sempre) — depois disso a Home usa outro sinal
  // (pergunta em aberto ou "continue de onde parou"), não repete a
  // pergunta de novo fora de hora.
  const moodFresco = !precisaCheckin(profile.presenca_hoje_em);

  // "Confuso" só reduz a tela (esconde Terapia) enquanto o humor está
  // fresco — não faz sentido esconder por causa de uma resposta de dias atrás.
  const reduzido = moodFresco && profile.presenca_hoje === "confuso";

  const mostrarConviteConversao =
    user.is_anonymous === true &&
    (!profile.lembrete_conversao_em || new Date(profile.lembrete_conversao_em) <= new Date());

  // Sinal interno pra decidir quando convidar a personalizar a experiência
  // (nascimento, PRD §5) — nunca exibido como contador (lib/streak.ts).
  const { streak, atualizadoEm: streakAtualizadoEm } = atualizarStreak(
    profile.streak_dias_consecutivos ?? 0,
    profile.streak_atualizado_em,
    new Date(),
  );
  const mostrarConviteNascimento =
    streak >= DIAS_PARA_CONVITE_NASCIMENTO &&
    !profile.data_nascimento &&
    (!profile.lembrete_nascimento_em || new Date(profile.lembrete_nascimento_em) <= new Date());

  const [{ data: ultimaEntrada }, { data: entradasRevisitar }] = await Promise.all([
    supabase
      .from("caderno_entradas")
      .select("autor_tipo, tipo")
      .eq("paciente_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    reduzido
      ? Promise.resolve({ data: null })
      : supabase
          .from("caderno_entradas")
          .select("id")
          .eq("paciente_id", user.id)
          .eq("revisitar", true)
          .limit(1)
          .maybeSingle(),
  ]);

  const perguntaEmAberto = ultimaEntrada?.autor_tipo === "profissional" && ultimaEntrada?.tipo === "pergunta";
  const temRevisitar = !!entradasRevisitar;

  // As três categorias que decidem o menu — nunca rotulam a pessoa de
  // volta, só escolhem qual convite mostrar (PRD §7).
  let headline: string;
  let ordemIds;
  if (moodFresco) {
    headline = HEADLINE_MOOD;
    ordemIds = ordemPorMood(profile.presenca_hoje);
  } else if (perguntaEmAberto) {
    headline = HEADLINE_RETOMADA;
    ordemIds = ordemComDestaque("escrever");
  } else {
    const destinoId = destinoIdDeUltimoDestino(profile.ultimo_destino);
    headline = destinoId ? HEADLINE_CONTINUAR : HEADLINE_CONTINUAR_SEM_HISTORICO;
    ordemIds = ordemComDestaque(destinoId);
  }
  const destaqueId = ordemIds[0];
  const destinos = listaDestinos(ordemIds);
  // listaDestinos(ordemIds) sempre recebe os 4 ids (ordemPorMood/ordemComDestaque
  // nunca retornam menos que isso) — index sempre em bounds.
  const destinoPrincipal = destinos[0]!;

  await supabase
    .from("profiles")
    .update({
      ultima_visita_em: new Date().toISOString(),
      streak_dias_consecutivos: streak,
      streak_atualizado_em: streakAtualizadoEm,
    })
    .eq("id", user.id);

  return (
    <main className={styles.scene}>
      <div className={styles.topBar}>
        <div className={styles.topBarEsquerda}>
          <a className={styles.monogramaLink} href="/home" aria-label="Página inicial">
            <MonogramaP className={styles.monograma} />
          </a>
          <p className={styles.wordmarkDesktop}>
            <CirculoRespirando className={styles.wordmarkDot} />
            presença
          </p>
        </div>
        <div className={styles.topBarDireita}>
          <p className={styles.greeting}>
            {saudacao()}, {profile.nome}
          </p>
          <nav className={styles.navDesktop}>
            <a className={styles.navItem} href="/conversa">
              Conversa
            </a>
            <a className={styles.navItem} href="/livro-vivo">
              Livro Vivo
            </a>
            <a className={styles.navItem} href="/diario">
              Diário
            </a>
            <a className={styles.navItem} href="/meditacao">
              Práticas
            </a>
          </nav>
          <a className={styles.menuAvatar} href="/perfil" aria-label="Perfil">
            {profile.nome.charAt(0).toUpperCase()}
          </a>
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

      {!mostrarConviteConversao && mostrarConviteNascimento && (
        <div className={styles.convite}>
          <p>
            Quer personalizar sua presença? <a href="/perfil/nascimento">contar sua chegada ao mundo</a>
          </p>
          <form action={adiarNascimento}>
            <button type="submit" className={styles.conviteDispensar}>
              agora não
            </button>
          </form>
        </div>
      )}

      <InstalarPWABanner oculto={mostrarConviteConversao || mostrarConviteNascimento} />

      <div className={styles.bottom}>
        <p className={styles.greetingDesktop}>
          {saudacao()}, {profile.nome}.
        </p>
        <p className={styles.headline}>{headline}</p>
        <div className={styles.pilulas}>
          {destinos.map((destino) => {
            const emDestaque = destino.id === destaqueId;
            const classe = emDestaque ? styles.pilulaDestaque : styles.pilula;
            if (!destino.rota) {
              // Fallback pra um destino futuro sem rota ainda — hoje os 4
              // destinos já têm rota real, nenhum cai aqui.
              return (
                <span key={destino.id} className={`${classe} ${styles.pilulaDesabilitada}`}>
                  {destino.rotulo}
                </span>
              );
            }
            return (
              <a key={destino.id} className={classe} href={destino.rota}>
                {destino.rotulo}
              </a>
            );
          })}
        </div>

        {/* Desktop: o nav do topo já dá acesso direto aos 4 destinos, então
            aqui vira só a recomendação em si — uma única opção (o destino
            em destaque), sem repetir os 4 pills do mobile. */}
        <div className={styles.recomendacaoDesktop}>
          {destinoPrincipal.rota ? (
            <a className={styles.pilulaDestaque} href={destinoPrincipal.rota}>
              {destinoPrincipal.rotulo}
            </a>
          ) : (
            <span className={`${styles.pilulaDestaque} ${styles.pilulaDesabilitada}`}>
              {destinoPrincipal.rotulo}
            </span>
          )}
        </div>

        <div className={styles.links}>
          {temRevisitar && (
            <a className={styles.linkSecundario} href="/diario">
              voltar a algo que você guardou →
            </a>
          )}
          {/* Incondicional — Recursos é a única coisa que a Fase 8/PRD §7
              exige que nunca suma, nem no estado "confuso". */}
          <a className={styles.linkSecundario} href="/recursos">
            recursos de cuidado →
          </a>
          <a className={`${styles.linkSecundario} ${styles.linkPerfilMobile}`} href="/perfil">
            seu perfil →
          </a>
        </div>
      </div>
    </main>
  );
}
