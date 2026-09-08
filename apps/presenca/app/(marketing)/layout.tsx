import { Fraunces, Inter } from "next/font/google";

import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import styles from "./layout.module.css";

// Identidade visual só do site público (marketing) — Fraunces + Inter,
// carregadas aqui dentro (escopo desse route group) pra não afetar em nada
// a experiência logada do app (ver app/layout.tsx, mesmo Fraunces mas com
// Bitter no lugar de Inter).
// weight: "variable" + axes: ["opsz"] — mesmo motivo do app/layout.tsx: sem
// o eixo de tamanho óptico, Fraunces em peso leve nos headlines grandes do
// site (40px+) vinha com traço mais grosso que o pretendido.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-inter",
  display: "swap",
});

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} ${inter.variable} ${styles.pagina}`}>
      <MarketingHeader />
      <main className={styles.main}>{children}</main>
      <MarketingFooter />
    </div>
  );
}
