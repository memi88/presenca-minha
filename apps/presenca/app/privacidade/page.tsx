import { PageHeader } from "../PageHeader";
import styles from "./page.module.css";

// Página pública, sem guard de sessão — precisa ser acessível mesmo antes
// de entrar (linkada em /bem-vindo, /chegada, /terapia). Junta o que antes
// eram duas rotas (/privacidade e /limites-de-cuidado) numa página só, com
// índice — decisão do redesign (docs/redesign/pendencias-implementacao.md),
// seguindo o mockup docs/redesign/privacidade_e_limites_de_cuidado.
// /limites-de-cuidado agora só redireciona pra cá com âncora.
export default function Privacidade() {
  return (
    <main className={styles.scene}>
      <PageHeader voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>privacidade e limites de cuidado</p>
        <h1 className={styles.headline}>Privacidade e Limites de Cuidado</h1>
        <p className={styles.atualizado}>Última atualização: julho de 2026.</p>

        <nav className={styles.indice} aria-label="Índice">
          <p className={styles.indiceTitulo}>Índice</p>
          <ul>
            <li>
              <a href="#privacidade">Política de Privacidade</a>
            </li>
            <li>
              <a href="#limites-de-cuidado">Limites de Cuidado</a>
            </li>
          </ul>
        </nav>

        <section id="privacidade">
          <h2 className={styles.secaoPrincipal}>Política de Privacidade</h2>

          <p className={styles.paragrafo}>
            O Presença é um espaço mantido por <strong>Guilherme</strong>, pessoa física, responsável pelo
            tratamento dos dados descritos aqui. Qualquer dúvida sobre privacidade, ou pedido relacionado
            aos seus dados, pode ser feito por e-mail em{" "}
            <a className={styles.link} href="mailto:guilhermemsts88@gmail.com">
              guilhermemsts88@gmail.com
            </a>
            .
          </p>

          <h3 className={styles.secao}>Que dados guardamos</h3>
          <p className={styles.paragrafo}>
            Um apelido (o nome que você escolhe usar aqui). Se você guardar seu espaço, também um e-mail e
            uma senha. Se você contar sua data, hora e local de nascimento — sempre opcional — guardamos
            isso pra calibrar sua experiência. O que você escreve no Diário, as práticas e leituras que
            guarda, e, se você conectar com um profissional, o vínculo entre vocês e o que ele escreve pra
            você. Pra ajudar a encontrar conexões dentro do seu próprio universo, calculamos uma
            representação numérica (embedding) de alguns textos — isso não substitui guardar o texto
            original, é um dado adicional.
          </p>

          <h3 className={styles.secao}>Por que guardamos</h3>
          <p className={styles.paragrafo}>
            Só pra fazer o Presença funcionar como um espaço contínuo pra você — lembrar quem você é entre
            uma visita e outra, manter o que você escreveu, e (se você quiser) sustentar o vínculo com um
            profissional. Nunca usamos esses dados pra publicidade, e nunca vendemos dado nenhum a
            terceiros.
          </p>

          <h3 className={styles.secao}>Um cuidado a mais: dado sensível</h3>
          <p className={styles.paragrafo}>
            Boa parte do que você escreve aqui é dado sensível de saúde, no sentido da lei (LGPD, art. 11)
            — por isso pedimos consentimento específico e destacado no momento em que você guarda seu
            espaço, separado do consentimento pra conectar com um profissional (que só é pedido quando
            você escolhe fazer isso, nunca antes).
          </p>

          <h3 className={styles.secao}>Com quem compartilhamos</h3>
          <p className={styles.paragrafo}>
            Os dados ficam num banco de dados operado pela Supabase (nossa infraestrutura técnica). Se
            você conectar com um profissional, ele passa a poder ler o que você escolher compartilhar no
            Diário — e só isso, nunca o resto. Fora isso, seus dados não são compartilhados com mais
            ninguém.
          </p>

          <h3 className={styles.secao}>Segurança</h3>
          <p className={styles.paragrafo}>
            Cada tabela do banco tem regras de acesso que garantem que você só lê e escreve os seus
            próprios dados (e o profissional conectado, só o que ele mesmo escreveu). Nenhuma credencial
            de acesso total ao banco entra em código que roda no seu navegador.
          </p>

          <h3 className={styles.secao}>Por quanto tempo guardamos</h3>
          <p className={styles.paragrafo}>
            Enquanto sua conta existir. Se você quiser que seus dados sejam apagados, é só pedir (veja
            abaixo) — hoje esse processo é feito manualmente por nós, o que já é suficiente pro estágio
            atual do projeto.
          </p>

          <h3 className={styles.secao}>Seus direitos</h3>
          <p className={styles.paragrafo}>
            Você pode pedir, a qualquer momento, pra ver quais dados temos sobre você, corrigir algo que
            esteja errado, ou apagar tudo. Pra isso, escreva pra{" "}
            <a
              className={styles.link}
              href="mailto:guilhermemsts88@gmail.com?subject=Meus%20dados%20no%20Presença"
            >
              guilhermemsts88@gmail.com
            </a>{" "}
            — respondemos o mais rápido possível.
          </p>

          <h3 className={styles.secao}>Encarregado (DPO)</h3>
          <p className={styles.paragrafo}>
            Guilherme é também o encarregado pelo tratamento de dados (LGPD) — o mesmo contato acima serve
            pra qualquer questão de privacidade.
          </p>

          <h3 className={styles.secao}>Mudanças nesta política</h3>
          <p className={styles.paragrafo}>
            Se este texto mudar de forma relevante, avisamos dentro do próprio app antes da mudança valer.
          </p>
        </section>

        <section id="limites-de-cuidado">
          <h2 className={styles.secaoPrincipal}>Limites de Cuidado</h2>

          <p className={styles.paragrafo}>
            O Presença é um espaço de acompanhamento contínuo — um lugar pra guardar o que fica entre um
            momento e outro da sua vida. Ele não é, e não substitui, atendimento profissional de saúde
            mental. Nada aqui faz diagnóstico, e nada aqui deveria ser lido como orientação clínica.
          </p>

          <h3 className={styles.secao}>Se você estiver em um momento difícil agora</h3>
          <p className={styles.paragrafo}>
            O Presença não é um serviço de emergência. Recursos de ajuda imediata (CVV, SAMU) ficam sempre
            disponíveis, em qualquer momento da sua jornada, com ou sem profissional conectado — veja em{" "}
            <a className={styles.link} href="/recursos">
              recursos de cuidado
            </a>
            .
          </p>

          <h3 className={styles.secao}>Se você conectar com um profissional</h3>
          <p className={styles.paragrafo}>
            A conexão é sempre uma escolha sua, feita dentro de &quot;Terapia&quot; — nunca no cadastro
            inicial. Nesse momento, você é avisado sobre o que passa a ser compartilhado (o profissional
            pode escrever no seu Diário; você pode avisar ele caso precise de apoio). Fora isso, o que
            você escreve continua seu.
          </p>
        </section>
      </div>
    </main>
  );
}
