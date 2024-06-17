CREATE TABLE `dashboard` (
	`elementId` integer NOT NULL,
	`elementType` text NOT NULL,
	`posX` integer NOT NULL,
	`posY` integer NOT NULL,
	`spanX` integer NOT NULL,
	`spanY` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `dashboard_settings` (
	`elementId` integer NOT NULL,
	`elementType` text NOT NULL,
	`settingsType` text NOT NULL,
	`settingsValue` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pages` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text(7) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `routines` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color` text(7) NOT NULL,
	`rootPageId` integer NOT NULL,
	FOREIGN KEY (`rootPageId`) REFERENCES `pages`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tile_events` (
	`eventId` integer PRIMARY KEY NOT NULL,
	`tileId` integer NOT NULL,
	`timestamp` integer NOT NULL,
	`data` text NOT NULL,
	FOREIGN KEY (`tileId`) REFERENCES `tiles`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `tiles` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`mode` integer NOT NULL,
	`color` text(7) NOT NULL,
	`rootRoutineId` integer NOT NULL,
	FOREIGN KEY (`rootRoutineId`) REFERENCES `routines`(`id`) ON UPDATE no action ON DELETE no action
);
