// STUB — regenerate para ter autocomplete/typecheck real por coluna.
//
// Requer login interativo (abre o navegador, é a sua conta Supabase — não é
// service_role nem a senha do banco):
//   pnpm dlx supabase login
//   pnpm dlx supabase link --project-ref tysmqeyihbedurdxujjm
//   pnpm dlx supabase gen types typescript --linked > packages/supabase/src/database.types.ts
//
// Até lá, cada tabela é tipada frouxamente (`any` em Row/Insert/Update) —
// `.from("tabela")` compila e funciona, só não avisa se um nome de coluna
// estiver errado.
type LooseTable = {
  Row: any;
  Insert: any;
  Update: any;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: Record<string, LooseTable>;
    Views: Record<string, { Row: any; Relationships: [] }>;
    Functions: Record<string, { Args: any; Returns: any }>;
    Enums: Record<string, string>;
    CompositeTypes: Record<string, any>;
  };
};
