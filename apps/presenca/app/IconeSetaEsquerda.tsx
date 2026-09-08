type Props = {
  className?: string;
};

// Seta de "voltar" — ícone único, padronizado em toda a barra de topo
// (PageHeader.tsx) e nos botões flutuantes de detalhe (Práticas/Livro
// Vivo/Lente do dia), no lugar do caractere "‹" solto ou do monograma
// "p." que existiam antes em lugares diferentes.
export function IconeSetaEsquerda({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 6l-8 8 8 8" />
    </svg>
  );
}
