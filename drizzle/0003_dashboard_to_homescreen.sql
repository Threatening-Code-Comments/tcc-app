-- Carries the old dashboard over into the homescreen, then drops it (hand-written data part,
-- the two DROP TABLEs at the end are drizzle-kit's). Only when the homescreen is still empty,
-- so a homescreen someone already laid out after 0002 is never touched. The decision is taken
-- once up front: the inserts below would otherwise see each other's rows.
--   Tile    -> item on the root
--   Routine -> live-linked folder on the root (its tiles are filled in by the routine-folder
--              sync on the next load)
--   Page    -> folder on the root, with each of its routines as a live-linked sub-folder
-- Old positions are not used (they were all 0/0 with span 0 in practice): entries get one
-- 1x1 cell each, row by row on the 4-column grid, newest first like the old dashboard showed
-- them. More than 36 entries (or routines in one page) would run past the 9 grid rows.
CREATE TEMP TABLE `_hs_migration` AS
SELECT NOT EXISTS (SELECT 1 FROM `hs_items`) AND NOT EXISTS (SELECT 1 FROM `hs_folders`) AS `go`;
--> statement-breakpoint
CREATE TEMP TABLE `_hs_entries` AS
SELECT `elementId`, `elementType`,
       ROW_NUMBER() OVER (ORDER BY `timeAdded` DESC, `elementType`, `elementId`) - 1 AS `cell`
FROM `dashboard`
WHERE (SELECT `go` FROM `_hs_migration`)
  AND ((`elementType` = 'Tile' AND `elementId` IN (SELECT `id` FROM `tiles`))
    OR (`elementType` = 'Routine' AND `elementId` IN (SELECT `id` FROM `routines`))
    OR (`elementType` = 'Page' AND `elementId` IN (SELECT `id` FROM `pages`)));
--> statement-breakpoint
CREATE TEMP TABLE `_hs_top_folders` AS
SELECT ROW_NUMBER() OVER (ORDER BY `cell`) - 1 AS `id`, `elementId`, `elementType`, `cell`
FROM `_hs_entries`
WHERE `elementType` IN ('Routine', 'Page');
--> statement-breakpoint
INSERT INTO `hs_items` (`id`, `tileId`, `parentId`, `syncedFromRoutine`, `x`, `y`, `w`, `h`)
SELECT ROW_NUMBER() OVER (ORDER BY `cell`) - 1, `elementId`, NULL, NULL, `cell` % 4, `cell` / 4, 1, 1
FROM `_hs_entries`
WHERE `elementType` = 'Tile';
--> statement-breakpoint
INSERT INTO `hs_folders` (`id`, `parentId`, `name`, `color`, `routineId`, `x`, `y`, `w`, `h`)
SELECT f.`id`, NULL, r.`name`, r.`color`, r.`id`, f.`cell` % 4, f.`cell` / 4, 1, 1
FROM `_hs_top_folders` f JOIN `routines` r ON r.`id` = f.`elementId`
WHERE f.`elementType` = 'Routine';
--> statement-breakpoint
INSERT INTO `hs_folders` (`id`, `parentId`, `name`, `color`, `routineId`, `x`, `y`, `w`, `h`)
SELECT f.`id`, NULL, p.`name`, p.`color`, NULL, f.`cell` % 4, f.`cell` / 4, 1, 1
FROM `_hs_top_folders` f JOIN `pages` p ON p.`id` = f.`elementId`
WHERE f.`elementType` = 'Page';
--> statement-breakpoint
-- a page's routines as linked sub-folders inside it; ids continue after the root-level folders
INSERT INTO `hs_folders` (`id`, `parentId`, `name`, `color`, `routineId`, `x`, `y`, `w`, `h`)
SELECT (SELECT COUNT(*) FROM `_hs_top_folders`) + ROW_NUMBER() OVER (ORDER BY f.`cell`, r.`id`) - 1,
       f.`id`, r.`name`, r.`color`, r.`id`,
       (ROW_NUMBER() OVER (PARTITION BY f.`id` ORDER BY r.`id`) - 1) % 4,
       (ROW_NUMBER() OVER (PARTITION BY f.`id` ORDER BY r.`id`) - 1) / 4,
       1, 1
FROM `_hs_top_folders` f JOIN `routines` r ON r.`rootPageId` = f.`elementId`
WHERE f.`elementType` = 'Page';
--> statement-breakpoint
DROP TABLE `_hs_top_folders`;--> statement-breakpoint
DROP TABLE `_hs_entries`;--> statement-breakpoint
DROP TABLE `_hs_migration`;--> statement-breakpoint
DROP TABLE `dashboard`;--> statement-breakpoint
DROP TABLE `dashboard_settings`;
