"""
Etapa 3 -- roda o pipeline completo (cadastro -> perfil natal -> horizontes)
para Guilherme, usando apenas o NumerologyAdapter (Dreamspell/Design Humano
entram nas Etapas 7/8). Dados de nascimento reconstituidos a partir dos
fragmentos do Golden Profile presentes em ENGINE_VALIDATION.md e
EXTERNAL_ENGINE_EVALUATION_humandesign_api.md.

Roda com: python3 -m scripts.run_pipeline_guilherme
"""
import datetime
import json

from app.adapters.numerology_adapter import NumerologyAdapter
from app.db.models import Participante
from app.db.session import get_session
from app.horizons import gerar_todos_horizontes_suportados
from app.pessoa import gerar_ou_obter_perfil_numerologia

GUILHERME = dict(
    nome="guilherme",
    nome_completo_nascimento="Guilherme Moreira dos Santos",
    data_nascimento=datetime.date(1988, 8, 25),
    hora_nascimento=datetime.time(0, 40),
    local_nascimento_texto="Cachoeirinha, RS, Brasil",
    latitude=-29.9511,
    longitude=-51.0900,
    timezone_nascimento="America/Sao_Paulo",
    timezone_atual="America/Sao_Paulo",
    confiabilidade_hora="alta",
)


def get_or_create_guilherme(session) -> Participante:
    p = session.query(Participante).filter_by(nome=GUILHERME["nome"]).first()
    if p is not None:
        return p
    p = Participante(**GUILHERME)
    session.add(p)
    session.commit()
    session.refresh(p)
    return p


def main():
    session = get_session()
    try:
        participante = get_or_create_guilherme(session)
        print(f"=== PESSOA (participante id={participante.id}) ===")
        print(f"{participante.nome_completo_nascimento} -- "
              f"{participante.data_nascimento.isoformat()} {participante.hora_nascimento} "
              f"({participante.local_nascimento_texto}, tz nascimento={participante.timezone_nascimento})")
        print(f"timezone_atual = {participante.timezone_atual}\n")

        adapter = NumerologyAdapter()

        perfil = gerar_ou_obter_perfil_numerologia(session, participante, adapter)
        print("=== PESSOA -- perfil_natal_numerologia (calculo, gravado 1x) ===")
        for campo in [
            "dia_natalicio", "numero_psiquico", "motivacao", "impressao", "expressao",
            "destino", "missao", "licoes_carmicas", "tendencias_ocultas",
            "resposta_subconsciente", "ciclos_de_vida", "desafios", "momentos_decisivos",
        ]:
            print(f"  {campo:24} = {getattr(perfil, campo)}")
        print(f"  [PENDENTE] talento_oculto_hipotese = {perfil.talento_oculto_hipotese}  (hipotese, 1 ponto de dado)")
        print(f"  [PENDENTE] debitos_carmicos         = {perfil.debitos_carmicos}  (nao resolvido)\n")

        horizontes = gerar_todos_horizontes_suportados(session, participante, adapter)
        print("=== ANO -> MES -> SEMANA -> HOJE (elementos_calculados_horizonte) ===")
        for nome in ["ano", "mes", "semana", "hoje"]:
            linha = horizontes[nome]
            print(f"\n[{nome.upper()}] composition_status={linha.composition_status}  "
                  f"chave_periodo={linha.chave_periodo}  data_referencia={linha.data_referencia}")
            print("  elementos_json =", json.dumps(linha.elementos_json, ensure_ascii=False, indent=2).replace("\n", "\n  "))

        print(f"\n=== RESUMO ===")
        print("As 5 camadas da hierarquia Pessoa -> Ano -> Mes -> Semana -> Hoje "
              "estao persistidas em 2 tabelas distintas (criterio formalizado -- "
              "nao sao 5 linhas na mesma tabela):")
        print(f"  perfil_natal_numerologia:        1 linha  (Pessoa, fato imutavel do nascimento)")
        print(f"  elementos_calculados_horizonte:  {len(horizontes)} linhas  "
              f"(Ano/Mes/Semana/Hoje, fotografias congeladas por chave_periodo)")
    finally:
        session.close()


if __name__ == "__main__":
    main()
