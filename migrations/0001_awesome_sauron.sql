CREATE TABLE `kids` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
