import type { Metadata, Viewport } from "next";
import { Spectral } from "next/font/google";

import { createClient } from "@presenca/supabase/server";

import { temAcessoLiberado } from "@/lib/acessoMobile";

import { AmbienteShell } from "./AmbienteShell";
import "./globals.css";

const spectral = Spectral({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-spectral",
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
    <html lang="pt-BR" className={spectral.variable}>
      <body>
        <AmbienteShell acessoLiberado={acessoLiberado}>{children}</AmbienteShell>
      </body>
    </html>
  );
}
