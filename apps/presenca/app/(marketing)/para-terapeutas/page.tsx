import styles from "../PaginaAudiencia.module.css";
import precos from "../Precos.module.css";

const MENSAGEM_WHATSAPP = encodeURIComponent(
  "Olá! Tenho interesse em conhecer o Presença como terapeuta parceiro.",
);

export default function ParaTerapeutas() {
  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImagem} src="/images/site/para-terapeutas.png" alt="" />
        <div className={styles.heroGradiente} />
        <div className={styles.heroConteudo}>
          <h1 className={styles.heroHeadline}>Um espaço que continua cuidando entre as sessões.</h1>
          <p className={styles.heroTexto}>
            O Presença foi pensado para apoiar o trabalho terapêutico, oferecendo continuidade ao
            processo vivido no consultório.
          </p>
        </div>
      </section>

      <section className={styles.blocos}>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Continuidade</div>
          <div className={styles.blocoTexto}>
            O paciente pode registrar experiências importantes enquanto elas acontecem.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Organização</div>
          <div className={styles.blocoTexto}>
            As informações permanecem organizadas em uma linha do tempo, facilitando o acompanhamento.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Presença</div>
          <div className={styles.blocoTexto}>
            O processo terapêutico deixa de existir apenas durante a sessão e passa a acompanhar o
            paciente ao longo da semana.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Apoio</div>
          <div className={styles.blocoTexto}>
            O terapeuta continua sendo o centro do cuidado. O Presença existe para ampliar esse
            processo, nunca para substituí-lo.
          </div>
        </div>
      </section>

      {/* Novo: planos do Cuida, publicados. Cobrança por paciente ativo
          vinculado, nunca por volume de uso (ver business model). O
          cadastro do terapeuta em si continua manual — self-signup é
          Fase 11, ainda não implementada — por isso o CTA abaixo permanece
          o WhatsApp, não um botão de assinatura direta. */}
      <section className={precos.secao}>
        <p className={precos.eyebrow}>Sustentar o espaço</p>
        <h2 className={precos.titulo}>Planos — Cuida</h2>
        <p className={precos.intro}>
          Você paga por paciente ativo vinculado — nunca por quanto ele usa o app. "Ativo" é ao menos
          uma interação no período de cobrança.
        </p>
        <div className={precos.grid}>
          <div className={precos.plano}>
            <div className={precos.planoNome}>Início</div>
            <div className={precos.planoValor}>R$ 89</div>
            <div className={precos.planoSub}>Por mês · até 5 pacientes</div>
            <ul className={precos.planoLista}>
              <li>Diário e biblioteca colaborativa</li>
            </ul>
          </div>
          <div className={precos.planoDestaque}>
            <div className={precos.planoNome}>Consultório</div>
            <div className={precos.planoValor}>R$ 219</div>
            <div className={precos.planoSub}>Por mês · 6 a 15 pacientes</div>
            <ul className={precos.planoLista}>
              <li>Pré-cadastro com link pessoal</li>
            </ul>
          </div>
          <div className={precos.plano}>
            <div className={precos.planoNome}>Consultório+</div>
            <div className={precos.planoValor}>R$ 429</div>
            <div className={precos.planoSub}>Por mês · 16 a 30 pacientes</div>
            <ul className={precos.planoLista}>
              <li>Prioridade em suporte</li>
            </ul>
          </div>
        </div>
        <p className={precos.nota}>Mais de 30 pacientes? Cada adicional soma +R$ 20/mês, na mesma proporção no plano anual.</p>

        <div className={precos.faqBloco}>
          <p className={precos.faqTitulo}>Perguntas frequentes</p>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Como funciona a cobrança por paciente ativo?</p>
            <p className={precos.faqResposta}>
              Você paga só pelos pacientes vinculados que tiveram ao menos uma interação no período —
              nunca por volume de uso.
            </p>
          </div>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Como faço meu cadastro como terapeuta?</p>
            <p className={precos.faqResposta}>
              Hoje é feito com a gente, pelo WhatsApp — um a um, pra garantir que tudo comece do jeito
              certo.
            </p>
          </div>
        </div>

        <div className={precos.whatsappBloco}>
          <a
            className={precos.whatsappCta}
            href={`https://wa.me/5551991393827?text=${MENSAGEM_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Falar com a gente no WhatsApp →
          </a>
          <p className={precos.whatsappNota}>
            O cadastro de terapeutas ainda é feito com a gente diretamente, um a um — enquanto isso,
            essa conversa garante que tudo comece do jeito certo.
          </p>
        </div>
      </section>
    </>
  );
}
