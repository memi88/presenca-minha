"use client";

import { useEffect, useState } from "react";

import styles from "./page.module.css";

// Instalabilidade é por navegador/aparelho, não por conta — por isso o
// "agora não" fica em localStorage (client-only), diferente dos outros
// convites da Home (adiarConversao/adiarNascimento), que são por perfil.
const CHAVE_DISPENSADO = "presenca:pwa-dispensado-em";
const DIAS_ATE_PERGUNTAR_DE_NOVO = 14;

type EventoAntesDeInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function jaEstaInstalado(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function foiDispensadoRecentemente(): boolean {
  const dispensadoEm = localStorage.getItem(CHAVE_DISPENSADO);
  if (!dispensadoEm) return false;
  const dias = (Date.now() - Number(dispensadoEm)) / (24 * 60 * 60 * 1000);
  return dias < DIAS_ATE_PERGUNTAR_DE_NOVO;
}

function ehIOS(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Convite pra instalar o app na tela inicial — some se outro convite da
 * Home já estiver ocupando o espaço (`oculto`), se já estiver instalado, ou
 * se a pessoa já dispensou há pouco tempo. iOS/Safari nunca dispara
 * `beforeinstallprompt`, então ali a única saída é instrução manual. */
export function InstalarPWABanner({ oculto }: { oculto: boolean }) {
  const [prompt, setPrompt] = useState<EventoAntesDeInstalar | null>(null);
  const [mostrarInstrucoesIOS, setMostrarInstrucoesIOS] = useState(false);
  const [dispensado, setDispensado] = useState(false);

  useEffect(() => {
    if (jaEstaInstalado() || foiDispensadoRecentemente()) return;

    if (ehIOS()) {
      setMostrarInstrucoesIOS(true);
      return;
    }

    function aoDispararPrompt(evento: Event) {
      evento.preventDefault();
      setPrompt(evento as EventoAntesDeInstalar);
    }
    window.addEventListener("beforeinstallprompt", aoDispararPrompt);
    return () => window.removeEventListener("beforeinstallprompt", aoDispararPrompt);
  }, []);

  function dispensar() {
    localStorage.setItem(CHAVE_DISPENSADO, String(Date.now()));
    setDispensado(true);
  }

  async function instalar() {
    if (!prompt) return;
    await prompt.prompt();
    const escolha = await prompt.userChoice;
    setPrompt(null);
    if (escolha.outcome !== "accepted") dispensar();
  }

  if (oculto || dispensado || (!prompt && !mostrarInstrucoesIOS)) return null;

  return (
    <div className={styles.convite}>
      {prompt ? (
        <p>
          Quer ter o Presença sempre à mão?{" "}
          <button type="button" className={styles.conviteAcao} onClick={instalar}>
            instalar o app
          </button>
        </p>
      ) : (
        <p>Quer ter o Presença sempre à mão? Toque em compartilhar e depois em "Adicionar à Tela de Início".</p>
      )}
      <button type="button" className={styles.conviteDispensar} onClick={dispensar}>
        agora não
      </button>
    </div>
  );
}
