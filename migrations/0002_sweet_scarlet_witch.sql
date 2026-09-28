CREATE TABLE `entries` (
	`id` text PRIMARY KEY NOT NULL,
	`kid_id` text NOT NULL,
	`amount_grosze` integer NOT NULL,
	`description` text,
	`created_by` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`kid_id`) REFERENCES `kids`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `entries_kid_created_idx` ON `entries` (`kid_id`,`created_at`);