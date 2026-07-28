import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

import { createClient } from "@presenca/supabase/server";

import { calcularConfiguracaoHD } from "./humanDesign";

export type SalvarNascimentoState = { erro?: string };

export type DadosNascimentoForm = {
  data: string;
  hora: string | null;
  local: string | null;
  latitude: number | null;
  longitude: number | null;
};

// Compartilhado entre /perfil/nascimento (edição) e /chegada (modal do
// cadastro) — mesmo parsing e as mesmas regras (só a data é obrigatória).
export function lerDadosNascimentoDoForm(
  formData: FormData,
): { dados: DadosNascimentoForm } | { erro: string } {
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

  if (!data) return { erro: "Precisamos ao menos da data." };
  return { dados: { data, hora: hora || null, local: local || null, latitude, longitude } };
}

// Grava os dados e agenda o cálculo de Human Design em segundo plano
// (ctx.waitUntil — geocoding é uma chamada de rede que pode demorar). Os
// dados de nascimento já estão salvos de qualquer forma; configuracao_hd só
// é preenchida quando o cálculo terminar, sem bloquear quem chamou.
export async function salvarESagendarNascimento(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dados: DadosNascimentoForm,
): Promise<SalvarNascimentoState> {
  const { error } = await supabase
    .from("profiles")
    .update({
      data_nascimento: dados.data,
      hora_nascimento: dados.hora,
      local_nascimento: dados.local,
      nascimento_latitude: dados.latitude,
      nascimento_longitude: dados.longitude,
    })
    .eq("id", userId);
  if (error) return { erro: error.message };

  const { ctx } = await getCloudflareContext({ async: true });
  ctx.waitUntil(processarConfiguracaoHD(supabase, userId, dados));

  return {};
}

async function processarConfiguracaoHD(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  dados: DadosNascimentoForm,
) {
  const configuracaoHD = await calcularConfiguracaoHD(
    dados.data,
    dados.hora,
    dados.local,
    dados.latitude,
    dados.longitude,
  );
  if (!configuracaoHD) return;

  await supabase.from("profiles").update({ configuracao_hd: configuracaoHD }).eq("id", userId);
}
