"use client";

import { useActionState } from "react";

import { type SalvarNascimentoState } from "@/lib/nascimento";

import { CampoLocalidade } from "./CampoLocalidade";
import styles from "./page.module.css";

type Props = {
  data: string | null;
  hora: string | null;
  local: string | null;
  latitude: number | null;
  longitude: number | null;
  action: (state: SalvarNascimentoState, formData: FormData) => Promise<SalvarNascimentoState>;
  textoBotao?: string;
};

export function NascimentoForm({ data, hora, local, latitude, longitude, action, textoBotao = "Salvar" }: Props) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}

      <label className={styles.campo}>
        <span className={styles.campoCabecalho}>
          <span className={styles.rotulo}>Data de nascimento</span>
          <span className={styles.rotuloObrigatorio}>(obrigatório)</span>
        </span>
        <input className={styles.input} type="date" name="data" defaultValue={data ?? ""} required />
      </label>

      <div className={styles.campo}>
        <span className={styles.campoCabecalho}>
          <span className={styles.rotulo}>Local de nascimento</span>
          <span className={styles.rotuloOpcional}>(opcional)</span>
        </span>
        <CampoLocalidade defaultLocal={local} defaultLatitude={latitude} defaultLongitude={longitude} />
      </div>

      <label className={styles.campo}>
        <span className={styles.campoCabecalho}>
          <span className={styles.rotulo}>Hora de nascimento</span>
          <span className={styles.rotuloOpcional}>(opcional)</span>
        </span>
        <input className={styles.input} type="time" name="hora" defaultValue={hora?.slice(0, 5) ?? ""} />
      </label>
      <p className={styles.escape}>
        Não sabe a hora? Sem problema — alguns insights ficam menos precisos, mas você ainda é bem-vindo
        aqui.
      </p>

      <button className={styles.cta} type="submit" disabled={pending}>
        {textoBotao}
      </button>
    </form>
  );
}
