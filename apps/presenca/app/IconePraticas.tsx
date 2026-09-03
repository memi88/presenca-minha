type Props = {
  className?: string;
};

// Folha, traço único — vem do menu inferior confirmado em
// docs/redesign/home_presen_a_cones_svgs_inline_refinados/code.html.
export function IconePraticas({ className }: Props) {
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
      aria-hidden="true"
    >
      <path d="M14 4.5c5.6 1 8.7 5 8.7 9.5s-3.6 8.2-8.7 9.5c-5.6-1-8.7-5-8.7-9.5 2.6 3 5.4 3.9 8 2.8 2.7-1.1 3.3-3.9 1.6-6.2-1-1.3-2.6-1.6-3.7-.7" />
    </svg>
  );
}
