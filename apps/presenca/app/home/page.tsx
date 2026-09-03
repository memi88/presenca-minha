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
  ordenarPorMomento,
  tagDoMomento,
} from "@/lib/menuHome";
import { montarPresenceDailyContext } from "@/lib/presenceDailyContext";
import { PLACEHOLDER_LIVRO_VIVO, PLACEHOLDER_PRATICA, PLACEHOLDER_TERAPEUTA } from "@/lib/placeholders";
import { atualizarStreak } from "@/lib/streak";

import { BottomNav } from "../BottomNav";
import { CirculoRespirando } from "../CirculoRespirando";
import { MonogramaP } from "../MonogramaP";
import { rotaDePratica } from "../praticas/PainelPratica";
import { adiarConversao, adiarNascimento, registrarPresenca } from "./actions";
import { InstalarPWABanner } from "./InstalarPWABanner";
import styles from "./page.module.css";

// Corta um texto longo (reflexão do terapeuta, conteúdo de prática) num
// trecho de preview — sempre em fronteira de palavra, nunca no meio.
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

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

// Antes vivia em app/hoje/page.tsx — absorvido pelo bloco de saudação da
// Home no redesign (docs/redesign/presenca-redesign-sistema-visual-status.md
// §5). Mesmas 5 opções de sempre.
const OPCOES_PRESENCA = [
  { valor: "confuso", rotulo: "Confuso" },
  { valor: "em_paz", rotulo: "Em paz" },
  { valor: "cansado", rotulo: "Cansado" },
  { valor: "curioso", rotulo: "Curioso" },
  { valor: "nao_sei", rotulo: "Não sei responder" },
] as const;

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
      "nome, lembrete_conversao_em, presenca_hoje, presenca_hoje_em, ultima_visita_em, ultimo_destino, data_nascimento, streak_dias_consecutivos, streak_atualizado_em, lembrete_nascimento_em, profissional_id",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.nome) redirect("/chegada");
  // Gatilho do check-in: 2+ dias desde a última VISITA (não desde a última
  // resposta de humor) — ver lib/checkin.ts. Antes redirecionava pra
  // /hoje; agora o check-in acontece dentro do próprio bloco de saudação
  // (ver JSX abaixo), sem sair da página.
  const precisaCheckinAgora = precisaVisitaCheckin(profile.ultima_visita_em);

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

  const [
    { data: ultimaEntrada },
    { data: entradasRevisitar },
    { data: entradaPropria },
    presenceDailyContext,
    { data: praticas },
    { data: paginasLivroVivo },
    { data: profissionalConectado },
  ] = await Promise.all([
    supabase
      .from("caderno_entradas")
      .select("autor_tipo, tipo, conteudo")
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
    supabase
      .from("caderno_entradas")
      .select("id")
      .eq("paciente_id", user.id)
      .eq("autor_tipo", "usuario")
      .limit(1)
      .maybeSingle(),
    montarPresenceDailyContext(profile.presenca_hoje),
    // "Prática Sugerida" — mesmo sinal de curadoria do Livro Vivo (tag do
    // humor de hoje), não uma prática indicada explicitamente por um
    // profissional: o formulário do Cuida (EntradaForm.tsx) grava
    // "prática indicada" como texto livre no caderno, sem apontar pra um
    // item específico da biblioteca — não existe esse vínculo estruturado
    // hoje. limit(20): só o primeiro item depois de ordenado é usado, não
    // precisa do catálogo inteiro.
    supabase
      .from("biblioteca")
      .select("id, titulo, slug, conteudo, tags_momento_vida")
      .eq("tipo", "pratica")
      .eq("publicado", true)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("biblioteca")
      .select("id, titulo, conteudo, tags_momento_vida")
      .eq("tipo", "pagina_livro_vivo")
      .eq("publicado", true)
      .order("created_at", { ascending: false })
      .limit(6),
    profile.profissional_id
      ? supabase.from("profissionais").select("nome").eq("id", profile.profissional_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const dailyPresent = presenceDailyContext.dailyPresent;

  const perguntaEmAberto = ultimaEntrada?.autor_tipo === "profissional" && ultimaEntrada?.tipo === "pergunta";
  const temRevisitar = !!entradasRevisitar;

  // "Do seu terapeuta" — mostra a última entrada só enquanto ela for a
  // coisa mais recente no caderno (autor_tipo profissional). Assim que a
  // pessoa escreve algo, o card some sozinho — sem precisar de uma flag de
  // "lida". Reduzido (humor "confuso") também esconde, mesma lógica que já
  // reduz o resto da tela.
  const citacaoTerapeuta =
    !reduzido && profissionalConectado?.nome && ultimaEntrada?.autor_tipo === "profissional" && ultimaEntrada.conteudo
      ? ultimaEntrada.conteudo
      : null;

  const tag = tagDoMomento(profile.presenca_hoje);
  const praticaDestaque = ordenarPorMomento(praticas ?? [], tag)[0] ?? null;
  const livroVivoDestaques = ordenarPorMomento(paginasLivroVivo ?? [], tag);

  // Gatilho de nascimento: streak de 3 dias OU já escreveu ao menos uma
  // entrada própria no Diário, o que vier primeiro — sinal de que a pessoa
  // já está investindo em refletir, então o convite de personalizar cai
  // natural, em vez de mais fricção logo no cadastro.
  const mostrarConviteNascimento =
    (streak >= DIAS_PARA_CONVITE_NASCIMENTO || !!entradaPropria) &&
    !profile.data_nascimento &&
    (!profile.lembrete_nascimento_em || new Date(profile.lembrete_nascimento_em) <= new Date());

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

  // Só registra a visita (e avança o streak) quando o check-in não está
  // pendente — do contrário, a pessoa nem respondeu ainda e essa mesma
  // atualização (via registrarPresenca) faria o prompt sumir sozinho no
  // próximo refresh, pulando a pergunta. Enquanto pendente, quem marca
  // ultima_visita_em é a própria resposta.
  if (!precisaCheckinAgora) {
    await supabase
      .from("profiles")
      .update({
        ultima_visita_em: new Date().toISOString(),
        streak_dias_consecutivos: streak,
        streak_atualizado_em: streakAtualizadoEm,
      })
      .eq("id", user.id);
  }

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
            <a className={styles.navItem} href="/praticas">
              Práticas
            </a>
          </nav>
          <a className={styles.menuAvatar} href="/perfil" aria-label="Perfil">
            {profile.nome.charAt(0).toUpperCase()}
          </a>
        </div>
      </div>

      {!precisaCheckinAgora && mostrarConviteConversao && (
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

      {!precisaCheckinAgora && !mostrarConviteConversao && mostrarConviteNascimento && (
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

      {!precisaCheckinAgora && (
        <InstalarPWABanner oculto={mostrarConviteConversao || mostrarConviteNascimento} />
      )}

      <div className={styles.bottom}>
        <p className={styles.greetingDesktop}>
          {saudacao()}, {profile.nome}.
        </p>

        {precisaCheckinAgora ? (
          <section aria-label="Como está sua presença hoje">
            <p className={styles.headline}>Como está sua presença hoje?</p>
            <div className={styles.checkinOpcoes}>
              {OPCOES_PRESENCA.map((opcao) => (
                <form key={opcao.valor} action={registrarPresenca.bind(null, opcao.valor)}>
                  <button className={styles.pilula} type="submit">
                    {opcao.rotulo}
                  </button>
                </form>
              ))}
            </div>
          </section>
        ) : (
          <>
            <p className={styles.headline}>{headline}</p>

            {dailyPresent && (
              <section className={styles.lente} aria-label="Uma lente para hoje">
                <p className={styles.lenteRotulo}>Uma lente para hoje</p>
                <p className={styles.lenteTexto}>{dailyPresent.reflection}</p>
                <p className={styles.lenteRotulo}>Uma pergunta</p>
                <p className={styles.lenteTexto}>{dailyPresent.question}</p>
                <div className={styles.lenteAcoes}>
                  <a className={styles.lenteConversar} href="/conversa">
                    Conversar sobre isso
                  </a>
                  <details className={styles.lenteDetalhes}>
                    <summary>Entender de onde vem</summary>
                    <p>
                      <strong>{dailyPresent.derivationSummary.tomHoje}</strong> —{" "}
                      {dailyPresent.derivationSummary.textoCuradoTom}
                    </p>
                    <p>
                      <strong>{dailyPresent.derivationSummary.seloHoje}</strong> —{" "}
                      {dailyPresent.derivationSummary.textoCuradoSelo}
                    </p>
                  </details>
                </div>
              </section>
            )}

            {citacaoTerapeuta && profissionalConectado && (
              <section className={styles.terapeuta} aria-label="Do seu terapeuta">
                <div
                  className={styles.terapeutaAvatar}
                  style={{ backgroundImage: `url(${PLACEHOLDER_TERAPEUTA})` }}
                  aria-hidden="true"
                />
                <div>
                  <p className={styles.lenteRotulo}>{profissionalConectado.nome}</p>
                  <p className={styles.terapeutaTexto}>“{trecho(citacaoTerapeuta, 220)}”</p>
                </div>
              </section>
            )}

            {/* Convite pro fechamento do dia (P6) — mesmo contexto visual da
                lente, mas decoplado dela: aparece independente de dailyPresent
                existir (docs/integracao-presente-presenca-decisoes.md). Nunca
                um gate — só um convite discreto, sem obrigatoriedade. */}
            <a className={styles.fechamentoConvite} href="/fechamento">
              Como foi seu dia? →
            </a>

            {praticaDestaque && (
              <a
                className={styles.praticaSugerida}
                href={rotaDePratica(praticaDestaque)}
                style={{ backgroundImage: `url(${PLACEHOLDER_PRATICA})` }}
                aria-label={`Prática sugerida: ${praticaDestaque.titulo}`}
              >
                <div className={styles.praticaSugeridaOverlay}>
                  <p className={styles.lenteRotuloClaro}>Prática sugerida</p>
                  <h3 className={styles.praticaSugeridaTitulo}>{praticaDestaque.titulo}</h3>
                  <p className={styles.praticaSugeridaTexto}>{trecho(praticaDestaque.conteudo, 110)}</p>
                  <span className={styles.praticaSugeridaCta}>Iniciar prática</span>
                </div>
              </a>
            )}

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
                // "escrever algo" leva direto pra tela focada de resposta
                // quando é por causa de uma pergunta em aberto (mesmo
                // sinal que decide o headline acima) — em vez do Diário
                // completo, que é o destino padrão dessa pílula.
                const rota =
                  destino.id === "escrever" && perguntaEmAberto ? "/diario/pergunta" : destino.rota;
                return (
                  <a key={destino.id} className={classe} href={rota}>
                    {destino.rotulo}
                  </a>
                );
              })}
            </div>

            {livroVivoDestaques.length > 0 && (
              <section className={styles.livroVivo} aria-label="Livro Vivo">
                <div className={styles.livroVivoTopo}>
                  <p className={styles.lenteRotulo}>Livro Vivo</p>
                  <a className={styles.livroVivoVerTudo} href="/livro-vivo">
                    ver acervo
                  </a>
                </div>
                <div className={styles.livroVivoCarrossel}>
                  {livroVivoDestaques.map((pagina) => (
                    <a
                      key={pagina.id}
                      className={styles.livroVivoCard}
                      href={`/livro-vivo/${pagina.id}`}
                      style={{ backgroundImage: `url(${PLACEHOLDER_LIVRO_VIVO})` }}
                    >
                      <p className={styles.livroVivoCardTitulo}>{pagina.titulo}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

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
            </div>
          </>
        )}
      </div>

      <BottomNav atual="home" />
    </main>
  );
}
