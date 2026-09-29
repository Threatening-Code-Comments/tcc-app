CREATE TABLE `hs_folders` (
	`id` integer PRIMARY KEY NOT NULL,
	`parentId` integer,
	`name` text NOT NULL,
	`color` text(7) NOT NULL,
	`routineId` integer,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`w` integer NOT NULL,
	`h` integer NOT NULL,
	FOREIGN KEY (`parentId`) REFERENCES `hs_folders`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`routineId`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE TABLE `hs_items` (
	`id` integer PRIMARY KEY NOT NULL,
	`tileId` integer NOT NULL,
	`parentId` integer,
	`syncedFromRoutine` integer,
	`x` integer NOT NULL,
	`y` integer NOT NULL,
	`w` integer NOT NULL,
	`h` integer NOT NULL,
	FOREIGN KEY (`tileId`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`parentId`) REFERENCES `hs_folders`(`id`) ON UPDATE no action ON DELETE cascade
);
