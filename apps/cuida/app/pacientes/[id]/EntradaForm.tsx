"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { escreverEntrada } from "./actions";
import styles from "./page.module.css";

type ItemBiblioteca = { id: string; tipo: string; titulo: string | null };

const TIPOS_COM_REFERENCIA = new Set(["pratica_indicada", "pagina_indicada"]);

// "prática indicada"/"página indicada" apontam pra um item de verdade da
// biblioteca (biblioteca_ref_id) — escolhido aqui, na hora da criação, não
// mais só texto livre descrevendo qual seria. O <select> troca de opções
// conforme o tipo (prática → tipo='pratica', página → tipo='pagina_livro_vivo').
export function EntradaForm({ pacienteId, itensBiblioteca }: { pacienteId: string; itensBiblioteca: ItemBiblioteca[] }) {
  const [state, action, pending] = useActionState(escreverEntrada.bind(null, pacienteId), {});
  const [tipo, setTipo] = useState("pergunta");
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.sucesso) formRef.current?.reset();
  }, [state]);

  const precisaReferencia = TIPOS_COM_REFERENCIA.has(tipo);
  const tipoBiblioteca = tipo === "pratica_indicada" ? "pratica" : "pagina_livro_vivo";
  const opcoesReferencia = itensBiblioteca.filter((item) => item.tipo === tipoBiblioteca);

  return (
    <form className={styles.form} action={action} ref={formRef}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      {state.sucesso && <p className={styles.confirmacao}>Enviado.</p>}
      <select className={styles.select} name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="pergunta">pergunta</option>
        <option value="pratica_indicada">prática indicada</option>
        <option value="pagina_indicada">página indicada</option>
        <option value="reflexao">reflexão</option>
        <option value="simbolo">símbolo</option>
      </select>
      {precisaReferencia && (
        <select className={styles.select} name="biblioteca_ref_id" required defaultValue="">
          <option value="" disabled>
            {tipo === "pratica_indicada" ? "qual prática?" : "qual página do Livro Vivo?"}
          </option>
          {opcoesReferencia.map((item) => (
            <option key={item.id} value={item.id}>
              {item.titulo}
            </option>
          ))}
        </select>
      )}
      <textarea
        className={styles.textarea}
        name="conteudo"
        placeholder={precisaReferencia ? "por que essa indicação? (opcional)" : "escreva aqui..."}
        rows={4}
        required={!precisaReferencia}
      />
      <button className={styles.cta} type="submit" disabled={pending}>
        enviar pro diário
      </button>
    </form>
  );
}
