-- Coordenadas exatas do local de nascimento, preenchidas quando a pessoa
-- seleciona uma sugestão do autocomplete (app/perfil/nascimento/CampoLocalidade.tsx)
-- em vez de só digitar texto livre. Permite ao cálculo de Human Design
-- pular o geocoding por texto (ambíguo por natureza — "Santos" existe em
-- mais de uma cidade) e ir direto pra resolução de fuso horário a partir
-- da coordenada exata.
--
-- Nullable: continua opcional, mesma filosofia de local_nascimento — quem
-- não seleciona uma sugestão (ou tem perfil de antes dessa feature) não
-- tem coordenada, e o cálculo cai no fallback por texto que já existe.
alter table profiles
  add column if not exists nascimento_latitude double precision,
  add column if not exists nascimento_longitude double precision;

-- Nenhuma policy de RLS nova necessária — "usuário lê e edita o próprio
-- perfil" (fase0) já cobre qualquer coluna de profiles, incluindo estas.
