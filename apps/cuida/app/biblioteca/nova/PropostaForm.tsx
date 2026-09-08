"use client";

import { useActionState, useState } from "react";

import { CATEGORIAS_PRATICA, type CategoriaPratica } from "@/lib/categoriasPratica";

import { propor } from "./actions";
import styles from "./page.module.css";

export function PropostaForm() {
  const [state, action, pending] = useActionState(propor, {});
  const [tipo, setTipo] = useState<"pagina_livro_vivo" | "pratica">("pagina_livro_vivo");
  const [categoria, setCategoria] = useState<CategoriaPratica>("respiracao");
  const [escopo, setEscopo] = useState<"publico" | "privado_profissional">("publico");

  if (state.sucesso) {
    return (
      <div className={styles.resultado}>
        <p className={styles.resultadoTexto}>
          Proposta enviada. Fica pendente até um admin aprovar — você não vê ela publicada ainda.
        </p>
        <a className={styles.voltar} href="/pacientes">
          ‹ voltar pra pacientes
        </a>
      </div>
    );
  }

  return (
    <form className={styles.form} action={action}>
      {state.erro && <p className={styles.erro}>{state.erro}</p>}
      <input type="hidden" name="tipo" value={tipo} />
      <input type="hidden" name="escopo" value={escopo} />

      <p className={styles.grupoLabel}>Tipo de conteúdo</p>
      <div className={styles.alternador} role="radiogroup" aria-label="Tipo de conteúdo">
        <button
          type="button"
          role="radio"
          aria-checked={tipo === "pagina_livro_vivo"}
          className={`${styles.opcao} ${tipo === "pagina_livro_vivo" ? styles.opcaoAtiva : ""}`}
          onClick={() => setTipo("pagina_livro_vivo")}
        >
          página do Livro Vivo
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={tipo === "pratica"}
          className={`${styles.opcao} ${tipo === "pratica" ? styles.opcaoAtiva : ""}`}
          onClick={() => setTipo("pratica")}
        >
          prática
        </button>
      </div>

      {tipo === "pratica" && (
        <>
          <input type="hidden" name="categoria" value={categoria} />
          <p className={styles.grupoLabel}>Categoria</p>
          <div className={styles.alternador} role="radiogroup" aria-label="Categoria da prática">
            {CATEGORIAS_PRATICA.map((opcao) => (
              <button
                key={opcao.valor}
                type="button"
                role="radio"
                aria-checked={categoria === opcao.valor}
                className={`${styles.opcao} ${categoria === opcao.valor ? styles.opcaoAtiva : ""}`}
                onClick={() => setCategoria(opcao.valor)}
              >
                {opcao.rotulo}
              </button>
            ))}
          </div>
        </>
      )}

      <input className={styles.field} type="text" name="titulo" placeholder="título" required />
      <textarea className={styles.field} name="conteudo" placeholder="conteúdo" rows={8} required />

      <p className={styles.grupoLabel}>Capa (opcional)</p>
      <input className={styles.field} type="file" name="capa" accept="image/jpeg,image/png,image/webp" />

      <p className={styles.grupoLabel}>Escopo de publicação</p>
      <div className={styles.alternador} role="radiogroup" aria-label="Escopo de publicação">
        <button
          type="button"
          role="radio"
          aria-checked={escopo === "publico"}
          className={`${styles.opcao} ${escopo === "publico" ? styles.opcaoAtiva : ""}`}
          onClick={() => setEscopo("publico")}
        >
          público — qualquer pessoa lê
        </button>
        <button
          type="button"
          role="radio"
          aria-checked={escopo === "privado_profissional"}
          className={`${styles.opcao} ${escopo === "privado_profissional" ? styles.opcaoAtiva : ""}`}
          onClick={() => setEscopo("privado_profissional")}
        >
          só meus pacientes
        </button>
      </div>

      <button className={styles.cta} type="submit" disabled={pending}>
        enviar pra aprovação
      </button>
    </form>
  );
}
