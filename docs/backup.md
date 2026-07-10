# Backup do banco — Presença

O plano free do Supabase não inclui backup automático. Este processo manual
precisa estar rodando **antes** de qualquer dado real de terapeuta/paciente
entrar no banco (checklist Fase 0).

## Por que manual, e por que isso é seguro

O script (`scripts/backup.sh`) usa `pg_dump` com a connection string direta do
banco — que inclui a senha do banco (equivalente em poder a `service_role`,
já que dá acesso completo, ignorando RLS). Por isso:

- A connection string **só existe na sua máquina**, como variável de
  ambiente, na hora de rodar o script.
- Ela **nunca** é passada para um agente de IA, nunca é commitada, e não fica
  em nenhum arquivo `.env` versionado.
- Os dumps gerados (`backups/*.dump`) estão no `.gitignore` — nunca sobem pro
  repositório, porque a partir do momento em que há paciente real, eles
  contêm dado sensível.

## Passo a passo

1. **Instale o cliente Postgres** (se ainda não tiver `pg_dump`/`pg_restore`):
   ```bash
   brew install libpq
   echo 'export PATH="/opt/homebrew/opt/libpq/bin:$PATH"' >> ~/.zshrc
   ```

2. **Pegue a connection string** no dashboard do Supabase:
   `Project Settings > Database > Connection string > URI` (modo "Session
   pooler" ou conexão direta — qualquer um serve para `pg_dump`).

3. **Rode o backup**, substituindo a connection string:
   ```bash
   SUPABASE_DB_URL="postgresql://postgres:<senha>@<host>:5432/postgres" \
     ./scripts/backup.sh
   ```
   Isso gera `backups/presenca-<timestamp>.dump`.

4. **Guarde o dump fora do repositório** — num local seguro e criptografado
   (ex: um bucket privado, um cofre de senhas com anexos, ou disco
   criptografado). O `.gitignore` impede que ele suba por acidente, mas isso
   não é o mesmo que um backup estar de fato guardado em lugar seguro.

5. **Teste a restauração de vez em quando** (backup que nunca foi restaurado
   não é backup testado):
   ```bash
   SUPABASE_DB_URL="postgresql://postgres:<senha>@<host>:5432/postgres" \
     pg_restore --clean --if-exists -d "$SUPABASE_DB_URL" backups/presenca-<timestamp>.dump
   ```
   Faça isso contra um projeto Supabase separado de teste, nunca direto no
   projeto com dado real, a menos que seja um exercício deliberado de
   disaster recovery.

## Cadência recomendada para o piloto (3 terapeutas)

Manual diário (ou antes/depois de qualquer sessão de trabalho no banco) é
suficiente para o volume do piloto. Automatizar (cron local, GitHub Action
agendada, etc.) é um refinamento razoável assim que o piloto sair do papel —
não bloqueia a Fase 0.
