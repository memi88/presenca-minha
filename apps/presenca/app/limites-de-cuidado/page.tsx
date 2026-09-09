import { redirect } from "next/navigation";

// Unificada com /privacidade (decisão do redesign, ver
// docs/redesign/pendencias-implementacao.md) — mantida como rota só pra
// não quebrar links antigos.
export default function LimitesDeCuidado() {
  redirect("/privacidade#limites-de-cuidado");
}
