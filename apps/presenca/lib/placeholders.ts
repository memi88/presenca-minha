// Ilustração própria (gradiente + traço orgânico, ver
// public/images/placeholders/) pra quando `biblioteca.capaChave`/
// `profissionais.fotoChave` ainda não foram preenchidos (upload
// opcional — ver apps/cuida/app/perfil e app/biblioteca/nova) — nunca
// foto de banco de imagens fingindo ser conteúdo real.
export const PLACEHOLDER_PRATICA = "/images/placeholders/pratica.svg";
export const PLACEHOLDER_LIVRO_VIVO = "/images/placeholders/livro-vivo.svg";
export const PLACEHOLDER_TERAPEUTA = "/images/placeholders/terapeuta.svg";

/** Chave do R2 (`biblioteca.capaChave`/`profissionais.fotoChave`) vira URL
 * servida por `app/imagens/[...chave]/route.ts`; sem chave, cai no
 * placeholder. */
export function imagemUrl(chave: string | null | undefined, placeholder: string): string {
  return chave ? `/imagens/${chave}` : placeholder;
}
