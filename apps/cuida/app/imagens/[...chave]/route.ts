import { getMedia } from "@/lib/media";

// Serve objetos do bucket R2 compartilhado (`presenca-media`) — não é
// bucket público, então a leitura passa sempre pelo binding do Worker.
// Sem dado sensível aqui (só foto de perfil/capa já pensadas pra
// exibição pública), então sem checagem de sessão — mesmo espírito de
// `public/`.
export async function GET(_req: Request, { params }: { params: Promise<{ chave: string[] }> }) {
  const { chave } = await params;
  const media = await getMedia();
  const objeto = await media.get(chave.join("/"));

  if (!objeto) {
    return new Response("Não encontrado", { status: 404 });
  }

  return new Response(objeto.body as unknown as BodyInit, {
    headers: {
      "Content-Type": objeto.httpMetadata?.contentType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
