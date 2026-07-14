type Props = {
  className?: string;
};

// Monograma "p." — assinatura compacta da marca (docs/logo/monograma-p.svg),
// pro uso documentado em espaços pequenos. currentColor no traço do "p"
// (adapta por contexto: var(--text) no app, branco na Home) e var(--accent)
// no pontinho, mesmo padrão do CirculoRespirando.tsx.
export function MonogramaP({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 120 140" width="20" height="20" aria-hidden="true">
      <text
        x="46"
        y="104"
        textAnchor="middle"
        fontFamily="'Fraunces', Georgia, 'Times New Roman', serif"
        fontStyle="italic"
        fontWeight="300"
        fontSize="120"
        fill="currentColor"
      >
        p
      </text>
      <circle cx="96" cy="42" r="9" fill="var(--accent)" />
    </svg>
  );
}
