import { BottomNav } from "./BottomNav";
import { CirculoRespirando } from "./CirculoRespirando";
import styles from "./PageHeader.module.css";
import { VoltarLink } from "./VoltarLink";

type Secao = "conversa" | "livro" | "escrever" | "pratica" | null;

type Props = {
  titulo: string;
  voltar: { href: string };
  nome?: string;
  atual?: Secao;
};

// Header universal — em toda tela "de dentro do app" (menos a Home, que
// tem sua própria versão com saudação no mobile, e o site de marketing,
// que tem a wordmark completa).
//
// Barra simples, sempre visível no mobile (docs/redesign/
// biblioteca_de_pr_ticas_imersiva_e_padronizada — seta + título
// centralizado, ver PageHeader.module.css): substitui o antigo par
// monograma "p." (esquerda) + link de texto "voltar" (direita), que
// existia em cada tela com um rótulo diferente e inconsistente
// ("← voltar", "← Voltar", "‹ Perfil"...). Quando `nome` existe, no
// desktop (≥960px) essa barra some e entra o wordmark completo + nav +
// avatar (inalterado desde que isso existia como HeaderDesktop) — esse
// continua sem título, mesmo comportamento de antes.
export function PageHeader({ titulo, voltar, nome, atual }: Props) {
  const temNav = !!nome;

  return (
    <>
      <div className={`${styles.linhaSimples} ${temNav ? styles.linhaSimplesComNav : styles.linhaSimplesSemNav}`}>
        <VoltarLink href={voltar.href} />
        <h1 className={styles.tituloBarra}>{titulo}</h1>
      </div>

      {temNav && (
        <div className={styles.topBar}>
          <a className={styles.wordmarkDesktop} href="/home">
            <CirculoRespirando className={styles.wordmarkDot} />
            Presença
          </a>
          <div className={styles.topBarDireita}>
            <nav className={styles.navDesktop}>
              <a
                className={`${styles.navItem} ${atual === "conversa" ? styles.navItemAtual : ""}`}
                href="/conversa"
              >
                Conversa
              </a>
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
                href="/praticas"
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

      {temNav && <BottomNav atual={atual ?? null} />}
    </>
  );
}
