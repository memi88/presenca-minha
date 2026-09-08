import type { Metadata, Viewport } from "next";
import { Bitter, Fraunces } from "next/font/google";

import { eq } from "drizzle-orm";
import { profiles } from "@presenca/db/schema";

import { temAcessoLiberado } from "@/lib/acessoMobile";
import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { AmbienteShell } from "./AmbienteShell";
import "./globals.css";

// Fraunces (display/headline/body) e Bitter (label/botão/navegação) são o
// par do redesign (docs/redesign/presenca-handoff-claude-code.md §2) — todas
// as telas logadas já migraram, nenhum CSS aqui referencia mais Spectral
// (esse continua só em apps/cuida, sistema visual próprio e deliberadamente
// diferente).
//
// weight: "variable" + axes: ["opsz"] — Fraunces é fonte variável com eixo
// de tamanho óptico (9 a 144): sem isso, pesos fixos (300/400/500) vinham
// com um corte pensado pra texto pequeno, com traço mais grosso — nos
// headlines grandes do redesign (40-56px) isso lia como "quase negrito"
// mesmo em peso 300. Os mockups do Stitch já pediam esse eixo explicitamente
// (`Fraunces:ital,opsz,wght@0,9..144,300...`). Com opsz, o navegador ajusta
// o traço automaticamente pro tamanho renderizado (font-optical-sizing:auto
// é o padrão do CSS, não precisa configurar nada a mais).
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "variable",
  style: ["normal", "italic"],
  axes: ["opsz"],
  variable: "--font-fraunces",
  display: "swap",
});

const bitter = Bitter({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-bitter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Presença",
  description:
    "Presença é um espaço digital de bem-estar emocional e autoconhecimento — um diário guiado pra registrar sua jornada, podendo ser uma jornada acompanhada por quem já cuida de você.",
};

// viewport-fit=cover — sem isso, env(safe-area-inset-*) sempre resolve pra
// 0 e o conteúdo fica sob a status bar/notch dentro do app nativo (o
// WebView do Capacitor já é edge-to-edge por padrão). Inofensivo no
// navegador comum: em dispositivo sem área segura, os insets já são 0.
export const viewport: Viewport = {
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessao = await getSessao();

  let acessoLiberado = true;
  if (sessao) {
    const profile = await (await getDb()).query.profiles.findFirst({
      where: eq(profiles.userId, sessao.user.id),
      columns: { acessoLiberado: true },
    });
    acessoLiberado = temAcessoLiberado(profile);
  }

  return (
    <html lang="pt-BR" className={`${fraunces.variable} ${bitter.variable}`}>
      <body>
        <AmbienteShell acessoLiberado={acessoLiberado}>{children}</AmbienteShell>
      </body>
    </html>
  );
}
