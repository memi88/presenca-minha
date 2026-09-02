"use client";

import { Capacitor } from "@capacitor/core";
import { useEffect, useState } from "react";

import styles from "./PageHeader.module.css";

type Props = {
  href: string;
  label: string;
};

// Dentro do app nativo, "voltar" pra "/" (marketing) não deveria existir —
// a área deslogada é só-web (docs/presenca-extensao-app-mobile.md §4.1).
// Esconde o link só nesse caso; qualquer outro destino (ex: voltar pra
// /home) continua normal, dentro ou fora do app.
export function VoltarLink({ href, label }: Props) {
  const [esconder, setEsconder] = useState(false);

  useEffect(() => {
    setEsconder(Capacitor.isNativePlatform() && href === "/");
  }, [href]);

  if (esconder) return null;

  return (
    <a className={styles.voltarLink} href={href}>
      {label}
    </a>
  );
}
