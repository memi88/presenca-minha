"use client";

import { useActionState, useState } from "react";

import { TIPOS_PROFISSIONAL } from "@/lib/tiposProfissional";

import { completarPerfil } from "./actions";
import styles from "./page.module.css";

type Props = {
  next: string;
  tipoAtual: string | null;
  formaDeTrabalhoAtual: string | null;
  usaLinguagensSimbolicasAtual: boolean;
};

export function CompletarPerfilForm({ next, tipoAtual, formaDeTrabalhoAtual, usaLinguagensSimbolicasAtual }: Props) {
  const [state, action, pending] = useActionState(completarPerfil, {});
  const [tipo, setTipo] = useState(tipoAtual ?? "");

  return (
    <form className={styles.form} action={action}>
      <input type="hidden" name="next" value={next} />
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <select className={styles.field} name="tipo" value={tipo} onChange={(e) => setTipo(e.target.value)} required>
        <option value="" disabled>
          sua abordagem
        </option>
        {TIPOS_PROFISSIONAL.map((opcao) => (
          <option key={opcao} value={opcao}>
            {opcao}
          </option>
        ))}
      </select>
      {tipo === "Outra" && (
        <textarea
          className={styles.field}
          name="forma_de_trabalho"
          placeholder="como você descreveria seu jeito de trabalhar?"
          defaultValue={formaDeTrabalhoAtual ?? ""}
          rows={3}
          required
        />
      )}
      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="usa_linguagens_simbolicas"
          defaultChecked={usaLinguagensSimbolicasAtual}
        />
        <span>
          <strong>Usar leituras simbólicas como referência silenciosa.</strong> O Presença usa, por trás
          da experiência, algumas linguagens de compreensão humana como referência silenciosa — nunca
          como vocabulário exposto, nunca como verdade fechada. Vem ativado por padrão; se sua abordagem
          não trabalha com esse tipo de leitura, pode desligar. Vale saber: mesmo desligado por você, a
          pessoa sempre pode religar por conta própria — a decisão final é sempre dela.
        </span>
      </label>
      <button className={styles.cta} type="submit" disabled={pending}>
        salvar e continuar
      </button>
    </form>
  );
}
