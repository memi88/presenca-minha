import { PageHeader } from "../PageHeader";
import styles from "./page.module.css";

// Página pública, sem guard de sessão — precisa ser acessível mesmo antes
// de entrar (linkada em /bem-vindo, /chegada, /terapia).
export default function Privacidade() {
  return (
    <main className={styles.scene}>
      <PageHeader voltar={{ href: "/home", label: "← voltar" }} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>privacidade</p>
        <h1 className={styles.headline}>Política de Privacidade</h1>
        <p className={styles.atualizado}>Última atualização: julho de 2026.</p>

        <p className={styles.paragrafo}>
          O Presença é um espaço mantido por <strong>Guilherme</strong>, pessoa física, responsável pelo
          tratamento dos dados descritos aqui. Qualquer dúvida sobre privacidade, ou pedido relacionado aos
          seus dados, pode ser feito por e-mail em{" "}
          <a className={styles.link} href="mailto:guilhermemsts88@gmail.com">
            guilhermemsts88@gmail.com
          </a>
          .
        </p>

        <h2 className={styles.secao}>Que dados guardamos</h2>
        <p className={styles.paragrafo}>
          Um apelido (o nome que você escolhe usar aqui). Se você guardar seu espaço, também um e-mail e uma
          senha. Se você contar sua data, hora e local de nascimento — sempre opcional — guardamos isso pra
          calibrar sua experiência. O que você escreve no Diário, as práticas e leituras que guarda, e, se
          você conectar com um profissional, o vínculo entre vocês e o que ele escreve pra você. Pra ajudar a
          encontrar conexões dentro do seu próprio universo, calculamos uma representação numérica (embedding)
          de alguns textos — isso não substitui guardar o texto original, é um dado adicional.
        </p>

        <h2 className={styles.secao}>Por que guardamos</h2>
        <p className={styles.paragrafo}>
          Só pra fazer o Presença funcionar como um espaço contínuo pra você — lembrar quem você é entre uma
          visita e outra, manter o que você escreveu, e (se você quiser) sustentar o vínculo com um
          profissional. Nunca usamos esses dados pra publicidade, e nunca vendemos dado nenhum a terceiros.
        </p>

        <h2 className={styles.secao}>Um cuidado a mais: dado sensível</h2>
        <p className={styles.paragrafo}>
          Boa parte do que você escreve aqui é dado sensível de saúde, no sentido da lei (LGPD, art. 11) — por
          isso pedimos consentimento específico e destacado no momento em que você guarda seu espaço, separado
          do consentimento pra conectar com um profissional (que só é pedido quando você escolhe fazer isso,
          nunca antes).
        </p>

        <h2 className={styles.secao}>Com quem compartilhamos</h2>
        <p className={styles.paragrafo}>
          Os dados ficam num banco de dados operado pela Supabase (nossa infraestrutura técnica). Se você
          conectar com um profissional, ele passa a poder ler o que você escolher compartilhar no Diário — e
          só isso, nunca o resto. Fora isso, seus dados não são compartilhados com mais ninguém.
        </p>

        <h2 className={styles.secao}>Segurança</h2>
        <p className={styles.paragrafo}>
          Cada tabela do banco tem regras de acesso que garantem que você só lê e escreve os seus próprios
          dados (e o profissional conectado, só o que ele mesmo escreveu). Nenhuma credencial de acesso total
          ao banco entra em código que roda no seu navegador.
        </p>

        <h2 className={styles.secao}>Por quanto tempo guardamos</h2>
        <p className={styles.paragrafo}>
          Enquanto sua conta existir. Se você quiser que seus dados sejam apagados, é só pedir (veja abaixo) —
          hoje esse processo é feito manualmente por nós, o que já é suficiente pro estágio atual do projeto.
        </p>

        <h2 className={styles.secao}>Seus direitos</h2>
        <p className={styles.paragrafo}>
          Você pode pedir, a qualquer momento, pra ver quais dados temos sobre você, corrigir algo que esteja
          errado, ou apagar tudo. Pra isso, escreva pra{" "}
          <a className={styles.link} href="mailto:guilhermemsts88@gmail.com?subject=Meus%20dados%20no%20Presença">
            guilhermemsts88@gmail.com
          </a>{" "}
          — respondemos o mais rápido possível.
        </p>

        <h2 className={styles.secao}>Encarregado (DPO)</h2>
        <p className={styles.paragrafo}>
          Guilherme é também o encarregado pelo tratamento de dados (LGPD) — o mesmo contato acima serve pra
          qualquer questão de privacidade.
        </p>

        <h2 className={styles.secao}>Mudanças nesta política</h2>
        <p className={styles.paragrafo}>
          Se este texto mudar de forma relevante, avisamos dentro do próprio app antes da mudança valer.
        </p>
      </div>
    </main>
  );
}
