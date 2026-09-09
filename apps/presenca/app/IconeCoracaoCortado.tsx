type Props = {
  className?: string;
};

// Mesmo coração de IconeCoracao.tsx, com um traço cortando — usado no
// botão "Não gostei" de app/lente-do-dia/page.tsx. Opacidade reduzida no
// coração pra dar peso visual ao corte, mesmo padrão de camadas dos
// outros ícones inline (ver IconeLente.tsx).
export function IconeCoracaoCortado({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="16"
      height="16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M14 23c-1.2-.8-9.5-6.2-9.5-12.6C4.5 6.9 7.4 4.5 10.7 4.5c1.7 0 3.3.9 3.3 3.1 0-2.2 1.6-3.1 3.3-3.1 3.3 0 6.2 2.4 6.2 5.9C23.5 16.8 15.2 22.2 14 23z"
        opacity="0.55"
      />
      <path d="M4.5 4.5l19 19" />
    </svg>
  );
}
