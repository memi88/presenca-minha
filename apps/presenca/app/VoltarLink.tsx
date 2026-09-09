"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import { IconeSetaEsquerda } from "./IconeSetaEsquerda";
import styles from "./PageHeader.module.css";

type Props = {
  href: string;
};

// Dentro do app nativo, "voltar" pra "/" (marketing) não deveria existir —
// a área deslogada é só-web (docs/presenca-extensao-app-mobile.md §4.1).
// O título continua centralizado em .linhaSimples independente da seta
// existir (posicionamento absoluto, não depende de balancear com um
// espaçador do outro lado — ver PageHeader.module.css), então some de
// vez nesse caso; qualquer outro destino (ex: voltar pra /home) continua
// normal, dentro ou fora do app.
export function VoltarLink({ href }: Props) {
  const [esconder, setEsconder] = useState(false);

  useEffect(() => {
    setEsconder(Capacitor.isNativePlatform() && href === "/");
  }, [href]);

  if (esconder) return null;

  return (
    <a className={styles.voltarLink} href={href} aria-label="Voltar">
      <IconeSetaEsquerda />
    </a>
  );
}
