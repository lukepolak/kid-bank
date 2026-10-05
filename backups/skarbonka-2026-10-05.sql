PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_init.sql','2026-09-28 13:55:34');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0001_awesome_sauron.sql','2026-09-28 14:30:25');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0002_sweet_scarlet_witch.sql','2026-09-28 14:49:37');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(4,'0003_flaky_the_liberteens.sql','2026-09-28 17:58:15');
CREATE TABLE `kids` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
, `color` text DEFAULT 'gold' NOT NULL);
INSERT INTO "kids" ("id","name","archived","created_at","color") VALUES('bd5abde6-c2ba-4e91-9e95-2ffd273ae827','Janek',0,1790606494,'gold');
INSERT INTO "kids" ("id","name","archived","created_at","color") VALUES('fc12093e-0843-4de9-aad6-97b50e24078a','Wojtek',0,1790606497,'teal');
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
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('33bd0c17-b0dc-48aa-aa80-d51ca47688cc','fc12093e-0843-4de9-aad6-97b50e24078a',21000,'Początkowy bilans','l.polak@gmail.com',1790610954,1790610954,NULL);
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('3f1ba417-e5e6-414f-8d55-97edeead72cf','bd5abde6-c2ba-4e91-9e95-2ffd273ae827',23300,'Początkowy bilans','l.polak@gmail.com',1790611054,1790611054,NULL);
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('fbfaf06b-ea23-47e1-9aa7-08d3fc9051a2','bd5abde6-c2ba-4e91-9e95-2ffd273ae827',-22908,'LEGO Domek Pikachu','l.polak@gmail.com',1790618443,1790618443,NULL);
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('7dbf01a5-20fb-479b-9992-0a20baf8f1cf','fc12093e-0843-4de9-aad6-97b50e24078a',-6889,'Super Things Thrasher Superbot','l.polak@gmail.com',1790618528,1790618528,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',4);
CREATE INDEX `entries_kid_created_idx` ON `entries` (`kid_id`,`created_at`);
