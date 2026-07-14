import { CirculoRespirando } from "./CirculoRespirando";
import { MonogramaP } from "./MonogramaP";
import styles from "./PageHeader.module.css";

type Secao = "conversa" | "livro" | "escrever" | "pratica" | null;

type Props = {
  voltar: { href: string; label: string };
  nome?: string;
  atual?: Secao;
};

// Header universal — em toda tela "de dentro do app" (menos a Home, que
// tem sua própria versão com saudação no mobile, e o site de marketing,
// que tem a wordmark completa).
//
// Sempre visível (mobile, e no desktop quando não há `nome`): barra
// simples — monograma "p." à esquerda (linka /home), "voltar" à direita.
// Quando `nome` existe, no desktop (≥960px) essa barra some e entra o
// wordmark completo + nav + avatar (inalterado desde que isso existia
// como HeaderDesktop).
//
// As duas variantes da barra simples usam classes distintas (não uma
// condição dentro da mesma classe) de propósito — evita empate de
// especificidade entre a regra de desktop de uma e a da outra.
export function PageHeader({ voltar, nome, atual }: Props) {
  const temNav = !!nome;

  return (
    <>
      <div className={`${styles.linhaSimples} ${temNav ? styles.linhaSimplesComNav : styles.linhaSimplesSemNav}`}>
        <a className={styles.monogramaLink} href="/home" aria-label="Página inicial">
          <MonogramaP className={styles.monograma} />
        </a>
        <a className={styles.voltarLink} href={voltar.href}>
          {voltar.label}
        </a>
      </div>

      {temNav && (
        <div className={styles.topBar}>
          <a className={styles.wordmarkDesktop} href="/home">
            <CirculoRespirando className={styles.wordmarkDot} />
            presença
          </a>
          <div className={styles.topBarDireita}>
            <nav className={styles.navDesktop}>
              <span
                className={`${styles.navItemDesabilitado} ${atual === "conversa" ? styles.navItemAtual : ""}`}
              >
                Conversa (em breve)
              </span>
              <a
                className={`${styles.navItem} ${atual === "livro" ? styles.navItemAtual : ""}`}
                href="/livro-vivo"
              >
                Livro Vivo
              </a>
              <a
                className={`${styles.navItem} ${atual === "escrever" ? styles.navItemAtual : ""}`}
                href="/diario"
              >
                Diário
              </a>
              <a
                className={`${styles.navItem} ${atual === "pratica" ? styles.navItemAtual : ""}`}
                href="/meditacao"
              >
                Práticas
              </a>
            </nav>
            <a className={styles.menuAvatar} href="/perfil" aria-label="Perfil">
              {nome!.charAt(0).toUpperCase()}
            </a>
          </div>
        </div>
      )}
    </>
  );
}
