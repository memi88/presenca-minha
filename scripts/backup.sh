#!/usr/bin/env bash
# Backup manual do banco Presença (Supabase plano free não tem backup automático).
# Ver docs/backup.md para o passo a passo completo.
#
# Uso:
#   SUPABASE_DB_URL="postgresql://postgres:<senha>@<host>:5432/postgres" ./scripts/backup.sh
#
# A connection string (com a senha do banco) NUNCA deve ser passada por um
# agente de IA nem commitada — só existe na sua máquina, na hora de rodar
# este script, como variável de ambiente.

set -euo pipefail

if [[ -z "${SUPABASE_DB_URL:-}" ]]; then
  echo "Erro: defina SUPABASE_DB_URL antes de rodar este script." >&2
  echo "Encontre a connection string em: Project Settings > Database > Connection string (URI)." >&2
  exit 1
fi

if ! command -v pg_dump >/dev/null 2>&1; then
  echo "Erro: pg_dump não encontrado. Instale o cliente Postgres (ex: 'brew install libpq' e adicione ao PATH)." >&2
  exit 1
fi

mkdir -p backups
timestamp="$(date +%Y%m%d-%H%M%S)"
out="backups/presenca-${timestamp}.dump"

echo "Gerando backup em ${out} ..."
pg_dump "${SUPABASE_DB_URL}" \
  --format=custom \
  --no-owner \
  --no-privileges \
  --file="${out}"

echo "Backup concluído: ${out}"
echo "Restaurar com: pg_restore --clean --if-exists -d \"\$SUPABASE_DB_URL\" ${out}"
