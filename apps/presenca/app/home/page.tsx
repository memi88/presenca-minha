import { Suspense } from "react";

import { redirect } from "next/navigation";

import { and, desc, eq, gte } from "drizzle-orm";
import { biblioteca, cadernoEntradas, profiles, profissionais } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";
import { precisaCheckin } from "@/lib/checkin";
import { ordenarPorMomento, tagDoMomento } from "@/lib/menuHome";
import { PLACEHOLDER_LIVRO_VIVO, PLACEHOLDER_PRATICA, PLACEHOLDER_TERAPEUTA, imagemUrl } from "@/lib/placeholders";
import { atualizarStreak } from "@/lib/streak";

import { BottomNav } from "../BottomNav";
import { CirculoRespirando } from "../CirculoRespirando";
import { IconeLivroVivo } from "../IconeLivroVivo";
import { IconePraticas } from "../IconePraticas";
import { MonogramaP } from "../MonogramaP";
import { rotaDePratica } from "../praticas/PainelPratica";
import { adiarNascimento, registrarPresenca } from "./actions";
import { FechamentoTrigger } from "./FechamentoTrigger";
import { LenteDoDiaCard } from "./LenteDoDiaCard";
import { MoodTrigger } from "./MoodTrigger";
import styles from "./page.module.css";

// Corta um texto longo (reflexão do terapeuta, conteúdo de prática) num
// trecho de preview — sempre em fronteira de palavra, nunca no meio.
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

// Saudação por hora do dia — só o "bom dia/boa tarde/boa noite" de topo.
function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 5) return "Boa noite";
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

// Início do dia civil em America/Sao_Paulo, como instante ISO — Brasil não
// usa horário de verão desde 2019, então o offset fixo "-03:00" já resolve
// certo o instante (sem precisar de Intl pra achar o offset, só pra achar
// a data). Mesma ideia de lib/present.ts:dataCivilHoje() (duplicado aqui
// por ser um helper pequeno, mesmo padrão de trecho()/dataDeHoje() acima).
// Usado pela regra do convite de fechamento (mostrarFechamento abaixo).
function inicioDoDiaSaoPauloISO(): string {
  const dataSaoPaulo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
  return `${dataSaoPaulo}T00:00:00-03:00`;
}

// Hora atual em America/Sao_Paulo (0-23) — regra do convite de fechamento:
// só aparece depois das 18h ou na segunda visita do dia, o que vier
// primeiro (ver mostrarFechamento abaixo).
function horaAtualSaoPaulo(): number {
  return Number(
    new Intl.DateTimeFormat("en-US", { timeZone: "America/Sao_Paulo", hour: "numeric", hourCycle: "h23" }).format(
      new Date(),
    ),
  );
}

const DIAS_PARA_CONVITE_NASCIMENTO = 3;

type UltimaEntradaHome = {
  autorTipo: string;
  tipo: string;
  conteudo: string;
  bibliotecaRefId: string | null;
  bibliotecaRef: { id: string; titulo: string | null; tipo: string } | null;
};

// "Do seu terapeuta" varia por tipo — o terapeuta escolhe isso na hora de
// escrever (EntradaForm.tsx no Cuida): pergunta manda pra tela de
// resposta focada; prática/página indicada apontam pro item de verdade
// (bibliotecaRefId, estruturado, não mais texto livre) quando a
// referência existe e ainda está publicada; reflexão/símbolo (ou uma
// indicação sem referência válida) são só a citação, sem CTA.
function montarCardTerapeuta(
  entrada: UltimaEntradaHome,
): { texto: string; ctaLabel: string | null; ctaHref: string | null } {
  const ref = entrada.bibliotecaRef;
  if (entrada.tipo === "pergunta") {
    return { texto: entrada.conteudo, ctaLabel: "Responder →", ctaHref: "/diario/pergunta" };
  }
  if (entrada.tipo === "pratica_indicada" && ref) {
    const titulo = ref.titulo ?? "essa prática";
    return {
      texto: entrada.conteudo || `indicou a prática "${titulo}"`,
      ctaLabel: `Ver prática: ${titulo} →`,
      ctaHref: `/praticas/${ref.id}`,
    };
  }
  if (entrada.tipo === "pagina_indicada" && ref) {
    const titulo = ref.titulo ?? "essa página";
    return {
      texto: entrada.conteudo || `indicou a página "${titulo}"`,
      ctaLabel: `Ler no Livro Vivo: ${titulo} →`,
      ctaHref: `/livro-vivo/${ref.id}`,
    };
  }
  return { texto: entrada.conteudo, ctaLabel: null, ctaHref: null };
}

export default async function Home() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: {
      id: true,
      nome: true,
      presencaHoje: true,
      presencaHojeEm: true,
      ultimaVisitaEm: true,
      dataNascimento: true,
      streakDiasConsecutivos: true,
      streakAtualizadoEm: true,
      lembreteNascimentoEm: true,
      profissionalId: true,
    },
  });

  if (!profile?.nome) redirect("/chegada");

  // O humor só continua "fresco" por 12h (lib/checkin.ts) — depois disso
  // ainda aparece como o mood atual no gatilho da Home, só para de reduzir
  // a tela (ver `reduzido` abaixo).
  const moodFresco = !precisaCheckin(profile.presencaHojeEm ? profile.presencaHojeEm.toISOString() : null);

  // "Confuso" só reduz a tela (esconde Terapia) enquanto o humor está
  // fresco — não faz sentido esconder por causa de uma resposta de dias atrás.
  const reduzido = moodFresco && profile.presencaHoje === "confuso";

  // Sinal interno pra decidir quando convidar a personalizar a experiência
  // (nascimento, PRD §5) — nunca exibido como contador (lib/streak.ts).
  const { streak, atualizadoEm: streakAtualizadoEm } = atualizarStreak(
    profile.streakDiasConsecutivos ?? 0,
    profile.streakAtualizadoEm,
    new Date(),
  );

  const inicioHojeSaoPaulo = new Date(inicioDoDiaSaoPauloISO());

  const [ultimaEntrada, entradasRevisitar, entradaPropria, fechamentoHoje, praticas, paginasLivroVivo, profissionalConectado] =
    await Promise.all([
      db.query.cadernoEntradas.findFirst({
        where: eq(cadernoEntradas.pacienteId, profile.id),
        orderBy: desc(cadernoEntradas.createdAt),
        columns: { autorTipo: true, tipo: true, conteudo: true, bibliotecaRefId: true },
        with: { bibliotecaRef: { columns: { id: true, titulo: true, tipo: true } } },
      }),
      reduzido
        ? Promise.resolve(undefined)
        : db.query.cadernoEntradas.findFirst({
            where: and(eq(cadernoEntradas.pacienteId, profile.id), eq(cadernoEntradas.revisitar, true)),
            columns: { id: true },
          }),
      db.query.cadernoEntradas.findFirst({
        where: and(eq(cadernoEntradas.pacienteId, profile.id), eq(cadernoEntradas.autorTipo, "usuario")),
        columns: { id: true },
      }),
      // Regra do convite de fechamento (mostrarFechamento abaixo): já
      // fechou hoje esconde o convite de vez, não só nesta visita.
      db.query.cadernoEntradas.findFirst({
        where: and(
          eq(cadernoEntradas.pacienteId, profile.id),
          eq(cadernoEntradas.tipo, "fechamento_dia"),
          gte(cadernoEntradas.createdAt, inicioHojeSaoPaulo),
        ),
        columns: { id: true },
      }),
      // "Prática Sugerida" — mesmo sinal de curadoria do Livro Vivo (tag do
      // humor de hoje), não uma prática indicada explicitamente por um
      // profissional: o formulário do Cuida (EntradaForm.tsx) grava
      // "prática indicada" como texto livre no caderno, sem apontar pra um
      // item específico da biblioteca — não existe esse vínculo estruturado
      // hoje. limit(20): só o primeiro item depois de ordenado é usado, não
      // precisa do catálogo inteiro.
      db.query.biblioteca.findMany({
        where: and(eq(biblioteca.tipo, "pratica"), eq(biblioteca.publicado, true)),
        orderBy: desc(biblioteca.createdAt),
        limit: 20,
        columns: { id: true, titulo: true, slug: true, conteudo: true, tagsMomentoVida: true, capaChave: true },
      }),
      db.query.biblioteca.findMany({
        where: and(eq(biblioteca.tipo, "pagina_livro_vivo"), eq(biblioteca.publicado, true)),
        orderBy: desc(biblioteca.createdAt),
        limit: 6,
        columns: { id: true, titulo: true, conteudo: true, tagsMomentoVida: true, capaChave: true },
      }),
      profile.profissionalId
        ? db.query.profissionais.findFirst({
            where: eq(profissionais.id, profile.profissionalId),
            columns: { nome: true, fotoChave: true },
          })
        : Promise.resolve(undefined),
    ]);
  const temRevisitar = !!entradasRevisitar;

  // Convite de fechamento (pedido explícito, 04/09/2026): só aparece na
  // segunda visita do dia em diante, ou depois das 18h (o que vier
  // primeiro) — `profile.ultimaVisitaEm` ainda é a visita ANTERIOR
  // aqui, porque o UPDATE que grava a visita atual só acontece mais
  // embaixo. Uma vez fechado o dia, some de vez (não só nesta visita).
  const segundaVisitaOuMais = !!profile.ultimaVisitaEm && profile.ultimaVisitaEm >= inicioHojeSaoPaulo;
  const mostrarFechamento = !fechamentoHoje && (segundaVisitaOuMais || horaAtualSaoPaulo() >= 18);

  // Mostra a última entrada só enquanto ela for a coisa mais recente no
  // caderno (autorTipo profissional). Assim que a pessoa escreve algo, o
  // card some sozinho — sem precisar de uma flag de "lida". Reduzido
  // (humor "confuso") também esconde, mesma lógica que já reduz o resto
  // da tela.
  const cardTerapeuta =
    !reduzido && profissionalConectado?.nome && ultimaEntrada?.autorTipo === "profissional"
      ? montarCardTerapeuta(ultimaEntrada)
      : null;

  const tag = tagDoMomento(profile.presencaHoje);
  const praticaDestaque = ordenarPorMomento(praticas, tag)[0] ?? null;
  const livroVivoDestaques = ordenarPorMomento(paginasLivroVivo, tag);

  // Gatilho de nascimento: streak de 3 dias OU já escreveu ao menos uma
  // entrada própria no Diário, o que vier primeiro — sinal de que a pessoa
  // já está investindo em refletir, então o convite de personalizar cai
  // natural, em vez de mais fricção logo no cadastro.
  const mostrarConviteNascimento =
    (streak >= DIAS_PARA_CONVITE_NASCIMENTO || !!entradaPropria) &&
    !profile.dataNascimento &&
    (!profile.lembreteNascimentoEm || profile.lembreteNascimentoEm <= new Date());

  // Marca a visita (e avança o streak) a cada carregamento da Home — mesmo
  // padrão incondicional das outras telas (ver `ultimo_destino` em
  // conversa/livro-vivo/praticas/diario). Antes disso dependia do check-in
  // já ter sido respondido; o check-in agora é um modal sempre disponível
  // (MoodTrigger), não bloqueia mais o carregamento da página.
  await db
    .update(profiles)
    .set({
      ultimaVisitaEm: new Date(),
      streakDiasConsecutivos: streak,
      streakAtualizadoEm,
    })
    .where(eq(profiles.id, profile.id));

  return (
    <main className={styles.scene}>
      <div className={styles.atmosfera} aria-hidden="true" />
      <div className={styles.topBarFundo}>
        <div className={styles.topBar}>
          <a className={styles.monogramaLink} href="/home" aria-label="Página inicial">
            <MonogramaP className={styles.monograma} />
          </a>
          <div className={styles.topBarDireita}>
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
        <a className={styles.wordmarkCentro} href="/home">
          <CirculoRespirando className={styles.wordmarkDot} />
          Presença
        </a>
      </div>

      {mostrarConviteNascimento && (
        <div className={styles.convite}>
          <p>
            Quer personalizar sua presença? <a href="/perfil/nascimento">Contar sua chegada ao mundo</a>
          </p>
          <form action={adiarNascimento}>
            <button type="submit" className={styles.conviteDispensar}>
              Agora não
            </button>
          </form>
        </div>
      )}

      <div className={styles.bottom}>
        <div className={styles.saudacaoBloco}>
          <p className={styles.saudacaoGrande}>
            {saudacao()}, {profile.nome}.
          </p>
          <MoodTrigger moodAtual={profile.presencaHoje} registrarPresenca={registrarPresenca} />
        </div>

        {mostrarFechamento && <FechamentoTrigger />}

        <Suspense fallback={null}>
          <LenteDoDiaCard presencaHoje={profile.presencaHoje} />
        </Suspense>

        {cardTerapeuta?.texto && profissionalConectado && (
          <section className={styles.terapeuta} aria-label="Do seu terapeuta">
            <div
              className={styles.terapeutaAvatar}
              style={{ backgroundImage: `url(${imagemUrl(profissionalConectado.fotoChave, PLACEHOLDER_TERAPEUTA)})` }}
              aria-hidden="true"
            />
            <div>
              <p className={styles.lenteRotulo}>{profissionalConectado.nome}</p>
              <p className={styles.terapeutaTexto}>“{trecho(cardTerapeuta.texto, 220)}”</p>
              {cardTerapeuta.ctaLabel && cardTerapeuta.ctaHref && (
                <a className={styles.terapeutaCta} href={cardTerapeuta.ctaHref}>
                  {cardTerapeuta.ctaLabel}
                </a>
              )}
            </div>
          </section>
        )}

        {praticaDestaque && (
          <section aria-label="Prática sugerida">
            <div className={styles.eyebrow}>
              <IconePraticas className={styles.eyebrowIcone} />
              <span>Prática sugerida</span>
            </div>
            <a
              className={styles.praticaSugerida}
              href={rotaDePratica(praticaDestaque)}
              style={{ backgroundImage: `url(${imagemUrl(praticaDestaque.capaChave, PLACEHOLDER_PRATICA)})` }}
              aria-label={`Prática sugerida: ${praticaDestaque.titulo}`}
            >
              <div className={styles.praticaSugeridaOverlay}>
                <h3 className={styles.praticaSugeridaTitulo}>{praticaDestaque.titulo}</h3>
                <p className={styles.praticaSugeridaTexto}>{trecho(praticaDestaque.conteudo, 110)}</p>
                <span className={styles.praticaSugeridaCta}>
                  Iniciar prática
                  <svg
                    className={styles.praticaSugeridaCtaIcone}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </a>
          </section>
        )}

        {livroVivoDestaques.length > 0 && (
          <section className={styles.livroVivo} aria-label="Livro Vivo">
            <div className={styles.livroVivoTopo}>
              <div className={styles.eyebrow}>
                <IconeLivroVivo className={styles.eyebrowIcone} />
                <span>Livro Vivo</span>
              </div>
              <a className={styles.livroVivoVerTudo} href="/livro-vivo">
                Ver acervo
              </a>
            </div>
            <div className={styles.livroVivoCarrossel}>
              {livroVivoDestaques.map((pagina) => (
                <a
                  key={pagina.id}
                  className={styles.livroVivoCard}
                  href={`/livro-vivo/${pagina.id}`}
                  style={{ backgroundImage: `url(${imagemUrl(pagina.capaChave, PLACEHOLDER_LIVRO_VIVO)})` }}
                >
                  <p className={styles.livroVivoCardTitulo}>{pagina.titulo}</p>
                </a>
              ))}
            </div>
          </section>
        )}

        {temRevisitar && (
          <div className={styles.links}>
            <a className={styles.linkSecundario} href="/diario">
              Voltar a algo que você guardou →
            </a>
          </div>
        )}
      </div>

      <BottomNav atual="home" />
    </main>
  );
}
