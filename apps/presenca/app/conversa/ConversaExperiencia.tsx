"use client";

import { useEffect, useRef, useState } from "react";

import { guardarNoDiario } from "./actions";
import styles from "./page.module.css";

type Papel = "user" | "assistant";
type Mensagem = { id: string; role: Papel; content: string };

type LinhaStream =
  | { tipo: "texto"; delta: string }
  | { tipo: "risco" }
  | { tipo: "fim" }
  | { tipo: "erro"; mensagem: string };

const SEGUNDOS_ATE_REDIRECT = 5;

export function ConversaExperiencia() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [risco, setRisco] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());
  const listaRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    listaRef.current?.scrollTo({ top: listaRef.current.scrollHeight, behavior: "smooth" });
  }, [mensagens]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const conteudo = texto.trim();
    if (!conteudo || enviando) return;

    setErro(null);
    setTexto("");

    const minhaMensagem: Mensagem = { id: crypto.randomUUID(), role: "user", content: conteudo };
    const assistenteId = crypto.randomUUID();
    // Histórico enviado ao servidor — nunca inclui o placeholder do
    // assistente ainda vazio, só o que já foi trocado de fato.
    const historico = [...mensagens, minhaMensagem];
    setMensagens([...historico, { id: assistenteId, role: "assistant", content: "" }]);
    setEnviando(true);

    try {
      const resposta = await fetch("/api/conversa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: historico.map(({ role, content }) => ({ role, content })),
        }),
      });

      if (!resposta.ok || !resposta.body) {
        setErro("Algo não funcionou. Tenta de novo em instantes.");
        return;
      }

      const leitor = resposta.body.getReader();
      const decoder = new TextDecoder();
      let bufer = "";

      while (true) {
        const { done, value } = await leitor.read();
        if (done) break;
        bufer += decoder.decode(value, { stream: true });
        const linhas = bufer.split("\n");
        bufer = linhas.pop() ?? "";

        for (const linha of linhas) {
          if (!linha.trim()) continue;
          const evento: LinhaStream = JSON.parse(linha);

          if (evento.tipo === "texto") {
            setMensagens((atual) =>
              atual.map((m) => (m.id === assistenteId ? { ...m, content: m.content + evento.delta } : m)),
            );
          } else if (evento.tipo === "risco") {
            setRisco(true);
          } else if (evento.tipo === "erro") {
            setErro(evento.mensagem);
          }
        }
      }
    } catch {
      setErro("Algo não funcionou. Tenta de novo em instantes.");
    } finally {
      setEnviando(false);
    }
  }

  async function guardar(mensagem: Mensagem) {
    if (guardadas.has(mensagem.id) || !mensagem.content) return;
    setGuardadas((atual) => new Set(atual).add(mensagem.id));
    await guardarNoDiario(mensagem.content);
  }

  if (risco) {
    return <CardTransicaoRisco />;
  }

  const aguardandoPrimeiroToken = enviando && mensagens.at(-1)?.content === "";

  return (
    <>
      <div className={styles.lista} ref={listaRef}>
        {mensagens.length === 0 && <p className={styles.vazio}>Chegou. Pode começar por onde conseguir.</p>}

        {mensagens.map((mensagem) => (
          <div
            key={mensagem.id}
            className={mensagem.role === "user" ? styles.bubbleUsuario : styles.bubbleAssistente}
          >
            <p className={styles.conteudo}>{mensagem.content}</p>
            {mensagem.content && (
              <button
                className={styles.guardar}
                type="button"
                onClick={() => guardar(mensagem)}
                disabled={guardadas.has(mensagem.id)}
              >
                {guardadas.has(mensagem.id) ? "guardado no diário ✓" : "guardar no diário"}
              </button>
            )}
          </div>
        ))}

        {aguardandoPrimeiroToken && (
          <div className={styles.digitando} aria-label="digitando">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      {erro && <p className={styles.erro}>{erro}</p>}

      <form
        className={styles.form}
        ref={formRef}
        onSubmit={enviar}
      >
        <textarea
          className={styles.textarea}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="o que você quer dizer…"
          disabled={enviando}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              formRef.current?.requestSubmit();
            }
          }}
        />
        <button className={styles.cta} type="submit" disabled={enviando || !texto.trim()}>
          enviar
        </button>
      </form>
    </>
  );
}

function CardTransicaoRisco() {
  const [segundos, setSegundos] = useState(SEGUNDOS_ATE_REDIRECT);

  useEffect(() => {
    if (segundos <= 0) {
      window.location.href = "/recursos";
      return;
    }
    const temporizador = setTimeout(() => setSegundos((s) => s - 1), 1000);
    return () => clearTimeout(temporizador);
  }, [segundos]);

  return (
    <div className={styles.cardRisco}>
      <p className={styles.cardRiscoTexto}>
        Esse momento pede mais cuidado do que eu posso te dar por aqui. Vamos pra um espaço com ajuda mais
        direta.
      </p>
      <a className={styles.cta} href="/recursos">
        ir para recursos →
      </a>
    </div>
  );
}
