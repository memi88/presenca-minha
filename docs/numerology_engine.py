"""
numerology_engine.py

Motor de Numerologia — regras confirmadas por engenharia reversa contra o
GOLDEN_PROFILE_GUILHERME.md.

STATUS GERAL: ENGINE_MATCH para os campos marcados como CONFIRMADO.
Ver ENGINE_VALIDATION.md para a tabela completa de status por campo.

REGRA CONFIRMADA (achado principal da fase de validação):
A tabela letra->numero usada pela referencia NAO e a tabela Pitagorica
classica (A-Z sequencial 1-9) nem uma numerologia cabalistica baseada no
alfabeto hebraico. E a tabela Caldeia / NCT (Numerologia Cabalistica
Tradicional popular no Brasil): valores de 1 a 8, sem o numero 9.

Isso foi confirmado reproduzindo Expressao=3, Motivacao=1, Impressao=2 do
Golden Profile -- nenhuma outra tabela testada (Pitagorica, com ou sem
particulas) reproduziu os tres valores simultaneamente.
"""
import unicodedata
from dataclasses import dataclass, field
from typing import List, Optional


# ---------------------------------------------------------------------------
# Tabela letra -> numero (CONFIRMADA: Caldeia / NCT)
# ---------------------------------------------------------------------------
CHALDEAN_NCT_TABLE = {
    'A': 1, 'I': 1, 'J': 1, 'Q': 1, 'Y': 1,
    'B': 2, 'K': 2, 'R': 2,
    'C': 3, 'G': 3, 'L': 3, 'S': 3,
    'D': 4, 'M': 4, 'T': 4,
    'E': 5, 'H': 5, 'N': 5, 'X': 5,
    'U': 6, 'V': 6, 'W': 6,
    'O': 7, 'Z': 7,
    'F': 8, 'P': 8,
    # nota estrutural: nenhuma letra recebe o valor 9 nesta tabela.
    # Isso faz com que 9 apareca quase sempre como "Licao Carmica" (numero
    # ausente) -- e uma propriedade da TABELA, nao um tracaco pessoal raro.
}

VOWELS = set('AEIOU')
KARMIC_DEBT_NUMBERS = {13, 14, 16, 19}


def strip_accents(s: str) -> str:
    return ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn')


def letters_only(name: str, keep_particles: bool = True) -> List[str]:
    """CONFIRMADO para o caso testado: particulas como 'dos' SAO mantidas no
    calculo. (Confirmado apenas com um nome -- revalidar com um segundo
    participante antes de generalizar para nomes com 'de'/'da' em outras
    posicoes.)"""
    s = name
    if not keep_particles:
        words = [w for w in s.split() if w.lower() not in ('dos', 'das', 'de', 'da', 'e')]
        s = ' '.join(words)
    s = strip_accents(s)
    return [c.upper() for c in s if c.isalpha()]


def digit_sum(n: int) -> int:
    return sum(int(d) for d in str(n))


def reduce_full(n: int) -> int:
    """Reducao total a um digito. CONFIRMADO: Motivacao/Impressao/Expressao
    NAO preservam 11/22 -- reduzem sempre ate um digito unico (evidencia:
    Impressao bruta=47 -> 11 -> 2; o Golden Profile espera 2, nao 11)."""
    while n > 9:
        n = digit_sum(n)
    return n


def reduce_preserve_master(n: int) -> int:
    """Reducao preservando 11/22/33. Usado onde ainda NAO ha evidencia de
    que a referencia sempre reduz totalmente (ex.: Destino, Ano Pessoal).
    Ver ENGINE_VALIDATION.md: nenhum numero mestre apareceu nesses campos
    para o Golden Profile, entao esta escolha permanece nao testada."""
    while n > 9:
        if n in (11, 22, 33):
            return n
        n = digit_sum(n)
    return n


def value_sum(letters: List[str], table=CHALDEAN_NCT_TABLE) -> int:
    return sum(table[c] for c in letters if c in table)


@dataclass
class NumerologyNatalResult:
    dia_natalicio: int
    numero_psiquico: int
    motivacao: int
    impressao: int
    expressao: int
    destino: int
    missao: int
    licoes_carmicas: List[int]
    tendencias_ocultas: List[int]
    resposta_subconsciente: int
    ciclos_de_vida: List[int]
    desafios: List[int]
    momentos_decisivos: List[int]
    talento_oculto_hipotese: Optional[int] = None   # PENDENTE
    debitos_carmicos: Optional[List[int]] = None    # PENDENTE (nao resolvido)


def compute_natal(name: str, day: int, month: int, year: int) -> NumerologyNatalResult:
    letters = letters_only(name, keep_particles=True)
    vowels = [c for c in letters if c in VOWELS]
    consonants = [c for c in letters if c not in VOWELS]

    expressao = reduce_full(value_sum(letters))
    motivacao = reduce_full(value_sum(vowels))
    impressao = reduce_full(value_sum(consonants))

    dia_natalicio = day
    numero_psiquico = reduce_full(day)

    destino_raw = digit_sum(day) + digit_sum(month) + digit_sum(year)
    destino = reduce_full(destino_raw)

    missao = reduce_full(destino + expressao)

    from collections import Counter
    values = [CHALDEAN_NCT_TABLE[c] for c in letters if c in CHALDEAN_NCT_TABLE]
    counts = Counter(values)
    licoes_carmicas = [n for n in range(1, 10) if counts.get(n, 0) == 0]
    # CONFIRMADO: limiar = aparece 4 OU MAIS vezes (nao 3+)
    tendencias_ocultas = [n for n in range(1, 10) if counts.get(n, 0) >= 4]
    resposta_subconsciente = 9 - len(licoes_carmicas)

    c1 = reduce_full(month)
    c2 = reduce_full(day)
    c3 = reduce_full(year)
    ciclos_de_vida = [c1, c2, c3]

    d1 = abs(c1 - c2)
    d2 = abs(c2 - c3)
    d_principal = abs(d1 - d2)
    desafios = [d1, d2, d_principal]

    p1 = reduce_full(c1 + c2)
    p2 = reduce_full(c2 + c3)
    p3 = reduce_full(p1 + p2)
    p4 = reduce_full(c1 + c3)
    momentos_decisivos = [p1, p2, p3, p4]

    # PENDENTE: hipotese nao confirmada (apenas 1 ponto de dado disponivel)
    talento_oculto_hipotese = abs(destino - motivacao)

    return NumerologyNatalResult(
        dia_natalicio=dia_natalicio,
        numero_psiquico=numero_psiquico,
        motivacao=motivacao,
        impressao=impressao,
        expressao=expressao,
        destino=destino,
        missao=missao,
        licoes_carmicas=licoes_carmicas,
        tendencias_ocultas=tendencias_ocultas,
        resposta_subconsciente=resposta_subconsciente,
        ciclos_de_vida=ciclos_de_vida,
        desafios=desafios,
        momentos_decisivos=momentos_decisivos,
        talento_oculto_hipotese=talento_oculto_hipotese,
        debitos_carmicos=None,  # NAO RESOLVIDO -- ver ENGINE_VALIDATION.md
    )


def ano_pessoal(birth_day: int, birth_month: int, target_year: int) -> int:
    """CONFIRMADO contra a regra de transicao de Mes Pessoal no aniversario."""
    return reduce_full(digit_sum(birth_day) + digit_sum(birth_month) + digit_sum(target_year))


def mes_pessoal(birth_day: int, birth_month: int, ref_date_year: int, ref_date_month: int, ref_date_day: int) -> int:
    """CONFIRMADO: usa o ano-referencia do ciclo (ano civil corrente se o
    aniversario ja passou nesse ano civil, senao ano civil anterior)."""
    already_had_birthday_this_year = (ref_date_month, ref_date_day) >= (birth_month, birth_day)
    cycle_year = ref_date_year if already_had_birthday_this_year else ref_date_year - 1
    ap = ano_pessoal(birth_day, birth_month, cycle_year)
    return reduce_full(ap + ref_date_month)


def dia_pessoal(birth_day: int, birth_month: int, ref_date_year: int, ref_date_month: int, ref_date_day: int) -> int:
    """CONFIRMADO pela equipe/documentacao da fonte (decisao registrada em
    ENGINE_VALIDATION.md): Dia Pessoal = Mes Pessoal + dia atual, reduzido
    PRESERVANDO 11/22 quando aplicavel -- ao contrario de Motivacao/
    Impressao/Expressao, que nunca preservam numero mestre.

    NOTA: nao ha, no GOLDEN_PROFILE_GUILHERME.md, um valor numerico de
    referencia para uma data especifica -- a confirmacao veio da
    documentacao da fonte (NumWeb), nao de um teste automatizado contra um
    numero conhecido. Recomenda-se adicionar um caso de teste numerico ao
    Golden Profile assim que houver um disponivel."""
    mp = mes_pessoal(birth_day, birth_month, ref_date_year, ref_date_month, ref_date_day)
    return reduce_preserve_master(mp + ref_date_day)
