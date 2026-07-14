import { Fraunces, Inter } from "next/font/google";

import { MarketingFooter } from "./MarketingFooter";
import { MarketingHeader } from "./MarketingHeader";
import styles from "./layout.module.css";

// Identidade visual só do site público (marketing) — Fraunces + Inter,
// carregadas aqui dentro (escopo desse route group) pra não afetar em nada
// a experiência logada do app, que usa Spectral (ver app/layout.tsx).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
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
