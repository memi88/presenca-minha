"""
relationship_detector.py

Gate 1 (CLAUDE.md secao 5, aberto 20/08/2026) -- Dreamspell Structural
Relationships. Responsabilidade UNICA: "que relacoes estruturalmente
verdadeiras existem entre o Selo/Tom natal de um participante e o
Selo/Tom do MomentoDiario de hoje?"

Este modulo e o Relationship Detector puro e determinístico. Ele
NAO decide se uma relacao e relevante o suficiente pra entrar no
Presente de hoje (isso e o Relevance Engine, app/alpha/relevance.py) e
NAO gera nenhuma interpretacao/narrativa (isso e o Interpretation
Engine, app/alpha/interpretation.py). Ver CLAUDE.md secao 7/9: separar
"existe uma relacao estrutural documentada?" de "essa relacao autoriza
personalizacao?" e de "como isso vira experiencia humana?".

Todas as formulas (Familia Terrestre, Guia, Analogo, Antipoda, Oculto)
vivem em app/engines/dreamspell_engine.py -- fonte deterministica UNICA,
nao duplicada aqui. Este modulo so orquestra: pega o Kin natal e o Kin
de hoje, chama o motor pros dois lados, e monta o dicionario de fatos.

As quatro relacoes de Oraculo (guide/analog/antipode/occult) sao
SELO-A-SELO: comparam o Selo de hoje com a POSICAO do oraculo natal
(ex.: natal_antipode_seal e o Selo antipoda do Kin natal; o "match" e
selo_hoje == natal_antipode_seal). Essa e a convencao tradicional do
"Galactic Signature" oracle (Fifth Force Oracle, lawoftime.org) -- nao
compara Kin completo (Selo+Tom), so Selo.

Hunab Ku 0.0 (kin_hoje=None): mesmo padrao de None-safety de
app/alpha/relevance.py -- todas as comparacoes viram False explicitamente
(nunca uma excecao), mas o natal_* (posicoes do oraculo natal, que nao
dependem de hoje) continua sendo calculado e devolvido -- e informacao
pura do participante, nao do dia."""
from dataclasses import asdict, dataclass
from typing import Optional

from app.engines.dreamspell_engine import (
    analog_seal,
    antipode_seal,
    earth_family_of,
    full_reading,
    guide_seal,
    occult_seal,
)


@dataclass(frozen=True)
class RelacoesEstruturais:
    same_seal: bool
    same_tone: bool
    same_wavespell: bool
    same_earth_family: bool
    natal_guide_seal: str
    natal_guide_match: bool
    natal_analog_seal: str
    natal_analog_match: bool
    natal_antipode_seal: str
    natal_antipode_match: bool
    natal_occult_seal: str
    natal_occult_match: bool

    def to_dict(self) -> dict:
        return asdict(self)


def detectar_relacoes_estruturais(kin_natal: int, kin_hoje: Optional[int]) -> RelacoesEstruturais:
    """Pura, sem efeitos colaterais, sem sessao de banco. `kin_natal` vem
    de PerfilNatalDreamspell.kin (sempre presente se o perfil existe);
    `kin_hoje` vem de MomentoDiario.kin (None em Hunab Ku 0.0)."""
    natal = full_reading(kin_natal)
    natal_guide = guide_seal(natal.seal, natal.tone_number)
    natal_analog = analog_seal(natal.seal)
    natal_antipode = antipode_seal(natal.seal)
    natal_occult = occult_seal(natal.seal)

    if kin_hoje is None:
        return RelacoesEstruturais(
            same_seal=False,
            same_tone=False,
            same_wavespell=False,
            same_earth_family=False,
            natal_guide_seal=natal_guide,
            natal_guide_match=False,
            natal_analog_seal=natal_analog,
            natal_analog_match=False,
            natal_antipode_seal=natal_antipode,
            natal_antipode_match=False,
            natal_occult_seal=natal_occult,
            natal_occult_match=False,
        )

    hoje = full_reading(kin_hoje)
    return RelacoesEstruturais(
        same_seal=hoje.seal == natal.seal,
        same_tone=hoje.tone_number == natal.tone_number,
        same_wavespell=hoje.wavespell_seal == natal.wavespell_seal,
        same_earth_family=earth_family_of(hoje.seal) == earth_family_of(natal.seal),
        natal_guide_seal=natal_guide,
        natal_guide_match=hoje.seal == natal_guide,
        natal_analog_seal=natal_analog,
        natal_analog_match=hoje.seal == natal_analog,
        natal_antipode_seal=natal_antipode,
        natal_antipode_match=hoje.seal == natal_antipode,
        natal_occult_seal=natal_occult,
        natal_occult_match=hoje.seal == natal_occult,
    )
