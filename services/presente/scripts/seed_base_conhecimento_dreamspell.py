"""
Etapa 7 -- seed de base_conhecimento (Dreamspell): 20 selos + 13 tons.

Texto escrito pela equipe -- nao reproduz o material da Foundation for the
Law of Time nem de nenhuma fonte comercial (TECH_RESEARCH.md secao 6). As
chaves usam os nomes ASCII exatamente como app/engines/dreamspell_engine.py
produz (SEALS/TONES), para o lookup bater sem normalizacao extra.

Roda com: python3 -m scripts.seed_base_conhecimento_dreamspell
"""
from app.db.models import BaseConhecimento
from app.db.session import get_session

FONTE = "Sincronário do Dreamspell (José Argüelles) — síntese e redação próprias da equipe"

SELOS = {
    "Dragao": "Nutrição e memória ancestral — o impulso de gerar e cuidar desde a origem.",
    "Vento": "Comunicação e espírito — a palavra como sopro que carrega uma mensagem.",
    "Noite": "Sonho e intuição — o espaço escuro onde a intenção ainda não tem forma definida.",
    "Semente": "Potencial e florescimento — o ponto de partida de algo que ainda vai crescer.",
    "Serpente": "Força vital e instinto — energia que atravessa o corpo e pede ação direta.",
    "Enlacador de Mundos": "Travessia e conexão entre planos — o que atravessa limites e liga extremos.",
    "Mao": "Realização e cura — a capacidade de tocar e transformar algo com as próprias mãos.",
    "Estrela": "Harmonia e beleza — refinamento de arte, forma e graça.",
    "Lua": "Fluxo emocional e purificação — o que precisa de espaço para se mover e se refazer.",
    "Cao": "Lealdade e coração — afeto que sustenta vínculo e confiança.",
    "Macaco": "Brincadeira e magia — a capacidade de criar algo novo pela leveza, não pelo esforço.",
    "Humano": "Livre-arbítrio e sabedoria prática — decisão consciente sobre o próprio caminho.",
    "Caminhante do Ceu": "Exploração e espaço — o impulso de ir além do território já conhecido.",
    "Mago": "Atemporalidade e encantamento — presença que suspende o ritmo comum do tempo.",
    "Aguia": "Visão ampla — capacidade de ver o conjunto de cima, com perspectiva.",
    "Guerreiro": "Coragem questionadora — inteligência que avança mesmo sem todas as respostas prontas.",
    "Terra": "Sincronicidade e navegação — sensibilidade a sinais e ao que se alinha naturalmente.",
    "Espelho": "Reflexo e verdade sem filtro — o que mostra as coisas exatamente como são.",
    "Tempestade": "Transformação rápida — energia que quebra estrutura velha para abrir espaço novo.",
    "Sol": "Iluminação e plenitude — fechamento de ciclo com consciência ampliada.",
}

TONS = {
    1: "Magnético — unificar; o primeiro passo, o que atrai o propósito de algo novo.",
    2: "Lunar — polarizar; o momento em que a diferença entre opções fica mais clara.",
    3: "Elétrico — ativar; energia que liga uma coisa à outra e coloca em movimento.",
    4: "Auto-Existente — definir; dar forma e estrutura concreta a uma intenção.",
    5: "Overtonal — comandar; poder de irradiar, tornar algo visível com mais intensidade.",
    6: "Rítmico — equilibrar; encontrar o passo constante que sustenta um processo.",
    7: "Ressonante — sintonizar; alinhar-se ao que já está em harmonia, inspirar-se nisso.",
    8: "Galáctico — harmonizar; unir partes diferentes num todo coerente.",
    9: "Solar — pulsar; o momento em que uma intenção se cumpre.",
    10: "Planetário — perfeiçoar; produzir o resultado concreto de um ciclo.",
    11: "Espectral — dissolver; soltar o que não serve mais para abrir espaço.",
    12: "Cristal — cooperar; colocar-se a serviço de algo compartilhado.",
    13: "Cósmico — transcender; um tom que carrega o ciclo inteiro em si, presença ampliada.",
}


def seed():
    session = get_session()
    n_new = n_updated = 0
    try:
        for nome, texto in SELOS.items():
            existente = session.query(BaseConhecimento).filter_by(
                sistema="dreamspell", tipo_elemento="selo", chave_elemento=nome
            ).first()
            if existente:
                if existente.texto_curado != texto:
                    existente.texto_curado = texto
                    n_updated += 1
            else:
                session.add(BaseConhecimento(
                    sistema="dreamspell", tipo_elemento="selo", chave_elemento=nome,
                    texto_curado=texto, fonte_de_estudo=FONTE,
                ))
                n_new += 1

        for numero, texto in TONS.items():
            chave = str(numero)
            existente = session.query(BaseConhecimento).filter_by(
                sistema="dreamspell", tipo_elemento="tom", chave_elemento=chave
            ).first()
            if existente:
                if existente.texto_curado != texto:
                    existente.texto_curado = texto
                    n_updated += 1
            else:
                session.add(BaseConhecimento(
                    sistema="dreamspell", tipo_elemento="tom", chave_elemento=chave,
                    texto_curado=texto, fonte_de_estudo=FONTE,
                ))
                n_new += 1

        session.commit()
        total = len(SELOS) + len(TONS)
        print(f"base_conhecimento (dreamspell): {n_new} novas, {n_updated} atualizadas, {total} no total esperado.")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
