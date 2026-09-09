PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_biblioteca` (
	`id` text PRIMARY KEY NOT NULL,
	`tipo` text NOT NULL,
	`titulo` text,
	`conteudo` text NOT NULL,
	`tags_momento_vida` text,
	`tags_hd` text,
	`autor` text DEFAULT 'Guilherme',
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
	CONSTRAINT "biblioteca_status_moderacao_check" CHECK("__new_biblioteca"."status_moderacao" in ('pendente', 'aprovado', 'recusado')),
	CONSTRAINT "biblioteca_escopo_check" CHECK("__new_biblioteca"."escopo" in ('publico', 'privado_profissional')),
	CONSTRAINT "biblioteca_origin_check" CHECK("__new_biblioteca"."origin" is null or "__new_biblioteca"."origin" in ('TRADITIONAL_MAYA', 'LAW_OF_TIME', 'HUMAN_DESIGN', 'KABBALAH', 'PRESENTE', 'PRESENCA'))
);
--> statement-breakpoint
INSERT INTO `__new_biblioteca`("id", "tipo", "titulo", "conteudo", "tags_momento_vida", "tags_hd", "autor", "publicado", "embedding", "created_at", "slug", "status_moderacao", "escopo", "profissional_autor_id", "motivo_recusa", "categoria", "origin") SELECT "id", "tipo", "titulo", "conteudo", "tags_momento_vida", "tags_hd", "autor", "publicado", "embedding", "created_at", "slug", "status_moderacao", "escopo", "profissional_autor_id", "motivo_recusa", "categoria", "origin" FROM `biblioteca`;--> statement-breakpoint
DROP TABLE `biblioteca`;--> statement-breakpoint
ALTER TABLE `__new_biblioteca` RENAME TO `biblioteca`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `biblioteca_slug_unique` ON `biblioteca` (`slug`);--> statement-breakpoint
CREATE INDEX `biblioteca_profissional_autor_id_idx` ON `biblioteca` (`profissional_autor_id`);