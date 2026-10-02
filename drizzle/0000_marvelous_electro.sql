CREATE TABLE `life_attempts` (
	`key` text PRIMARY KEY NOT NULL,
	`count` integer NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `life_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text,
	`user_id` text NOT NULL,
	`action` text NOT NULL,
	`detail` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `life_audit_policy` ON `life_audit` (`policy_id`,`created`);--> statement-breakpoint
CREATE TABLE `life_companies` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`cnpj` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `life_files` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text NOT NULL,
	`competence` text NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`size` integer NOT NULL,
	`hash` text NOT NULL,
	`object_key` text NOT NULL,
	`user_id` text NOT NULL,
	`created` text NOT NULL,
	`status` text NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`rows` text,
	`parse_note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `life_files_policy_month` ON `life_files` (`policy_id`,`competence`);--> statement-breakpoint
CREATE TABLE `life_policies` (
	`id` text PRIMARY KEY NOT NULL,
	`company_id` text NOT NULL,
	`insurer` text NOT NULL,
	`number` text,
	`start` text NOT NULL,
	`end` text,
	`notes` text NOT NULL,
	`summary` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `life_policy_company` ON `life_policies` (`company_id`);--> statement-breakpoint
CREATE TABLE `life_sessions` (
	`token` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `life_sessions_user` ON `life_sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `life_snapshots` (
	`id` text PRIMARY KEY NOT NULL,
	`policy_id` text NOT NULL,
	`competence` text NOT NULL,
	`file_id` text NOT NULL,
	`rows` text NOT NULL,
	`created` text NOT NULL,
	`user_id` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `life_snapshots_file_id_unique` ON `life_snapshots` (`file_id`);--> statement-breakpoint
CREATE INDEX `life_snapshot_policy_month` ON `life_snapshots` (`policy_id`,`competence`);--> statement-breakpoint
CREATE TABLE `life_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`name` text NOT NULL,
	`company_id` text,
	`role` text NOT NULL,
	`password` text NOT NULL,
	`must_change` integer DEFAULT 1 NOT NULL,
	`active` integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `life_users_username_unique` ON `life_users` (`username`);