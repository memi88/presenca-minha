type Props = {
  className?: string;
};

// Olho, traço único — mesma origem dos outros ícones inline (docs/redesign/
// home_presen_a_cones_svgs_inline_refinados/code.html), usado só no eyebrow
// da "Lente do dia" na Home (não é destino de nav, não vai no BottomNav).
export function IconeLente({ className }: Props) {
  return (
    <svg
      className={className}
      viewBox="0 0 28 28"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M4 14c4-6 16-6 20 0-4 6-16 6-20 0z" opacity="0.4" />
      <circle cx="14" cy="14" r="4.5" opacity="0.75" />
      <circle cx="14" cy="14" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}
