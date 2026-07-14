type Props = {
  className?: string;
};

// "Círculo que respira" — marca principal da presença (docs/logo/circulo.svg:
// 2 anéis + ponto central). SVG inline (não <img>) de propósito: currentColor
// deixa a cor vir do CSS de quem usa (var(--accent) no app logado, âmbar
// fixo no site/Home), sem precisar de arquivos separados por tema.
export function CirculoRespirando({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 120 120" width="16" height="16" aria-hidden="true">
      <circle cx="60" cy="60" r="50" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.4" />
      <circle cx="60" cy="60" r="32" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.7" />
      <circle cx="60" cy="60" r="13" fill="currentColor" />
    </svg>
  );
}
