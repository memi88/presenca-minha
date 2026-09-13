"""
Etapa 8 -- seed de base_conhecimento (Design Humano): 64 gates (nucleo,
sem profundidade de linha -- PRD_v0.1.md secao 8 marca linha como
"profundidade opcional") + 5 Tipos + 7 Autoridades.

Texto escrito pela equipe, em linguagem propria -- NAO reproduz as
keynotes da Jovian Archive (TECH_RESEARCH.md secao 6, restricao de IP).
Os gates de Design Humano correspondem 1-para-1 aos 64 hexagramas do
I Ching na numeracao tradicional (dominio publico) -- os temas abaixo
partem dessas referencias classicas, redigidos com vocabulario proprio,
nao do glossario comercial de Design Humano.

Roda com: python3 -m scripts.seed_base_conhecimento_design_humano
"""
from app.db.models import BaseConhecimento
from app.db.session import get_session

FONTE = "Temas classicos dos 64 hexagramas do I Ching (dominio público) — síntese e redação próprias da equipe, sem uso do glossário comercial de Design Humano"

GATES = {
    1: "Força criativa pura — o impulso de iniciar algo a partir de si mesmo.",
    2: "Receptividade — dar forma e direção ao que já existe, em vez de criar do zero.",
    3: "Início difícil — organizar o caos do começo de algo novo.",
    4: "Aprendizado por tentativa — formar entendimento através de erro e repetição.",
    5: "Espera — paciência, aguardar o momento certo antes de agir.",
    6: "Conflito — tensão entre posições que pede resolução.",
    7: "Liderança de grupo — dar direção coletiva, organizar pessoas em torno de um rumo.",
    8: "Contribuição — buscar afinidade, unir-se a outros por um propósito compartilhado.",
    9: "Acúmulo em pequenas doses — juntar força aos poucos, sem pressa.",
    10: "Conduta — como caminhar com integridade em meio aos outros.",
    11: "Harmonia de ideias — pensamentos que fluem e se conectam com facilidade.",
    12: "Obstrução — discernir quando recuar em vez de insistir.",
    13: "Comunidade — reunir pessoas em torno de um propósito comum.",
    14: "Abundância — administrar recursos e poder com responsabilidade.",
    15: "Equilíbrio discreto — moderar extremos, evitar excesso.",
    16: "Entusiasmo — energia que contagia e mobiliza quem está por perto.",
    17: "Adesão — saber quando seguir uma direção já traçada por outra pessoa.",
    18: "Correção — consertar o que se deteriorou com o tempo.",
    19: "Aproximação — avanço gradual em direção a algo ou alguém.",
    20: "Observação presente — ver com clareza antes de agir.",
    21: "Decisão firme — remover com determinação o que atrapalha.",
    22: "Elegância — refinamento na forma de se expressar.",
    23: "Deterioração — reconhecer quando algo está se desfazendo.",
    24: "Retorno — voltar a um ponto conhecido e recomeçar de outro jeito.",
    25: "Espontaneidade — agir a partir do impulso genuíno, sem cálculo.",
    26: "Retenção de força — acumular poder pessoal com disciplina.",
    27: "Nutrição — o que sustenta e alimenta ao longo do tempo.",
    28: "Tensão além do limite — peso que exige cuidado redobrado.",
    29: "Perigo repetido — atravessar dificuldade com constância.",
    30: "Clareza luminosa — o que ilumina e prende a atenção.",
    31: "Influência mútua — atrair pelo magnetismo, não pela imposição.",
    32: "Constância — o que se sustenta e se prova ao longo do tempo.",
    33: "Recuo estratégico — saber se afastar no momento certo.",
    34: "Força manifesta — poder que precisa de direção consciente para não virar excesso.",
    35: "Progresso reconhecido — crescimento que se confirma passo a passo.",
    36: "Luz oculta — manter integridade num ambiente que não favorece.",
    37: "Estrutura familiar — papéis e vínculos que sustentam um grupo.",
    38: "Divergência — diferença de visão que ainda convive lado a lado.",
    39: "Obstáculo — encontrar rota alternativa diante de um bloqueio.",
    40: "Alívio — soltar tensão depois de um esforço grande.",
    41: "Redução — simplificar retirando o que é supérfluo.",
    42: "Crescimento — expandir aproveitando um momento favorável.",
    43: "Ruptura clara — romper com algo de forma definitiva.",
    44: "Encontro inesperado — o que aparece sem ter sido buscado.",
    45: "Agrupamento — juntar pessoas ou recursos em torno de um centro comum.",
    46: "Ascensão gradual — subir de posição com esforço constante.",
    47: "Exaustão — atravessar limitação sem perder a própria essência.",
    48: "Fonte profunda — recurso que abastece de forma contínua.",
    49: "Revisão de princípios — repensar o que rege uma relação ou acordo.",
    50: "Transformação — refinar algo bruto até virar sustento.",
    51: "Choque que desperta — evento que reorganiza a atenção de repente.",
    52: "Quietude — parar por completo para ver com clareza.",
    53: "Desenvolvimento gradual — progresso passo a passo, sem atalho.",
    54: "Papel definido por outro — agir dentro de uma posição estabelecida externamente.",
    55: "Plenitude — o auge de um ciclo, luz no seu ponto mais alto.",
    56: "Trânsito — movimento sem raiz fixa, uma passagem.",
    57: "Influência gradual — o que entra devagar e se instala aos poucos.",
    58: "Satisfação compartilhada — alegria que se comunica entre pessoas.",
    59: "Dissolver barreiras — unir o que estava fragmentado.",
    60: "Limite necessário — conter para dar forma a algo.",
    61: "Verdade interior — sinceridade que não depende de prova externa.",
    62: "Cautela nos detalhes — atenção ao pequeno em vez do grandioso.",
    63: "Ordem já estabelecida — cuidado para manter o que foi conquistado.",
    64: "Transição final — quase lá, ainda pede atenção até o fim.",
}

TIPOS = {
    "Gerador Manifestante": "Energia de resposta com aceleração — quando o sim está claro, o movimento tende a ser rápido e direto.",
    "Gerador": "Energia de resposta constante — o sacral responde ao que é perguntado, sustento para trabalho contínuo.",
    "Manifestador": "Energia de iniciativa — inicia por conta própria, impacto que se espalha antes de pedir permissão.",
    "Projetor": "Energia de direção — vê o sistema de fora, funciona melhor quando reconhecido e convidado.",
    "Refletor": "Energia de espelho — reflete o ambiente ao redor, cada dia pode parecer diferente.",
}

AUTORIDADES = {
    "Plexo Solar (Emocional)": "Clareza chega em onda — decisão amadurece com o tempo, não no calor do momento.",
    "Sacral": "Resposta imediata do corpo — o sim/não do sacral aparece na hora, sem precisar pensar muito.",
    "Baço (Esplenica)": "Intuição instantânea — um sinal sutil e rápido, que não se repete se for ignorado.",
    "Coração (Ego)": "Vontade e valor pessoal — decisão ligada ao que vale o esforço e o compromisso.",
    "G Auto-Projetado": "Direção que vem da própria identidade — clareza aparece falando em voz alta sobre o assunto.",
    "Mental (Ambiental / Nenhuma)": "Clareza vem de fora — processar em voz alta com outras pessoas ou em ambientes diferentes.",
    "Lunar (Refletor)": "Clareza ao longo de um ciclo lunar inteiro — decisões grandes pedem tempo, não pressa.",
}


def _upsert(session, sistema, tipo_elemento, chave_elemento, texto):
    existente = session.query(BaseConhecimento).filter_by(
        sistema=sistema, tipo_elemento=tipo_elemento, chave_elemento=chave_elemento
    ).first()
    if existente:
        if existente.texto_curado != texto:
            existente.texto_curado = texto
            return "updated"
        return "unchanged"
    session.add(BaseConhecimento(
        sistema=sistema, tipo_elemento=tipo_elemento, chave_elemento=chave_elemento,
        texto_curado=texto, fonte_de_estudo=FONTE,
    ))
    return "new"


def seed():
    session = get_session()
    contagem = {"new": 0, "updated": 0, "unchanged": 0}
    try:
        for gate, texto in GATES.items():
            contagem[_upsert(session, "design_humano", "gate", str(gate), texto)] += 1
        for tipo, texto in TIPOS.items():
            contagem[_upsert(session, "design_humano", "tipo", tipo, texto)] += 1
        for autoridade, texto in AUTORIDADES.items():
            contagem[_upsert(session, "design_humano", "autoridade", autoridade, texto)] += 1

        session.commit()
        total = len(GATES) + len(TIPOS) + len(AUTORIDADES)
        print(f"base_conhecimento (design_humano): {contagem['new']} novas, "
              f"{contagem['updated']} atualizadas, {total} no total esperado.")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
