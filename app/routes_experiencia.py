"""
routes_experiencia.py

As 5 rotas de experiência (Etapa 6 do IMPLEMENTATION_PLAN.md):
/{participante}/pessoa, /ano, /mes, /semana, /hoje -- mais /presente (A6,
CLAUDE.md secao 5), a tela diaria do Alpha. Direção visual: Variação D
(DESIGN_DIRECTION.md §14).

Cada página monta uma lista `cards`, um por sistema que tem algo a
mostrar naquele horizonte -- nunca zero, no máximo três (PRD_v0.1.md
§4.2). Três tratamentos possíveis por card:
  - "real": sistema tem metodologia validada para este horizonte -- dado
    calculado + leitura curada.
  - "reservado": sistema ainda não foi implementado no produto (honesto,
    nunca dado fabricado).
  - omitido: sistema não tem metodologia nativa para este horizonte (ex.:
    Dreamspell em Ano/Mês) -- não aparece nem como reservado, porque não é
    uma ausência temporária, é uma decisão permanente já registrada em
    ENGINE_VALIDATION.md.

/presente e uma tela a parte, nao mais um card entre os 3 sistemas (ver
docs/handoff_package/03_DAILY_EXPERIENCE.md) -- so Dreamspell, so "hoje",
sem navegacao temporal livre (EXPERIENCE_MODEL.md). A primeira visita do
dia pode levar alguns segundos (Interpretation Engine, A5) -- por isso a
geracao roda em BackgroundTasks e a rota devolve uma tela de carregamento
ate a LeituraDiaria existir, nunca trava a resposta HTTP em si.

/fechamento (A7) e outra tela a parte: registro livre + marcador rapido +
8 perguntas de laboratorio, sobre o dia que esta terminando. Diferente de
/presente, e so leitura/escrita direta (sem Interpretation Engine, sem
BackgroundTasks) -- editavel livremente enquanto o dia ainda for hoje,
congela na virada (ver app/alpha/reflexao.py).
"""
import datetime
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Form, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.orm import Session

from app.adapters.base import HorizonteNaoSuportado, snapshot_date_hoje
from app.adapters.dreamspell_adapter import DreamspellAdapter
from app.adapters.human_design_adapter import HumanDesignAdapter
from app.adapters.numerology_adapter import NumerologyAdapter
from app.alpha.daily_moment import obter_ou_criar_momento_diario
from app.alpha.interpretation import STATUS_FIXED_HUNAB_KU, obter_ou_publicar_leitura_diaria
from app.alpha.modelo_gpt56sol import GPT56SolClient
from app.alpha.reflexao import (
    RespostasLaboratorioInvalidas,
    ReflexaoJaCongelada,
    obter_reflexao_diaria,
    salvar_reflexao_diaria,
)
from app.alpha.relevance import obter_ou_criar_resultado_relevancia
from app.db.models import ElementoCalculadoHorizonte, LeituraDiaria, MomentoDiario, Participante, ResultadoRelevancia
from app.db.session import get_session
from app.horizons import gerar_horizonte
from app.knowledge import buscar_conhecimento
from app.pessoa import (
    gerar_ou_obter_perfil_design_humano,
    gerar_ou_obter_perfil_dreamspell,
    gerar_ou_obter_perfil_numerologia,
)

router = APIRouter()
templates = Jinja2Templates(directory="app/templates")

DIAS_SEMANA_PT = ["SEGUNDA", "TERÇA", "QUARTA", "QUINTA", "SEXTA", "SÁBADO", "DOMINGO"]
MESES_PT = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"]

TITULOS = {"ano": "Ano", "mes": "Mês", "semana": "Semana", "hoje": "Hoje"}
SUBTITULOS = {
    "ano": "O ciclo que você está vivendo este ano.",
    "mes": "O tom deste mês para você.",
    "semana": "Os sete dias que você está atravessando.",
    "hoje": "O momento que você está vivendo.",
}

# O motor de Dreamspell (ja validado, ver ENGINE_VALIDATION.md) trabalha
# com nomes ASCII (SEALS/TONES em app/engines/dreamspell_engine.py) --
# esta e so a camada de apresentacao, traduzindo para acentuacao correta
# na interface sem tocar no motor testado.
# A cor de cada selo e fixa (indice do selo mod 4 -- nunca varia, ver
# dreamspell_engine.py SEAL_COLORS), entao a concordancia de genero
# tambem e fixa por selo. selo_cor bruto do motor ("Vermelho"/"Branco"/
# "Azul"/"Amarelo") nao concorda em genero com substantivos femininos
# (Lua, Terra, Serpente...) -- esta e a frase ja concordada, para prosa;
# o valor bruto do motor continua disponivel em elementos_json para
# rastreabilidade tecnica.
SELO_COR_EXIBICAO = {
    "Dragao": "Dragão Vermelho", "Vento": "Vento Branco", "Noite": "Noite Azul",
    "Semente": "Semente Amarela", "Serpente": "Serpente Vermelha",
    "Enlacador de Mundos": "Enlaçador de Mundos Branco", "Mao": "Mão Azul",
    "Estrela": "Estrela Amarela", "Lua": "Lua Vermelha", "Cao": "Cão Branco",
    "Macaco": "Macaco Azul", "Humano": "Humano Amarelo",
    "Caminhante do Ceu": "Caminhante do Céu Vermelho", "Mago": "Mago Branco",
    "Aguia": "Águia Azul", "Guerreiro": "Guerreiro Amarelo", "Terra": "Terra Vermelha",
    "Espelho": "Espelho Branco", "Tempestade": "Tempestade Azul", "Sol": "Sol Amarelo",
}
TOM_EXIBICAO = {
    "Magnetico": "Magnético", "Lunar": "Lunar", "Eletrico": "Elétrico",
    "Auto-Existente": "Auto-Existente", "Overtonal": "Overtonal", "Ritmico": "Rítmico",
    "Ressonante": "Ressonante", "Galactico": "Galáctico", "Solar": "Solar",
    "Planetario": "Planetário", "Espectral": "Espectral", "Cristal": "Cristal",
    "Cosmico": "Cósmico",
}
# Mesmo padrao: hd_bodygraph.CENTER_LABELS_PT tambem esta em ASCII
# ('Baco', 'Cabeca', 'Coracao') -- correcao so na camada de apresentacao.
CENTRO_EXIBICAO = {
    "head": "Cabeça (Coroa)", "ajna": "Ajna", "throat": "Garganta", "g": "G (Identidade)",
    "heart": "Coração (Ego/Vontade)", "sacral": "Sacral", "solarplexus": "Plexo Solar",
    "spleen": "Baço", "root": "Raiz",
}
# Mesmo padrao: hd_bodygraph.CHANNEL_NAMES_PT tambem esta em ASCII.
CANAL_NOME_EXIBICAO = {
    (1, 8): "Inspiração", (2, 14): "O Ritmo", (3, 60): "Mutação", (4, 63): "Lógica",
    (5, 15): "Ritmo", (6, 59): "União Sexual", (7, 31): "O Alfa", (9, 52): "Concentração",
    (10, 20): "Despertar", (10, 34): "Exploração", (10, 57): "Forma Perfeita",
    (11, 56): "Curiosidade", (12, 22): "Abertura", (13, 33): "O Pródigo",
    (16, 48): "Comprimento de Onda", (17, 62): "Aceitação", (18, 58): "Julgamento",
    (19, 49): "Síntese", (20, 34): "Carisma", (20, 57): "Onda Cerebral",
    (21, 45): "Dinheiro", (23, 43): "Estruturação", (24, 61): "Consciência", (25, 51): "Iniciação",
    (26, 44): "Rendição", (27, 50): "Preservação", (28, 38): "Luta",
    (29, 46): "Descoberta", (30, 41): "Reconhecimento", (32, 54): "Transformação",
    (34, 57): "Poder", (35, 36): "Transitoriedade", (37, 40): "Comunidade",
    (39, 55): "Emocionar", (42, 53): "Maturação", (47, 64): "Abstração",
}


def _contexto_cabecalho(data: datetime.date) -> str:
    return f"{DIAS_SEMANA_PT[data.weekday()]} · {data.day:02d} {MESES_PT[data.month - 1]}"


def _obter_participante(session: Session, nome: str) -> Participante:
    p = session.query(Participante).filter_by(nome=nome).first()
    if p is None:
        raise HTTPException(status_code=404, detail=f"Participante '{nome}' não encontrado.")
    return p


def _card_numerologia(session: Session, linha: ElementoCalculadoHorizonte) -> dict:
    ej = linha.elementos_json

    if linha.horizonte == "ano":
        valor = ej["ano_pessoal"]
        conhecimento = buscar_conhecimento(session, "numerologia", "numero", f"ano_pessoal:{valor}")
        return {
            "tipo": "real", "simbolo": "△", "nome": "Numerologia",
            "dado_principal": f"Ano Pessoal {valor}",
            "leitura": conhecimento.texto_curado if conhecimento else None,
            "composition_status": linha.composition_status,
            "prova": [
                f"Ano Pessoal <b>{valor}</b>",
                f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
            ],
        }

    if linha.horizonte == "mes":
        valor = ej["mes_pessoal"]
        conhecimento = buscar_conhecimento(session, "numerologia", "numero", f"mes_pessoal:{valor}")
        return {
            "tipo": "real", "simbolo": "△", "nome": "Numerologia",
            "dado_principal": f"Mês Pessoal {valor}",
            "leitura": conhecimento.texto_curado if conhecimento else None,
            "composition_status": linha.composition_status,
            "prova": [
                f"Mês Pessoal <b>{valor}</b>",
                f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
            ],
        }

    if linha.horizonte == "hoje":
        valor = ej["dia_pessoal"]
        conhecimento = buscar_conhecimento(session, "numerologia", "numero", f"dia_pessoal:{valor}")
        return {
            "tipo": "real", "simbolo": "△", "nome": "Numerologia",
            "dado_principal": f"Dia Pessoal {valor}",
            "leitura": conhecimento.texto_curado if conhecimento else None,
            "composition_status": linha.composition_status,
            "prova": [
                f"Dia Pessoal <b>{valor}</b>",
                f"calculado 03:00 · data civil {linha.data_referencia}",
                f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
            ],
        }

    if linha.horizonte == "semana":
        dias = ej["dias_pessoais"]
        prova = [f"{d['data']}: <b>{d['dia_pessoal']}</b>" for d in dias]
        prova.append(f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}")
        return {
            "tipo": "real", "simbolo": "△", "nome": "Numerologia",
            "dado_principal": "Dias Pessoais " + " · ".join(str(d["dia_pessoal"]) for d in dias),
            "leitura": "Sequência da semana — composição do produto.",
            "composition_status": linha.composition_status,
            "prova": prova,
        }

    raise ValueError(f"horizonte desconhecido: {linha.horizonte}")


# Mensagem fixa de Hunab Ku 0.0 (29/02) -- fonte unica, reusada tanto pelo
# card de "hoje" da hierarquia de 3 sistemas (_card_dreamspell abaixo)
# quanto pela tela do Alpha (A6, ver _obter_contexto_presente). Nunca
# reescrever uma segunda versao desta mensagem em outro lugar.
HUNAB_KU_DADO_PRINCIPAL = "Hunab Ku 0.0"
HUNAB_KU_MENSAGEM = (
    "29 de fevereiro fica fora da contagem do Kin no Sincronário das 13 Luas — "
    "hoje não tem Selo nem Tom próprios."
)

NIVEL_RELACAO_EXIBICAO = {
    "NONE": "nenhuma relação estrutural com o seu Selo natal foi identificada hoje",
    "SAME_SEAL": "o Selo de hoje é o mesmo do seu mapa natal",
}


def _card_dreamspell(session: Session, linha: ElementoCalculadoHorizonte) -> dict:
    ej = linha.elementos_json

    if linha.horizonte == "hoje":
        kin, selo = ej["kin"], ej["selo"]
        # Hunab Ku 0.0 (29/02): kin/selo/tom vem None do adapter de proposito
        # (ver ENGINE_VALIDATION.md secao 8) -- esse dia nao tem Kin proprio,
        # nao e um erro de dado. Sem isto, SELO_COR_EXIBICAO[None] estouraria
        # KeyError na proxima vez que 29/02 cair num "Hoje" (2028).
        if kin is None:
            return {
                "tipo": "real", "simbolo": "◇", "nome": "Tzolkin",
                "dado_principal": HUNAB_KU_DADO_PRINCIPAL,
                "leitura": HUNAB_KU_MENSAGEM,
                "composition_status": linha.composition_status,
                "prova": [
                    "Hunab Ku 0.0 (29/02) — sem Kin próprio, contagem retoma no dia seguinte",
                    f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
                ],
            }
        tom, tom_numero = ej["tom"], ej["tom_numero"]
        selo_cor_pt, tom_pt = SELO_COR_EXIBICAO[selo], TOM_EXIBICAO[tom]
        conhecimento = buscar_conhecimento(session, "dreamspell", "selo", selo)
        texto_selo = conhecimento.texto_curado if conhecimento else ""
        return {
            "tipo": "real", "simbolo": "◇", "nome": "Tzolkin",
            "dado_principal": f"Kin {kin}",
            "leitura": f"{selo_cor_pt} · Tom {tom_numero} ({tom_pt}). {texto_selo}".strip(),
            "composition_status": linha.composition_status,
            "prova": [
                f"Kin <b>{kin}</b>",
                f"Selo <b>{selo_cor_pt}</b>",
                f"Tom <b>{tom_numero}</b> ({tom_pt})",
                f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
            ],
        }

    if linha.horizonte == "semana":
        dias = ej["dias"]

        def _linha_prova(d: dict) -> str:
            if d["kin"] is None:  # Hunab Ku 0.0 dentro da semana
                return f"{d['data']}: Hunab Ku 0.0 — sem Kin"
            return f"{d['data']}: Kin <b>{d['kin']}</b> ({SELO_COR_EXIBICAO[d['selo']]})"

        prova = [_linha_prova(d) for d in dias]
        prova.append(f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}")
        return {
            "tipo": "real", "simbolo": "◇", "nome": "Tzolkin",
            "dado_principal": "Kins " + " · ".join(str(d["kin"]) if d["kin"] is not None else "—" for d in dias),
            "leitura": "Sequência da semana — composição do produto.",
            "composition_status": linha.composition_status,
            "prova": prova,
        }

    raise ValueError(f"horizonte desconhecido para dreamspell: {linha.horizonte}")


def _frase_centros(centros: list) -> str:
    nomes = [CENTRO_EXIBICAO[c] for c in centros]
    if not nomes:
        return "Nenhum canal novo formado pelo trânsito"
    if len(nomes) == 1:
        return f"{nomes[0]} temporariamente definido"
    return f"{', '.join(nomes[:-1])} e {nomes[-1]} temporariamente definidos"


def _nome_canal(par: list) -> str:
    nome = CANAL_NOME_EXIBICAO.get(tuple(sorted(par)))
    return f"{par[0]}-{par[1]}" + (f" ({nome})" if nome else "")


def _card_design_humano(session: Session, linha: ElementoCalculadoHorizonte) -> dict:
    ej = linha.elementos_json

    if linha.horizonte in ("hoje", "mes"):
        gate_sol, linha_sol = ej["ativacoes_transito"]["Sol"]
        conhecimento = buscar_conhecimento(session, "design_humano", "gate", str(gate_sol))
        texto_gate = conhecimento.texto_curado if conhecimento else None
        canais = [_nome_canal(c) for c in ej["canais_novos"]]
        prova = [
            f"Sol em trânsito: Gate <b>{gate_sol}</b>, Linha <b>{linha_sol}</b>",
            f"Gates de trânsito: <b>{', '.join(str(g) for g in ej['gates_transito'])}</b>",
            f"Canais novos: <b>{', '.join(canais) if canais else 'nenhum'}</b>",
            f"Centros temporários: <b>{', '.join(CENTRO_EXIBICAO[c] for c in ej['centros_temporarios']) or 'nenhum'}</b>",
            f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
        ]
        return {
            "tipo": "real", "simbolo": "○", "nome": "Design Humano",
            "dado_principal": f"Gate {gate_sol}",
            "leitura": texto_gate,
            "composition_status": linha.composition_status,
            "prova": prova,
        }

    if linha.horizonte == "semana":
        canais = [_nome_canal(c) for c in ej["canais_novos"]]
        prova = [
            f"Gates de trânsito na semana (união dos 7 dias): <b>{', '.join(str(g) for g in ej['gates_transito'])}</b>",
            f"Canais novos: <b>{', '.join(canais) if canais else 'nenhum'}</b>",
            f"chave_periodo <b>{linha.chave_periodo}</b> · {linha.composition_status}",
        ]
        return {
            "tipo": "real", "simbolo": "○", "nome": "Design Humano",
            "dado_principal": _frase_centros(ej["centros_temporarios"]),
            "leitura": "União dos trânsitos da semana — composição do produto.",
            "composition_status": linha.composition_status,
            "prova": prova,
        }

    raise ValueError(f"horizonte desconhecido para design humano: {linha.horizonte}")


@router.get("/{participante_nome}/pessoa", response_class=HTMLResponse)
def pagina_pessoa(request: Request, participante_nome: str):
    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)

        perfil_num = gerar_ou_obter_perfil_numerologia(session, participante, NumerologyAdapter())
        perfil_ds = gerar_ou_obter_perfil_dreamspell(session, participante, DreamspellAdapter())
        perfil_dh = gerar_ou_obter_perfil_design_humano(session, participante, HumanDesignAdapter())

        cards = [
            {
                "tipo": "real", "simbolo": "△", "nome": "Numerologia",
                "dado_principal": f"Destino {perfil_num.destino} · Expressão {perfil_num.expressao} · Missão {perfil_num.missao}",
            },
            {
                "tipo": "real", "simbolo": "◇", "nome": "Tzolkin",
                "dado_principal": f"Kin {perfil_ds.kin} · {SELO_COR_EXIBICAO[perfil_ds.selo]}, Tom {perfil_ds.tom_numero} ({TOM_EXIBICAO[perfil_ds.tom]})",
            },
            {
                "tipo": "real", "simbolo": "○", "nome": "Design Humano",
                "dado_principal": f"{perfil_dh.tipo} · Autoridade {perfil_dh.autoridade} · Perfil {perfil_dh.perfil}",
            },
        ]

        return templates.TemplateResponse(request, "pessoa.html", {
            "participante": participante,
            "horizonte_ativo": "pessoa",
            "cards": cards,
        })
    finally:
        session.close()


def _buscar_leitura_diaria(session: Session, participante_id: int, data_referencia: datetime.date) -> Optional[LeituraDiaria]:
    return (
        session.query(LeituraDiaria)
        .filter_by(participante_id=participante_id, data_referencia=data_referencia)
        .first()
    )


def _gerar_leitura_diaria_em_background(participante_id: int, momento_id: int, resultado_id: int) -> None:
    """Roda fora do ciclo de request/response (FastAPI BackgroundTasks) --
    por isso abre a PROPRIA sessao (a do request original ja fechou
    quando isso executa) e recebe so IDs, nunca objetos ORM presos a
    outra sessao. Protegida pelo mesmo pg_advisory_xact_lock de
    obter_ou_publicar_leitura_diaria (app/alpha/interpretation.py) -- se
    duas visitas rapidas enfileirarem esta tarefa, so uma de fato chama
    o modelo; a outra bloqueia no lock e devolve a linha ja publicada."""
    session = get_session()
    try:
        participante = session.query(Participante).filter_by(id=participante_id).first()
        momento = session.query(MomentoDiario).filter_by(id=momento_id).first()
        resultado = session.query(ResultadoRelevancia).filter_by(id=resultado_id).first()
        obter_ou_publicar_leitura_diaria(session, participante, momento, resultado, GPT56SolClient())
    finally:
        session.close()


def _contexto_entender_presente(leitura: LeituraDiaria, momento: MomentoDiario) -> dict:
    """Traduz o resumo_derivacao (tokens tecnicos como SAME_SEAL/
    HUNAB_KU_0_0) pra frases legiveis -- o UNICO lugar da tela onde isso
    pode acontecer (briefing da A6). Expoe so campos de contexto do
    calculo -- NUNCA qa_status/prompt_version/ruleset_version_used/
    contagem de tentativas, que sao auditoria interna, nao experiencia."""
    if momento.tipo_dia == "HUNAB_KU_0_0":
        return {
            "data": _contexto_cabecalho(momento.data_referencia),
            "linhas": [HUNAB_KU_MENSAGEM],
        }

    resumo = leitura.resumo_derivacao
    linhas = [
        f"Selo do dia: {SELO_COR_EXIBICAO.get(momento.selo, momento.selo)}",
        f"Tom do dia: {TOM_EXIBICAO.get(momento.tom, momento.tom)}",
        f"Relação com seu Selo natal: {NIVEL_RELACAO_EXIBICAO.get(resumo.get('nivel_relacao'), 'não determinada')}.",
    ]
    if resumo.get("nivel_relacao") == "SAME_SEAL" and resumo.get("selo_natal"):
        linhas.append(f"Seu Selo natal também é {SELO_COR_EXIBICAO.get(resumo['selo_natal'], resumo['selo_natal'])}.")
    return {"data": _contexto_cabecalho(momento.data_referencia), "linhas": linhas}


@router.get("/{participante_nome}/presente", response_class=HTMLResponse)
def pagina_presente(request: Request, participante_nome: str, background_tasks: BackgroundTasks):
    """Tela diaria do Alpha (A6) -- so Dreamspell, so hoje, sem
    navegacao temporal livre. Se a LeituraDiaria do dia ainda nao existe,
    enfileira a geracao em background e devolve a tela de carregamento
    (nunca bloqueia a resposta HTTP esperando o Interpretation Engine).
    Visitas subsequentes no mesmo dia encontram a linha ja publicada e
    respondem na hora, sem tocar no modelo de novo."""
    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)
        momento = obter_ou_criar_momento_diario(session, participante)
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)

        leitura = _buscar_leitura_diaria(session, participante.id, momento.data_referencia)
        if leitura is None:
            background_tasks.add_task(
                _gerar_leitura_diaria_em_background, participante.id, momento.id, resultado.id
            )
            return templates.TemplateResponse(request, "presente_carregando.html", {"participante": participante})

        cabecalho_selo_tom = None
        if momento.selo is not None:
            cabecalho_selo_tom = f"{SELO_COR_EXIBICAO[momento.selo]} · {TOM_EXIBICAO[momento.tom]}"

        return templates.TemplateResponse(request, "presente.html", {
            "participante": participante,
            "leitura": leitura,
            "eh_hunab_ku": leitura.status_qa == STATUS_FIXED_HUNAB_KU,
            "hunab_ku_mensagem": HUNAB_KU_MENSAGEM,
            "cabecalho_selo_tom": cabecalho_selo_tom,
            "entender": _contexto_entender_presente(leitura, momento),
        })
    finally:
        session.close()


@router.get("/{participante_nome}/presente/debug", response_class=JSONResponse)
def pagina_presente_debug(participante_nome: str):
    """Modo Alpha/debug do Gate 1/1.5 (CLAUDE.md secao 5, 20/08/2026) --
    expoe o `relationships_checked` completo do Relationship Detector
    (same_seal/same_tone/same_wavespell/same_earth_family/natal_guide|
    analog|antipode|occult_match) e, se a LeituraDiaria de hoje ja existir
    (NAO gera uma nova aqui -- so leitura, pra nao gastar tokens so por
    alguem abrir esta URL), a versao do Interpretation Engine que
    publicou (versao_prompt/status_qa/modelo), pra auditoria/confirmacao
    pos-deploy. NAO e a tela publica: so JSON cru, mesma protecao de
    sessao de qualquer rota /{participante}/... (app/auth.py), sem link
    nenhum na UI. A tela publica (/presente) continua sem mostrar isso --
    so a frase legivel de SAME_SEAL via NIVEL_RELACAO_EXIBICAO."""
    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)
        momento = obter_ou_criar_momento_diario(session, participante)
        resultado = obter_ou_criar_resultado_relevancia(session, participante, momento)
        leitura = _buscar_leitura_diaria(session, participante.id, momento.data_referencia)
        return JSONResponse({
            "data_referencia": momento.data_referencia.isoformat(),
            "kin_hoje": momento.kin,
            "selo_hoje": momento.selo,
            "nivel_relacao": resultado.nivel_relacao,
            "versao_ruleset": resultado.versao_ruleset,
            "relationships_checked": resultado.detalhe.get("relationships_checked"),
            "leitura_publicada": leitura is not None,
            "leitura_versao_prompt": leitura.versao_prompt if leitura is not None else None,
            "leitura_status_qa": leitura.status_qa if leitura is not None else None,
            "leitura_modelo": (leitura.resumo_derivacao or {}).get("modelo") if leitura is not None else None,
        })
    finally:
        session.close()


def _vazio_para_none(valor: str) -> Optional[str]:
    return valor if valor else None


def _montar_respostas_laboratorio(
    permanencia_espontanea: str, qualidade_percepcao: str, vies_confirmacao: str,
    pergunta_abriu_reflexao: str, practice_done: str, practice_experience: str,
    linguagem_estranha: str, linguagem_estranha_detalhe: str, valor_do_dia: str, campo_livre_lab: str,
) -> dict:
    return {
        "permanencia_espontanea": _vazio_para_none(permanencia_espontanea),
        "qualidade_percepcao": _vazio_para_none(qualidade_percepcao),
        "vies_confirmacao": _vazio_para_none(vies_confirmacao),
        "pergunta_abriu_reflexao": _vazio_para_none(pergunta_abriu_reflexao),
        "practice_done": _vazio_para_none(practice_done),
        "practice_experience": _vazio_para_none(practice_experience),
        "linguagem_estranha": _vazio_para_none(linguagem_estranha),
        "linguagem_estranha_detalhe": _vazio_para_none(linguagem_estranha_detalhe),
        "valor_do_dia": _vazio_para_none(valor_do_dia),
        "campo_livre_lab": _vazio_para_none(campo_livre_lab),
    }


@router.get("/{participante_nome}/fechamento", response_class=HTMLResponse)
def pagina_fechamento(request: Request, participante_nome: str):
    """Formulario de fechamento do dia (A7) -- pre-preenchido se ja
    existir uma ReflexaoDiaria pro dia corrente (editar, nao duplicar)."""
    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)
        reflexao = obter_reflexao_diaria(session, participante)
        return templates.TemplateResponse(request, "fechamento.html", {
            "participante": participante,
            "reflexao": reflexao,
            "erro": None,
        })
    finally:
        session.close()


@router.post("/{participante_nome}/fechamento", response_class=HTMLResponse)
def fechamento_submit(
    request: Request,
    participante_nome: str,
    texto_livre: str = Form(""),
    marcador_rapido: str = Form(""),
    permanencia_espontanea: str = Form(""),
    qualidade_percepcao: str = Form(""),
    vies_confirmacao: str = Form(""),
    pergunta_abriu_reflexao: str = Form(""),
    practice_done: str = Form(""),
    practice_experience: str = Form(""),
    linguagem_estranha: str = Form(""),
    linguagem_estranha_detalhe: str = Form(""),
    valor_do_dia: str = Form(""),
    campo_livre_lab: str = Form(""),
):
    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)
        respostas = _montar_respostas_laboratorio(
            permanencia_espontanea, qualidade_percepcao, vies_confirmacao,
            pergunta_abriu_reflexao, practice_done, practice_experience,
            linguagem_estranha, linguagem_estranha_detalhe, valor_do_dia, campo_livre_lab,
        )
        hoje = snapshot_date_hoje(participante.timezone_atual)
        try:
            reflexao = salvar_reflexao_diaria(
                session, participante, hoje,
                texto_livre=_vazio_para_none(texto_livre),
                marcador_rapido=_vazio_para_none(marcador_rapido),
                respostas_laboratorio=respostas,
            )
        except RespostasLaboratorioInvalidas as exc:
            return templates.TemplateResponse(request, "fechamento.html", {
                "participante": participante,
                "reflexao": obter_reflexao_diaria(session, participante),
                "erro": str(exc),
            }, status_code=400)
        except ReflexaoJaCongelada as exc:
            return templates.TemplateResponse(request, "fechamento.html", {
                "participante": participante,
                "reflexao": obter_reflexao_diaria(session, participante),
                "erro": str(exc),
            }, status_code=409)

        return templates.TemplateResponse(request, "fechamento.html", {
            "participante": participante,
            "reflexao": reflexao,
            "erro": None,
            "salvo": True,
        })
    finally:
        session.close()


@router.get("/{participante_nome}/{horizonte}", response_class=HTMLResponse)
def pagina_horizonte(request: Request, participante_nome: str, horizonte: str):
    if horizonte not in TITULOS:
        raise HTTPException(status_code=404, detail="Horizonte não encontrado.")

    session = get_session()
    try:
        participante = _obter_participante(session, participante_nome)

        cards = []

        linha_num = gerar_horizonte(session, participante, NumerologyAdapter(), horizonte)
        cards.append(_card_numerologia(session, linha_num))

        try:
            linha_ds = gerar_horizonte(session, participante, DreamspellAdapter(), horizonte)
            cards.append(_card_dreamspell(session, linha_ds))
        except HorizonteNaoSuportado:
            pass  # Dreamspell nao tem Ano/Mes nativo -- omitido, nao reservado

        try:
            linha_dh = gerar_horizonte(session, participante, HumanDesignAdapter(), horizonte)
            cards.append(_card_design_humano(session, linha_dh))
        except HorizonteNaoSuportado:
            pass  # Design Humano nao tem Ano (decisao final -- Retorno Solar nao adotado)

        # Cabecalho mostra a data civil de HOJE (mesma regra das 03:00),
        # nao a data_referencia em que a linha do horizonte foi congelada
        # -- senao um Ano/Mes/Semana ainda validos mostrariam uma data
        # cada vez mais velha conforme os dias passam dentro do mesmo ciclo.
        hoje = snapshot_date_hoje(participante.timezone_atual)

        return templates.TemplateResponse(request, "horizonte.html", {
            "participante": participante,
            "horizonte_ativo": horizonte,
            "titulo": TITULOS[horizonte],
            "subtitulo": SUBTITULOS[horizonte],
            "contexto_cabecalho": _contexto_cabecalho(hoje),
            "cards": cards,
        })
    finally:
        session.close()
