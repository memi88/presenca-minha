// STUB — regenerate once the Supabase project exists.
//
// Run (using your own Supabase login, never service_role):
//   pnpm dlx supabase login
//   pnpm dlx supabase link --project-ref <seu-project-ref>
//   pnpm dlx supabase gen types typescript --linked > packages/supabase/src/database.types.ts
//
// Until then, tables are typed as `unknown` so the client factories still
// compile, but table-level autocomplete/typechecking is unavailable.
export type Database = {
  public: {
    Tables: Record<string, unknown>;
    Views: Record<string, unknown>;
    Functions: Record<string, unknown>;
    Enums: Record<string, unknown>;
  };
};
