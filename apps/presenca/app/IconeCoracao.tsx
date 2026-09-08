type Props = {
  className?: string;
};

// Traço único, mesma origem dos outros ícones inline (docs/redesign/
// home_presen_a_cones_svgs_inline_refinados/code.html) — usado no botão
// "Gostei" de app/lente-do-dia/page.tsx.
export function IconeCoracao({ className }: Props) {
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
      <path d="M14 23c-1.2-.8-9.5-6.2-9.5-12.6C4.5 6.9 7.4 4.5 10.7 4.5c1.7 0 3.3.9 3.3 3.1 0-2.2 1.6-3.1 3.3-3.1 3.3 0 6.2 2.4 6.2 5.9C23.5 16.8 15.2 22.2 14 23z" />
    </svg>
  );
}
