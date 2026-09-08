CREATE TABLE `experiencias_consentimentos` (
	`id` text PRIMARY KEY NOT NULL,
	`instancia_id` text NOT NULL,
	`consentido` integer DEFAULT false NOT NULL,
	`consentido_em` integer,
	`revogado_em` integer,
	FOREIGN KEY (`instancia_id`) REFERENCES `experiencias_instancias`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `experiencias_consentimentos_instancia_id_unique` ON `experiencias_consentimentos` (`instancia_id`);--> statement-breakpoint
CREATE TABLE `experiencias_devolutivas` (
	`id` text PRIMARY KEY NOT NULL,
	`instancia_id` text NOT NULL,
	`especialista_id` text NOT NULL,
	`conteudo` text NOT NULL,
	`criado_em` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`instancia_id`) REFERENCES `experiencias_instancias`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`especialista_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `experiencias_devolutivas_instancia_id_idx` ON `experiencias_devolutivas` (`instancia_id`);--> statement-breakpoint
CREATE TABLE `experiencias_etapas` (
	`id` text PRIMARY KEY NOT NULL,
	`experiencia_id` text NOT NULL,
	`ordem` integer NOT NULL,
	`conteudo` text NOT NULL,
	`tipo_resposta` text DEFAULT 'texto' NOT NULL,
	`compartilhada_com_especialista` integer DEFAULT false NOT NULL,
	`opcoes` text,
	`ramificacoes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`experiencia_id`) REFERENCES `experiencias_guiadas`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "experiencias_etapas_tipo_resposta_check" CHECK("experiencias_etapas"."tipo_resposta" in ('texto', 'escolha'))
);
--> statement-breakpoint
CREATE INDEX `experiencias_etapas_experiencia_id_idx` ON `experiencias_etapas` (`experiencia_id`);--> statement-breakpoint
CREATE TABLE `experiencias_guiadas` (
	`id` text PRIMARY KEY NOT NULL,
	`titulo` text NOT NULL,
	`tipo` text NOT NULL,
	`especialista_id` text,
	`descricao` text NOT NULL,
	`estimativa_formato` text,
	`publicado` integer DEFAULT true NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`especialista_id`) REFERENCES `profissionais`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "experiencias_guiadas_tipo_check" CHECK("experiencias_guiadas"."tipo" in ('autoguiada', 'guiada_metodo', 'acompanhada'))
);
--> statement-breakpoint
CREATE INDEX `experiencias_guiadas_especialista_id_idx` ON `experiencias_guiadas` (`especialista_id`);--> statement-breakpoint
CREATE TABLE `experiencias_instancias` (
	`id` text PRIMARY KEY NOT NULL,
	`paciente_id` text NOT NULL,
	`experiencia_id` text NOT NULL,
	`etapa_atual_id` text,
	`estado` text DEFAULT 'em_andamento' NOT NULL,
	`iniciado_em` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`concluido_em` integer,
	FOREIGN KEY (`paciente_id`) REFERENCES `profiles`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`experiencia_id`) REFERENCES `experiencias_guiadas`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`etapa_atual_id`) REFERENCES `experiencias_etapas`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "experiencias_instancias_estado_check" CHECK("experiencias_instancias"."estado" in ('em_andamento', 'aguardando_especialista', 'concluida'))
);
--> statement-breakpoint
CREATE INDEX `experiencias_instancias_paciente_id_idx` ON `experiencias_instancias` (`paciente_id`);--> statement-breakpoint
CREATE INDEX `experiencias_instancias_experiencia_id_idx` ON `experiencias_instancias` (`experiencia_id`);--> statement-breakpoint
CREATE TABLE `experiencias_respostas` (
	`id` text PRIMARY KEY NOT NULL,
	`instancia_id` text NOT NULL,
	`etapa_id` text NOT NULL,
	`conteudo` text NOT NULL,
	`respondido_em` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`instancia_id`) REFERENCES `experiencias_instancias`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`etapa_id`) REFERENCES `experiencias_etapas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `experiencias_respostas_instancia_id_idx` ON `experiencias_respostas` (`instancia_id`);