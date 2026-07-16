import type { NextRequest } from "next/server";

import { createClient } from "@presenca/supabase/server";

type SugestaoLocal = {
  label: string;
  cidade: string;
  estado: string | null;
  pais: string | null;
  lat: number;
  lng: number;
};

type FeaturePhoton = {
  properties: {
    name?: string;
    city?: string;
    state?: string;
    country?: string;
    type?: string;
  };
  geometry: {
    coordinates: [number, number]; // GeoJSON: [lng, lat]
  };
};

function formatarLabel(cidade: string, estado: string | null, pais: string | null): string {
  const partes = [cidade];
  if (estado) partes.push(estado);
  if (pais && pais !== "Brasil") partes.push(pais);
  return partes.join(" - ");
}

// Proxy autenticado pro Photon (komoot) — mesmo padrão de /embed e
// /human-design em services/ia: nunca chamar um provedor externo direto
// do browser. Photon é gratuito, sem chave, feito especificamente pra
// autocomplete (ao contrário do Nominatim puro, que desaconselha esse
// padrão de uso na própria política de uso).
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(null, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return Response.json([]);
  }

  try {
    const resposta = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=6`,
      { signal: AbortSignal.timeout(8_000) },
    );
    if (!resposta.ok) {
      return Response.json([]);
    }

    const dados = (await resposta.json()) as { features?: FeaturePhoton[] };
    const sugestoes: SugestaoLocal[] = (dados.features ?? [])
      .filter((f) => f.properties.type === "city" && (f.properties.city ?? f.properties.name))
      .map((f) => {
        const cidade = f.properties.city ?? f.properties.name!;
        const estado = f.properties.state ?? null;
        const pais = f.properties.country ?? null;
        const [lng, lat] = f.geometry.coordinates;
        return { label: formatarLabel(cidade, estado, pais), cidade, estado, pais, lat, lng };
      });

    return Response.json(sugestoes);
  } catch (erro) {
    console.error("geocoding: falha ao chamar o Photon", erro);
    return Response.json([]);
  }
}
