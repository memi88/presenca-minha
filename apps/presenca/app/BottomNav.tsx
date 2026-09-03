import { CirculoRespirando } from "./CirculoRespirando";
import styles from "./BottomNav.module.css";
import { IconeConversa } from "./IconeConversa";
import { IconeDiario } from "./IconeDiario";
import { IconeLivroVivo } from "./IconeLivroVivo";
import { IconePraticas } from "./IconePraticas";

type Secao = "home" | "livro" | "escrever" | "pratica" | "conversa" | null;

type Props = {
  atual: Secao;
};

const ITENS: { id: Exclude<Secao, null>; label: string; href: string; Icone: React.ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", href: "/home", Icone: CirculoRespirando },
  { id: "livro", label: "Livro Vivo", href: "/livro-vivo", Icone: IconeLivroVivo },
  { id: "escrever", label: "Diário", href: "/diario", Icone: IconeDiario },
  { id: "pratica", label: "Práticas", href: "/praticas", Icone: IconePraticas },
  { id: "conversa", label: "Conversa", href: "/conversa", Icone: IconeConversa },
];

// Barra fixa de 5 itens — só mobile (o desktop já tem o nav horizontal do
// PageHeader). Mesma lista de rotas nos dois, ordem fixa por decisão do
// redesign (docs/redesign/presenca-handoff-claude-code.md §2), não
// reordena por uso.
export function BottomNav({ atual }: Props) {
  return (
    <nav className={styles.nav} aria-label="Navegação principal">
      {ITENS.map(({ id, label, href, Icone }) => {
        const ativo = id === atual;
        return (
          <a key={id} className={`${styles.item} ${ativo ? styles.itemAtivo : ""}`} href={href}>
            <Icone className={styles.icone} />
            <span className={styles.label}>{label}</span>
          </a>
        );
      })}
    </nav>
  );
}
