type Props = {
  className?: string;
};

// Pena escrevendo, traço único — vem do menu inferior confirmado em
// docs/redesign/home_presen_a_cones_svgs_inline_refinados/code.html.
export function IconeDiario({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 22c5.5-1 10-4.8 14.5-13.2" />
      <path d="M17.3 6.2c1.6.3 2.9 1.5 3.3 3.1-1.7.4-3.4-.1-4.6-1.3" />
      <circle cx="6" cy="22" r="1.15" fill="currentColor" stroke="none" />
    </svg>
  );
}
