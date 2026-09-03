import type { Metadata, Viewport } from "next";
import { Bitter, Fraunces, Spectral } from "next/font/google";

import { createClient } from "@presenca/supabase/server";

import { temAcessoLiberado } from "@/lib/acessoMobile";

import { AmbienteShell } from "./AmbienteShell";
import "./globals.css";

// Spectral fica carregado (ainda usado em CSS existente enquanto a
// migração pro sistema novo avança tela por tela — docs/redesign). Fraunces
// (display/headline/body) e Bitter (label/botão/navegação) são o par do
// redesign (docs/redesign/presenca-handoff-claude-code.md §2).
const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let acessoLiberado = true;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("acesso_liberado")
      .eq("id", user.id)
      .maybeSingle();
    acessoLiberado = temAcessoLiberado(profile);
  }

  return (
    <html lang="pt-BR" className={`${spectral.variable} ${fraunces.variable} ${bitter.variable}`}>
      <body>
        <AmbienteShell acessoLiberado={acessoLiberado}>{children}</AmbienteShell>
      </body>
    </html>
  );
}
