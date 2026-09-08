import { redirect } from "next/navigation";

import { eq } from "drizzle-orm";
import { admins, profissionais, profiles } from "@presenca/db/schema";

import { getDb } from "@/lib/db";
import { getSessao } from "@/lib/sessao";

import { PageHeader } from "../PageHeader";
import { SairButton } from "./SairButton";
import styles from "./page.module.css";

function formatarNascimento(data: string, hora: string | null, local: string | null): string {
  const [ano, mes, dia] = data.split("-");
  let texto = `${dia}/${mes}/${ano}`;
  if (hora) texto += `, ${hora.slice(0, 5)}`;
  if (local) texto += ` — ${local}`;
  return texto;
}

export default async function Perfil() {
  const sessao = await getSessao();
  if (!sessao) redirect("/");

  const db = await getDb();
  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, sessao.user.id),
    columns: {
      nome: true,
      dataNascimento: true,
      horaNascimento: true,
      localNascimento: true,
      profissionalId: true,
    },
  });
  if (!profile?.nome) redirect("/chegada");

  let nomeProfissional: string | null = null;
  if (profile.profissionalId) {
    const profissional = await db.query.profissionais.findFirst({
      where: eq(profissionais.id, profile.profissionalId),
      columns: { nome: true },
    });
    nomeProfissional = profissional?.nome ?? null;
  }

  const admin = await db.query.admins.findFirst({ where: eq(admins.userId, sessao.user.id) });

  return (
    <main className={styles.scene}>
      <PageHeader titulo="Perfil" nome={profile.nome} atual={null} voltar={{ href: "/home" }} />
      <div className={styles.content}>
        <h2 className={styles.headline}>{profile.nome}</h2>

        {/* Único caminho persistente até aqui desde que "recursos de
            cuidado →" saiu da Home (redesign) — Recursos é a única coisa
            que a Fase 8/PRD §7 exige que nunca suma, nem no estado
            "confuso" (ver `reduzido` em app/home/page.tsx). */}
        <div className={styles.secao}>
          <p className={styles.rotulo}>cuidado</p>
          <a className={styles.link} href="/recursos">
            Recursos de cuidado →
          </a>
        </div>

        <div className={styles.secao}>
          <p className={styles.rotulo}>e-mail</p>
          {sessao.user.isAnonymous ? (
            <a className={styles.link} href="/conta">
              Conta ainda não convertida — guardar meu espaço →
            </a>
          ) : (
            <p className={styles.valor}>{sessao.user.email}</p>
          )}
        </div>

        <div className={styles.secao}>
          <p className={styles.rotulo}>nascimento</p>
          {profile.dataNascimento ? (
            <>
              <p className={styles.valor}>
                {formatarNascimento(profile.dataNascimento, profile.horaNascimento, profile.localNascimento)}
              </p>
              <a className={styles.link} href="/perfil/nascimento">
                Editar →
              </a>
            </>
          ) : (
            <a className={styles.link} href="/perfil/nascimento">
              Adicionar data de nascimento →
            </a>
          )}
        </div>

        <div className={styles.secao}>
          <p className={styles.rotulo}>profissional</p>
          {nomeProfissional ? (
            <a className={styles.link} href="/terapia">
              Conectado(a) com {nomeProfissional} →
            </a>
          ) : (
            <a className={styles.link} href="/terapia">
              Conectar com um profissional →
            </a>
          )}
        </div>

        {admin && (
          <div className={styles.secao}>
            <p className={styles.rotulo}>admin</p>
            <a className={styles.link} href="/admin/biblioteca">
              Painel de aprovação da biblioteca →
            </a>
          </div>
        )}

        <SairButton anonimo={sessao.user.isAnonymous === true} />
      </div>
    </main>
  );
}
