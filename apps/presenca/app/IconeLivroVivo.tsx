type Props = {
  className?: string;
};

// Livro aberto, traço único — vem do menu inferior confirmado em
// docs/redesign/home_presen_a_cones_svgs_inline_refinados/code.html.
export function IconeLivroVivo({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4.5 6.5c3.2-1.4 6-.6 9.5 1.4 3.2-2.2 6.3-2.4 9.5-1v14c-3.2-1.4-6.3-1.2-9.5 1-3.5-2-6.3-2.8-9.5-1.4z" />
      <path d="M14 7.9v14" />
    </svg>
  );
}
