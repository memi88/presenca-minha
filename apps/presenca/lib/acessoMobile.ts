type PerfilAcesso = { acessoLiberado: boolean | null };

/**
 * Ainda não existe cobrança de verdade (docs/presenca-extensao-app-mobile.md
 * §2) — isso só lê um interruptor manual em `profiles.acesso_liberado`.
 * Centralizado aqui pra quando virar checagem de assinatura real, só este
 * arquivo precisa mudar.
 */
export function temAcessoLiberado(perfil: PerfilAcesso | null | undefined): boolean {
  return perfil?.acessoLiberado ?? true;
}
