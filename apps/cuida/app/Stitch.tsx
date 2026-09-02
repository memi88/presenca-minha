import styles from "./Stitch.module.css";

// Divisor pontilhado com um ponto teal em cada ponta — elemento estrutural
// do Cuida (docs/cuida-onboarding-mockup.html), referência discreta à
// metáfora "ele costura" do documento de voz de marca (presenca-voz-de-marca.md
// §1), sem repetir a estética "lago" do Presença.
export function Stitch() {
  return <div className={styles.stitch} aria-hidden="true" />;
}
