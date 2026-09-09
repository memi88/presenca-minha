import { montarPresenceDailyContext } from "@/lib/presenceDailyContext";

import { IconeLente } from "../IconeLente";
import styles from "./page.module.css";

// Corta um texto longo num trecho de preview — sempre em fronteira de
// palavra, nunca no meio. Mesmo helper de page.tsx, duplicado aqui de
// propósito (pequeno, mesmo padrão de outros helpers no projeto) — este
// componente precisa poder ser importado sem puxar o resto da Home junto.
function trecho(texto: string, max: number): string {
  if (texto.length <= max) return texto;
  const corte = texto.slice(0, max);
  return `${corte.slice(0, corte.lastIndexOf(" "))}…`;
}

function dataDeHoje(): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long" }).format(new Date());
}

/**
 * Componente async separado de propósito (não faz parte do `Promise.all`
 * da Home) — `buscarLenteGenerica` chama um serviço externo (Motor
 * Presente) com timeout de até 15s; antes disso bloqueava a Home INTEIRA
 * até resolver, mesmo com todo o resto (saudação, mood, prática sugerida
 * etc.) já pronto há tempos. Envolto em `<Suspense>` em page.tsx, o
 * Next.js manda o resto da página primeiro e transmite este card
 * assim que — ou se — o Presente responder, sem travar nada. Pedido de
 * performance do Guilherme (08/09/2026): "lente do dia demorou pra
 * aparecer".
 */
export async function LenteDoDiaCard({ presencaHoje }: { presencaHoje: string | null }) {
  const { dailyPresent } = await montarPresenceDailyContext(presencaHoje);
  if (!dailyPresent) return null;

  return (
    <a className={styles.lente} href="/lente-do-dia" aria-label="Lente do dia">
      <div className={styles.eyebrow}>
        <IconeLente className={styles.eyebrowIcone} />
        <span>Lente do dia · {dataDeHoje()}</span>
      </div>
      <p className={styles.lenteTexto}>{trecho(dailyPresent.reflection, 140)}</p>
      <div className={styles.lenteRodape}>
        <span className={styles.lenteCta}>Ler</span>
      </div>
    </a>
  );
}
