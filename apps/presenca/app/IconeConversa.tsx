type Props = {
  className?: string;
};

// Balão de fala, traço único — vem do menu inferior confirmado em
// docs/redesign/home_presen_a_cones_svgs_inline_refinados/code.html.
export function IconeConversa({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinejoin="round"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 9.8c0-3.1 3.2-5.3 9-5.3s9 2.2 9 5.3-3.2 5.2-9 5.2c-.7 0-1.4 0-2.1-.15l-4.3 2.9.6-3.8C6.1 12.8 5 11.4 5 9.8z" />
    </svg>
  );
}
