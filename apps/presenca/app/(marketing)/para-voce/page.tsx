import { Funcionalidades } from "../Funcionalidades";
import styles from "../PaginaAudiencia.module.css";
import precos from "../Precos.module.css";

export default function ParaVoce() {
  return (
    <>
      <section className={styles.hero}>
        <img className={styles.heroImagem} src="/images/site/para-voce.png" alt="" />
        <div className={styles.heroGradiente} />
        <div className={styles.heroConteudo}>
          <h1 className={styles.heroHeadline}>Um espaço para continuar a conversa consigo mesmo.</h1>
          <p className={styles.heroTexto}>
            Nem sempre conseguimos organizar tudo o que sentimos. O Presença oferece um lugar
            tranquilo para registrar pensamentos, emoções, experiências e acompanhar seu próprio
            caminho.
          </p>
        </div>
      </section>

      <section className={styles.blocos}>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Reflexões</div>
          <div className={styles.blocoTexto}>Um espaço para escrever e registrar aquilo que está vivo.</div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Conversas</div>
          <div className={styles.blocoTexto}>Um ambiente que acolhe perguntas e incentiva a escuta de si mesmo.</div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Registro da caminhada</div>
          <div className={styles.blocoTexto}>
            Com o tempo, é possível revisitar momentos, perceber mudanças e reconhecer o próprio
            processo.
          </div>
        </div>
        <div className={styles.bloco}>
          <div className={styles.blocoTitulo}>Continuidade</div>
          <div className={styles.blocoTexto}>Porque o desenvolvimento não acontece apenas durante uma sessão.</div>
        </div>
      </section>

      {/* Novo: camada de funcionalidades, cada uma com página própria */}
      <Funcionalidades />

      {/* Novo: planos, publicados (decisão de merge — ver
          presenca-merge-site-decisoes.md, seção 4.2). Nenhum recurso fica
          atrás de plano nenhum — a única diferença é a forma de pagamento. */}
      <section className={precos.secao} id="planos">
        <p className={precos.eyebrow}>Sustentar o espaço</p>
        <h2 className={precos.titulo}>Planos</h2>
        <p className={precos.trialDestaque}>
          Os primeiros 7 dias já são de acesso completo — sem contador na tela, sem cobrança.
        </p>
        <p className={precos.intro}>
          Todo plano dá acesso completo — Conversa, Livro Vivo, Práticas, Diário. Depois do período
          inicial, a única diferença entre as opções abaixo é a forma de sustentar o espaço.
        </p>
        <div className={precos.grid}>
          <div className={precos.plano}>
            <div className={precos.planoNome}>Mensal</div>
            <div className={precos.planoValor}>R$ 34</div>
            <div className={precos.planoSub}>Por mês</div>
            <ul className={precos.planoLista}>
              <li>Acesso completo ao Presença</li>
              <li>Cancele quando quiser</li>
            </ul>
          </div>
          <div className={precos.planoDestaque}>
            <div className={precos.planoNome}>Trimestral</div>
            <div className={precos.planoValor}>R$ 89</div>
            <div className={precos.planoSub}>≈ R$ 29,67/mês · cobrança única</div>
            <ul className={precos.planoLista}>
              <li>~13% mais econômico</li>
              <li>Cobrança a cada 3 meses</li>
            </ul>
          </div>
          <div className={precos.plano}>
            <div className={precos.planoNome}>Anual</div>
            <div className={precos.planoValor}>R$ 229</div>
            <div className={precos.planoSub}>≈ R$ 19,08/mês · cobrança única</div>
            <ul className={precos.planoLista}>
              <li>~44% mais econômico</li>
              <li>Uma cobrança por ano</li>
            </ul>
          </div>
        </div>

        {/* Contribuição livre — mesmo peso visual dos 3 planos acima, nunca
            um 4º card menor. Ao lado, não abaixo escondida. */}
        <div className={precos.contribuicaoPainel}>
          <div className={precos.contribuicaoNome}>Ou contribua com o que fizer sentido</div>
          <div className={precos.contribuicaoValor}>R$ 19/mês</div>
          <p className={precos.contribuicaoTexto}>
            Valor sugerido, com campo aberto pra qualquer quantia. Mesmo acesso completo — a única
            diferença é a forma de pagamento.
          </p>
        </div>

        <p className={precos.nota}>
          Nenhum recurso extra fica trancado atrás de um plano mais caro — a única diferença é a forma
          de pagamento.
        </p>

        <div className={precos.faqBloco}>
          <p className={precos.faqTitulo}>Perguntas frequentes</p>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Preciso pagar para experimentar?</p>
            <p className={precos.faqResposta}>
              Não. Os primeiros 7 dias são de acesso completo, sem qualquer cobrança.
            </p>
          </div>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Algum recurso fica bloqueado num plano mais barato?</p>
            <p className={precos.faqResposta}>
              Não. Todo plano dá acesso completo a Conversa, Livro Vivo, Práticas e Diário — a única
              diferença é a forma de pagamento.
            </p>
          </div>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Posso cancelar quando quiser?</p>
            <p className={precos.faqResposta}>Sim, a qualquer momento — sem multa.</p>
          </div>
          <div className={precos.faqItem}>
            <p className={precos.faqPergunta}>Como funciona a contribuição livre?</p>
            <p className={precos.faqResposta}>
              Você escolhe o valor que fizer sentido, a partir de R$ 19/mês — com o mesmo acesso
              completo dos outros planos.
            </p>
          </div>
        </div>
      </section>

      <section className={styles.ctaSecao}>
        <a className={styles.cta} href="/bem-vindo">
          Conhecer o Presença
        </a>
      </section>
    </>
  );
}
