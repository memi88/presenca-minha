"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { redirect } from "next/navigation";

import { createClient } from "@presenca/supabase/server";

import { calcularConfiguracaoHD } from "@/lib/humanDesign";

export type SalvarNascimentoState = { erro?: string };

export async function salvarNascimento(
  _prev: SalvarNascimentoState,
  formData: FormData,
): Promise<SalvarNascimentoState> {
  const data = String(formData.get("data") ?? "").trim();
  const hora = String(formData.get("hora") ?? "").trim();
  const local = String(formData.get("local") ?? "").trim();
  // Só vêm preenchidos quando a pessoa seleciona uma sugestão do
  // autocomplete (CampoLocalidade.tsx) — texto livre sem seleção não tem
  // coordenada, e isso é esperado (mesma filosofia tolerante do campo).
  const latitudeRaw = String(formData.get("latitude") ?? "").trim();
  const longitudeRaw = String(formData.get("longitude") ?? "").trim();
  const latitude = latitudeRaw ? Number(latitudeRaw) : null;
  const longitude = longitudeRaw ? Number(longitudeRaw) : null;

  if (!data) {
    return { erro: "Precisamos ao menos da data." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("profiles")
    .update({
      data_nascimento: data,
      hora_nascimento: hora || null,
      local_nascimento: local || null,
      nascimento_latitude: latitude,
      nascimento_longitude: longitude,
    })
    .eq("id", user.id);
  if (error) return { erro: error.message };

  // Cálculo roda depois da resposta (geocoding é uma chamada de rede que
  // pode demorar) — mesmo padrão de processarConexaoEntrada em
  // app/diario/actions.ts. Os dados de nascimento já estão salvos de
  // qualquer forma; configuracao_hd só é preenchida quando o cálculo
  // terminar, sem bloquear o redirect abaixo.
  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(
    processarConfiguracaoHD(supabase, user.id, data, hora || null, local || null, latitude, longitude),
  );

  redirect("/perfil");
}

async function processarConfiguracaoHD(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dataNascimento: string,
  horaNascimento: string | null,
  localNascimento: string | null,
  latitude: number | null,
  longitude: number | null,
) {
  const configuracaoHD = await calcularConfiguracaoHD(
    dataNascimento,
    horaNascimento,
    localNascimento,
    latitude,
    longitude,
  );
  if (!configuracaoHD) return;

  await supabase.from("profiles").update({ configuracao_hd: configuracaoHD }).eq("id", userId);
}
