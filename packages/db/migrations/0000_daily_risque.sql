CREATE TABLE `accounts` (
	`id` text PRIMARY KEY NOT NULL,
	`account_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`user_id` text NOT NULL,
	`issuer` text,
	`access_token` text,
	`refresh_token` text,
	`id_token` text,
	`access_token_expires_at` integer,
	`refresh_token_expires_at` integer,
	`scope` text,
	`password` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `accounts_userId_idx` ON `accounts` (`user_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`expires_at` integer NOT NULL,
	`token` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer NOT NULL,
	`ip_address` text,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_unique` ON `sessions` (`token`);--> statement-breakpoint
CREATE INDEX `sessions_userId_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`image` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`is_anonymous` integer DEFAULT false
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);--> statement-breakpoint
CREATE TABLE `verifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verifications_identifier_idx` ON `verifications` (`identifier`);--> statement-breakpoint
CREATE TABLE `admins` (
	`user_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `alertas_risco` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text NOT NULL,
	`profissional_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profissional_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `alertas_risco_profissional_id_idx` ON `alertas_risco` (`profissional_id`);--> statement-breakpoint
CREATE TABLE `biblioteca` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text,
	`conteudo` text NOT NULL,
	`tags_momento_vida` text,
	`tags_hd` text,
	`autor` text DEFAULT 'Guilherme' NOT NULL,
	`publicado` integer DEFAULT true NOT NULL,
	`embedding` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`slug` text,
	`status_moderacao` text DEFAULT 'aprovado' NOT NULL,
	`escopo` text DEFAULT 'publico' NOT NULL,
	`profissional_autor_id` text,
	`motivo_recusa` text,
	`categoria` text,
	`origin` text,
	FOREIGN KEY (`profissional_autor_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "biblioteca_status_moderacao_check" CHECK("biblioteca"."status_moderacao" in ('pendente', 'aprovado', 'recusado')),
	CONSTRAINT "biblioteca_escopo_check" CHECK("biblioteca"."escopo" in ('publico', 'privado_profissional')),
	CONSTRAINT "biblioteca_origin_check" CHECK("biblioteca"."origin" is null or "biblioteca"."origin" in ('TRADITIONAL_MAYA', 'LAW_OF_TIME', 'HUMAN_DESIGN', 'KABBALAH', 'PRESENTE', 'PRESENCA'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `biblioteca_slug_unique` ON `biblioteca` (`slug`);--> statement-breakpoint
CREATE INDEX `biblioteca_profissional_autor_id_idx` ON `biblioteca` (`profissional_autor_id`);--> statement-breakpoint
CREATE TABLE `caderno_entradas` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text NOT NULL,
	`autor_tipo` text NOT NULL,
	`autor_profissional_id` text,
	`tipo` text DEFAULT 'reflexao' NOT NULL,
	`conteudo` text NOT NULL,
	`biblioteca_ref_id` text,
	`revisitar` integer DEFAULT false NOT NULL,
	`embedding` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`conexao_conteudo` text,
	`compartilhar` integer DEFAULT false NOT NULL,
	`fechamento_resposta_rapida` text,
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`autor_profissional_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`biblioteca_ref_id`) REFERENCES `biblioteca`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `caderno_entradas_paciente_id_idx` ON `caderno_entradas` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `caderno_entradas_autor_profissional_id_idx` ON `caderno_entradas` (`autor_profissional_id`);--> statement-breakpoint
CREATE TABLE `conversa_rate_limit` (
	`user_id` text PRIMARY KEY NOT NULL,
	`janela_inicio` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`contagem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `embedding_rate_limit` (
	`user_id` text PRIMARY KEY NOT NULL,
	`janela_inicio` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`contagem` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `lente_reacoes` (
	`paciente_id` text NOT NULL,
	`data` text NOT NULL,
	`reacao` text NOT NULL,
	`criado_em` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	PRIMARY KEY(`paciente_id`, `data`),
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "lente_reacoes_reacao_check" CHECK("lente_reacoes"."reacao" in ('gostei', 'nao_gostei'))
);
--> statement-breakpoint
CREATE TABLE `pacientes_pre_cadastro` (
	`id` text PRIMARY KEY NOT NULL,
	`profissional_id` text NOT NULL,
	`nome` text NOT NULL,
	`caracteristicas` text,
	`anotacoes` text,
	`token_convite` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`paciente_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`confirmado_em` integer,
	FOREIGN KEY (`profissional_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pacientes_pre_cadastro_status_check" CHECK("pacientes_pre_cadastro"."status" in ('pendente', 'confirmado'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `pacientes_pre_cadastro_token_convite_unique` ON `pacientes_pre_cadastro` (`token_convite`);--> statement-breakpoint
CREATE INDEX `pacientes_pre_cadastro_profissional_id_idx` ON `pacientes_pre_cadastro` (`profissional_id`);--> statement-breakpoint
CREATE TABLE `profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`nome` text,
	`data_nascimento` text,
	`hora_nascimento` text,
	`local_nascimento` text,
	`configuracao_hd` text,
	`profissional_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`lembrete_conversao_em` integer,
	`presenca_hoje` text,
	`presenca_hoje_em` integer,
	`ultima_visita_em` integer,
	`streak_dias_consecutivos` integer DEFAULT 0 NOT NULL,
	`streak_atualizado_em` text,
	`lembrete_nascimento_em` integer,
	`nascimento_latitude` text,
	`nascimento_longitude` text,
	`nascimento_pulado_no_cadastro_em` integer,
	`acesso_liberado` integer DEFAULT true NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`profissional_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profiles_user_id_unique` ON `profiles` (`user_id`);--> statement-breakpoint
CREATE INDEX `profiles_profissional_id_idx` ON `profiles` (`profissional_id`);--> statement-breakpoint
CREATE TABLE `profissionais` (
	`id` text PRIMARY KEY NOT NULL,
	`nome` text NOT NULL,
	`tipo` text,
	`user_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`codigo_convite` text NOT NULL,
	`forma_de_trabalho` text,
	`usa_linguagens_simbolicas` integer DEFAULT true NOT NULL,
	`lembrete_perfil_em` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "profissionais_tipo_check" CHECK("profissionais"."tipo" in ('TCC', 'Psicanálise', 'Gestalt-terapia', 'Terapia Sistêmica', 'ACT', 'Humanista', 'Holística/Integrativa', 'Outra'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `profissionais_codigo_convite_unique` ON `profissionais` (`codigo_convite`);--> statement-breakpoint
CREATE INDEX `profissionais_user_id_idx` ON `profissionais` (`user_id`);--> statement-breakpoint
CREATE TABLE `vinculos` (
	`id` text PRIMARY KEY NOT NULL,
	`profissional_id` text,
	`paciente_id` text,
	`ativo` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`compartilhar_praticas` integer DEFAULT false NOT NULL,
	`compartilhar_livro_vivo` integer DEFAULT false NOT NULL,
	FOREIGN KEY (`profissional_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `vinculos_profissional_paciente_idx` ON `vinculos` (`profissional_id`,`paciente_id`);