PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE IF NOT EXISTS "d1_migrations"(
		id         INTEGER PRIMARY KEY AUTOINCREMENT,
		name       TEXT UNIQUE,
		applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(1,'0000_init.sql','2026-09-28 13:55:34');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(2,'0001_awesome_sauron.sql','2026-09-28 14:30:25');
INSERT INTO "d1_migrations" ("id","name","applied_at") VALUES(3,'0002_sweet_scarlet_witch.sql','2026-09-28 14:49:37');
CREATE TABLE `kids` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`archived` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL
);
INSERT INTO "kids" ("id","name","archived","created_at") VALUES('bd5abde6-c2ba-4e91-9e95-2ffd273ae827','Janek',0,1790606494);
INSERT INTO "kids" ("id","name","archived","created_at") VALUES('fc12093e-0843-4de9-aad6-97b50e24078a','Wojtek',0,1790606497);
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
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('e16aca11-1afa-47a5-a194-1d90f2551215','fc12093e-0843-4de9-aad6-97b50e24078a',10000,'Prezent od Babci Eli i Dziadzia Henia','l.polak@gmail.com',1790607243,1790607243,NULL);
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('f0c91860-19b5-4781-af77-9ce396b40055','fc12093e-0843-4de9-aad6-97b50e24078a',1000,'Zestaw kredek','l.polak@gmail.com',1790607267,1790607267,NULL);
INSERT INTO "entries" ("id","kid_id","amount_grosze","description","created_by","created_at","updated_at","deleted_at") VALUES('67ce7056-b78d-44db-a77c-b2240d1eae72','fc12093e-0843-4de9-aad6-97b50e24078a',-2000,'Coś tam','l.polak@gmail.com',1790607277,1790607277,NULL);
DELETE FROM sqlite_sequence;
INSERT INTO "sqlite_sequence" ("name","seq") VALUES('d1_migrations',3);
CREATE INDEX `entries_kid_created_idx` ON `entries` (`kid_id`,`created_at`);
