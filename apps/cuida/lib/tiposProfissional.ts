// Mesma lista do check constraint `profissionais_tipo_check` (migration
// fase11_self_signup_terapeuta) — mantida em sincronia manual, é curta e
// muda raramente.
export const TIPOS_PROFISSIONAL = [
  "TCC",
  "Psicanálise",
  "Gestalt-terapia",
  "Terapia Sistêmica",
  "ACT",
  "Humanista",
  "Holística/Integrativa",
  "Outra",
] as const;
