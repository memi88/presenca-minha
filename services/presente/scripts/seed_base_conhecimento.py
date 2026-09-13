"""
Etapa 6 -- seed de base_conhecimento (Numerologia).

Todo texto abaixo foi escrito pela equipe para este projeto -- nenhuma
frase e copiada do NumWeb ou de qualquer fonte comercial (TECH_RESEARCH.md
secao 6, PRD_v0.1.md secao 8). As tabelas letra->numero e as regras de
calculo (motor) sao fato estrutural do sistema; o texto interpretativo
abaixo e o que a equipe escreveu com linguagem propria.

chave_elemento = "<contexto>:<numero>", porque o mesmo numero tem escopo
diferente em contextos diferentes (Dia Pessoal 1 != Ano Pessoal 1 em
amplitude -- EXPERIENCE_MODEL.md secao 4: horizontes mais amplos pedem
leitura mais estrutural, horizontes mais proximos do presente pedem
leitura mais simples e observavel).

Roda com: python3 -m scripts.seed_base_conhecimento
"""
from app.db.models import BaseConhecimento
from app.db.session import get_session

FONTE = "Numerologia pitagórica/cabalística tradicional — síntese e redação próprias da equipe"

TEXTOS = {
    "destino": {
        1: "Um caminho voltado para iniciativa e autonomia — construir a própria direção em vez de seguir a de outros.",
        2: "Um caminho que aprende pela cooperação — parcerias, escuta e sensibilidade ao outro como eixo central.",
        3: "Um caminho de expressão — comunicar, criar e dar forma visível ao que normalmente fica só na ideia.",
        4: "Um caminho de construção — método, constância e a paciência de erguer algo que dure.",
        5: "Um caminho de movimento — variedade, mudança de rota e liberdade como condição de crescimento.",
        6: "Um caminho de cuidado — responsabilidade por pessoas, lar e comunidade como centro de gravidade.",
        7: "Um caminho de investigação — questionar, estudar e buscar entendimento antes de aceitar respostas prontas.",
        8: "Um caminho de realização material e autoridade — aprender a lidar com poder, recursos e escala.",
        9: "Um caminho de encerramento e generosidade — soltar o que já cumpriu seu papel, olhar para o coletivo.",
        11: "Um caminho amplificado de intuição e inspiração — carrega mais volume emocional e sensibilidade que a média.",
        22: "Um caminho de construção em grande escala — visão prática somada a ambição de longo alcance.",
    },
    "expressao": {
        1: "Expressa-se por iniciativa própria — tende a liderar, propor e abrir caminho antes de esperar.",
        2: "Expressa-se pela sensibilidade e mediação — talento natural para equilibrar e aproximar pessoas.",
        3: "Expressa-se pela comunicação — palavra, imagem ou som como ferramenta natural de contato.",
        4: "Expressa-se pela organização — traz ordem e método a qualquer contexto em que atua.",
        5: "Expressa-se pela versatilidade — adapta-se rápido e busca estímulo em coisas novas.",
        6: "Expressa-se pelo cuidado — presença que acolhe, orienta e assume responsabilidade pelos outros.",
        7: "Expressa-se pela análise — observa antes de agir, prefere entender a fundo.",
        8: "Expressa-se pela ambição prática — mira resultado, estrutura e reconhecimento concreto.",
        9: "Expressa-se pela amplitude — pensa em termos coletivos, generosos, além do interesse imediato.",
    },
    "motivacao": {
        1: "Motivado por autonomia — o que move por dentro é não depender de ninguém para agir.",
        2: "Motivado por conexão — o que move por dentro é sentir-se parte de algo com alguém.",
        3: "Motivado por reconhecimento e alegria — o que move por dentro é ser visto e apreciado.",
        4: "Motivado por segurança — o que move por dentro é ter base sólida e previsível.",
        5: "Motivado por liberdade — o que move por dentro é não ficar preso a uma única rota.",
        6: "Motivado por pertencimento — o que move por dentro é cuidar e ser útil a quem ama.",
        7: "Motivado por compreensão — o que move por dentro é entender o que está por trás das coisas.",
        8: "Motivado por conquista — o que move por dentro é ver esforço virar resultado tangível.",
        9: "Motivado por significado — o que move por dentro é sentir que o que faz importa além de si.",
    },
    "missao": {
        1: "Uma missão de abrir caminho — usar iniciativa própria a serviço de algo maior que só o indivíduo.",
        2: "Uma missão de unir — aplicar sensibilidade e escuta para aproximar o que estava separado.",
        3: "Uma missão de comunicar — dar forma e alcance público a algo que merece ser visto.",
        4: "Uma missão de sustentar — construir estrutura que outros possam usar como base.",
        5: "Uma missão de libertar — abrir possibilidades novas onde antes só havia rotina fixa.",
        6: "Uma missão de cuidar em escala — estender responsabilidade e presença além do círculo mais próximo.",
        7: "Uma missão de aprofundar — levar entendimento mais rigoroso a um tema ou comunidade.",
        8: "Uma missão de organizar recursos — usar capacidade de realização a favor de algo coletivo.",
        9: "Uma missão de servir o todo — colocar generosidade e visão ampla a serviço de mais gente.",
    },
    "ano_pessoal": {
        1: "Ano de começar — plantar sementes novas, tomar iniciativa, abrir uma frente que ainda não existia.",
        2: "Ano de construir em parceria — paciência, escuta e cooperação rendem mais que pressa.",
        3: "Ano de expressar — bom momento para comunicar, socializar e dar visibilidade ao que já existe.",
        4: "Ano de estruturar — trabalho de base, organização e disciplina, mesmo sem resultado imediato visível.",
        5: "Ano de mudança — variação de rotina, viagens, decisões que reorganizam o que estava fixo.",
        6: "Ano de responsabilidade — família, casa e compromissos pedem mais atenção e presença.",
        7: "Ano de recolhimento — momento mais interno, de estudo, revisão e menos exposição externa.",
        8: "Ano de colheita material — resultado de esforços anteriores tende a aparecer de forma concreta.",
        9: "Ano de fechamento — encerrar ciclos, soltar o que não serve mais, antes de recomeçar.",
    },
    "mes_pessoal": {
        1: "Mês de iniciativa — bom momento para dar o primeiro passo em algo que estava parado.",
        2: "Mês de cooperação — parcerias e diplomacia rendem mais que insistir sozinho.",
        3: "Mês de comunicação — conversas, encontros e trocas tendem a fluir com mais facilidade.",
        4: "Mês de organização — colocar ordem em tarefas e compromissos pendentes.",
        5: "Mês de movimento — imprevistos ou mudanças de plano pedem flexibilidade.",
        6: "Mês de cuidado — atenção redobrada a casa, família e responsabilidades próximas.",
        7: "Mês de pausa reflexiva — menos ação externa, mais espaço para pensar antes de decidir.",
        8: "Mês de resultado — esforço colocado em prática tende a aparecer de forma mais visível.",
        9: "Mês de encerramento — bom momento para concluir pendências antes de abrir algo novo.",
    },
    "dia_pessoal": {
        1: "Dia que favorece dar o primeiro passo — iniciativa rende mais que esperar.",
        2: "Dia que favorece parceria — ouvir e ceder um pouco tende a facilitar as coisas.",
        3: "Dia que favorece comunicação — boa hora para uma conversa ou algo criativo.",
        4: "Dia que favorece organização — colocar ordem no que está disperso.",
        5: "Dia que favorece imprevistos — planos podem mudar de rota sem aviso.",
        6: "Dia que favorece cuidado — alguém próximo pode pedir atenção.",
        7: "Dia que favorece introspecção — menos ruído externo, mais espaço para pensar.",
        8: "Dia que favorece resultado prático — esforço tende a virar algo concreto.",
        9: "Dia que favorece fechar pontas — bom momento para concluir, não para começar.",
        11: "Dia com sensibilidade amplificada — intuição mais forte que o normal, vale prestar atenção nela.",
        22: "Dia que favorece pensar grande com os pés no chão — visão de longo prazo aplicada a algo prático.",
    },
}


def seed():
    session = get_session()
    n_new = n_updated = 0
    try:
        for contexto, numeros in TEXTOS.items():
            for numero, texto in numeros.items():
                chave = f"{contexto}:{numero}"
                existente = (
                    session.query(BaseConhecimento)
                    .filter_by(sistema="numerologia", tipo_elemento="numero", chave_elemento=chave)
                    .first()
                )
                if existente:
                    if existente.texto_curado != texto:
                        existente.texto_curado = texto
                        n_updated += 1
                else:
                    session.add(BaseConhecimento(
                        sistema="numerologia", tipo_elemento="numero", chave_elemento=chave,
                        texto_curado=texto, fonte_de_estudo=FONTE,
                    ))
                    n_new += 1
        session.commit()
        total = sum(len(v) for v in TEXTOS.values())
        print(f"base_conhecimento: {n_new} novas, {n_updated} atualizadas, {total} no total esperado.")
    finally:
        session.close()


if __name__ == "__main__":
    seed()
