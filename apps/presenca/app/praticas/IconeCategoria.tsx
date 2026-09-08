import type { CategoriaPratica } from "@/lib/categoriasPratica";

type Props = {
  categoria: CategoriaPratica;
  className?: string;
};

// Ícone por categoria real de CATEGORIAS_PRATICA (lib/categoriasPratica.ts)
// — usado no eyebrow do card da grade (docs/redesign/
// biblioteca_de_pr_ticas_imersiva_e_padronizada). Traço único, mesmo
// espírito dos outros ícones inline do app (ver IconeLente.tsx).
export function IconeCategoria({ categoria, className }: Props) {
  const props = {
    className,
    viewBox: "0 0 28 28",
    width: 15,
    height: 15,
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (categoria === "respiracao") {
    return (
      <svg {...props}>
        <path d="M3 9h12.5a2.5 2.5 0 1 0-2-4" />
        <path d="M3 14h15a2.5 2.5 0 1 1-2 4" />
        <path d="M3 19h8" />
      </svg>
    );
  }

  if (categoria === "meditacao") {
    return (
      <svg {...props}>
        <circle cx="14" cy="7" r="3" />
        <path d="M5 21c0-6 4-9 9-9s9 3 9 9" />
      </svg>
    );
  }

  if (categoria === "sono") {
    return (
      <svg {...props}>
        <path d="M17 4.2A9 9 0 1 0 19.8 22 9.8 9.8 0 0 1 17 4.2z" />
      </svg>
    );
  }

  return (
    <svg {...props}>
      <circle cx="17" cy="6" r="2.2" />
      <path d="M17 8.5l-1 5-4.5 2M16 13.5l3 2.5.5 5M9 22l3-6.5" />
    </svg>
  );
}
