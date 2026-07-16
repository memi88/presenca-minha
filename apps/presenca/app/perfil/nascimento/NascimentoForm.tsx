"use client";

import { useActionState } from "react";

import { salvarNascimento } from "./actions";
import { CampoLocalidade } from "./CampoLocalidade";
import styles from "./page.module.css";

type Props = {
  data: string | null;
  hora: string | null;
  local: string | null;
  latitude: number | null;
  longitude: number | null;
};

export function NascimentoForm({ data, hora, local, latitude, longitude }: Props) {
  const [state, action, pending] = useActionState(salvarNascimento, {});

  return (
    <form action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}

      <label className={styles.campo}>
        <span className={styles.rotulo}>data</span>
        <input className={styles.input} type="date" name="data" defaultValue={data ?? ""} required />
      </label>

      <div className={styles.campo}>
        <span className={styles.rotulo}>local (opcional)</span>
        <CampoLocalidade defaultLocal={local} defaultLatitude={latitude} defaultLongitude={longitude} />
      </div>

      <label className={styles.campo}>
        <span className={styles.rotulo}>hora (opcional)</span>
        <input className={styles.input} type="time" name="hora" defaultValue={hora?.slice(0, 5) ?? ""} />
      </label>
      <p className={styles.escape}>
        Não sabe a hora? Sem problema — alguns insights ficam menos precisos, mas você ainda é bem-vindo
        aqui.
      </p>

      <button className={styles.cta} type="submit" disabled={pending}>
        salvar
      </button>
    </form>
  );
}
