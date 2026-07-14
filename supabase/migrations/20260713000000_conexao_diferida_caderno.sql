-- Embedding e busca de conexão (buscar_conexao_caderno) passaram a rodar em
-- segundo plano após o insert, pra não travar a resposta de quem está
-- escrevendo (services/ia pode levar vários segundos). Sem isso, a conexão
-- só existia como retorno síncrono da Server Action — precisa de um lugar
-- pra guardar o resultado até a próxima vez que a entrada for exibida.
alter table caderno_entradas add column conexao_conteudo text;
