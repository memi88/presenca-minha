"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./page.module.css";

type Sugestao = {
  label: string;
  cidade: string;
  estado: string | null;
  pais: string | null;
  lat: number;
  lng: number;
};

type Props = {
  defaultLocal: string | null;
  defaultLatitude: number | null;
  defaultLongitude: number | null;
};

const DEBOUNCE_MS = 300;

export function CampoLocalidade({ defaultLocal, defaultLatitude, defaultLongitude }: Props) {
  const [texto, setTexto] = useState(defaultLocal ?? "");
  const [coordenada, setCoordenada] = useState<{ lat: number; lng: number } | null>(
    defaultLatitude != null && defaultLongitude != null
      ? { lat: defaultLatitude, lng: defaultLongitude }
      : null,
  );
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([]);
  const [aberto, setAberto] = useState(false);
  const [indiceAtivo, setIndiceAtivo] = useState(-1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requisicaoAtualRef = useRef(0);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function buscar(valor: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (valor.trim().length < 3) {
      setSugestoes([]);
      setAberto(false);
      return;
    }

    timerRef.current = setTimeout(async () => {
      const idRequisicao = ++requisicaoAtualRef.current;
      try {
        const resposta = await fetch(`/api/geocoding?q=${encodeURIComponent(valor)}`);
        if (!resposta.ok) return;
        const dados: Sugestao[] = await resposta.json();
        // Ignora respostas de buscas antigas que chegaram fora de ordem.
        if (idRequisicao !== requisicaoAtualRef.current) return;
        setSugestoes(dados);
        setAberto(dados.length > 0);
        setIndiceAtivo(-1);
      } catch {
        // Falha de rede na busca de sugestões não deveria travar o campo —
        // a pessoa continua podendo digitar texto livre normalmente.
      }
    }, DEBOUNCE_MS);
  }

  function selecionar(sugestao: Sugestao) {
    setTexto(sugestao.label);
    setCoordenada({ lat: sugestao.lat, lng: sugestao.lng });
    setAberto(false);
    setSugestoes([]);
  }

  function aoDigitar(valor: string) {
    setTexto(valor);
    // Editar o texto invalida a seleção anterior — não faz sentido salvar
    // uma coordenada que não bate mais com o que está escrito no campo.
    setCoordenada(null);
    buscar(valor);
  }

  function aoTeclar(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!aberto || sugestoes.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.min(i + 1, sugestoes.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && indiceAtivo >= 0 && sugestoes[indiceAtivo]) {
      e.preventDefault();
      selecionar(sugestoes[indiceAtivo]);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  return (
    <div className={styles.autocompleteWrapper}>
      <input
        className={styles.input}
        type="text"
        name="local"
        placeholder="cidade, estado"
        autoComplete="off"
        value={texto}
        onChange={(e) => aoDigitar(e.target.value)}
        onKeyDown={aoTeclar}
        onFocus={() => sugestoes.length > 0 && setAberto(true)}
        onBlur={() => setAberto(false)}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
      />
      <input type="hidden" name="latitude" value={coordenada?.lat ?? ""} />
      <input type="hidden" name="longitude" value={coordenada?.lng ?? ""} />

      {aberto && (
        <ul className={styles.sugestoes} role="listbox">
          {sugestoes.map((sugestao, i) => (
            <li key={`${sugestao.lat}-${sugestao.lng}`} role="option" aria-selected={i === indiceAtivo}>
              <button
                type="button"
                className={i === indiceAtivo ? styles.sugestaoAtiva : styles.sugestao}
                // onMouseDown (não onClick) dispara antes do onBlur do input,
                // senão o dropdown fecha antes do clique registrar.
                onMouseDown={(e) => {
                  e.preventDefault();
                  selecionar(sugestao);
                }}
              >
                {sugestao.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
