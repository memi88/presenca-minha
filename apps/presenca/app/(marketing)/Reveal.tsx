"use client";

import { useEffect, useRef, useState } from "react";

import styles from "./Reveal.module.css";

type Props = {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
};

// Fade + leve deslocamento ao entrar na viewport. Desativado automaticamente
// por @media (prefers-reduced-motion) dentro do CSS module — quem prefere
// menos movimento vê o conteúdo direto, sem esperar o scroll.
export function Reveal({ children, className, delayMs }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = [styles.reveal, visible ? styles.visible : "", className].filter(Boolean).join(" ");

  return (
    <div ref={ref} className={classes} style={delayMs ? { transitionDelay: `${delayMs}ms` } : undefined}>
      {children}
    </div>
  );
}
