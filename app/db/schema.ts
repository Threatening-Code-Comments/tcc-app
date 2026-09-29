import { ElementTypeNames } from "@app/constants/DbTypes";
import { relations } from "drizzle-orm";
import { AnySQLiteColumn, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const tiles = sqliteTable('tiles', {
    id: integer('id').primaryKey().notNull(),
    name: text('name').notNull(),
    mode: integer('mode').notNull(),
    color: text('color', { mode: 'text', length: 7 }).notNull(),
    rootRoutineId: integer('rootRoutineId').notNull().references(() => routines.id),
})

export const routines = sqliteTable('routines', {
    id: integer('id').primaryKey().notNull(),
    name: text('name').notNull(),
    color: text('color', { mode: 'text', length: 7 }).notNull(),
    rootPageId: integer('rootPageId').notNull().references(() => pages.id)
})

export const pages = sqliteTable('pages', {
    id: integer('id').primaryKey().notNull(),
    name: text('name').notNull(),
    color: text('color', { mode: 'text', length: 7 }).notNull()
})

export const tileRelations = relations(tiles, ({ one, many }) => ({
    rootRoutine: one(routines, {
        fields: [tiles.rootRoutineId],
        references: [routines.id]
    }),
    // routines: many(routines),
    events: many(tileEvents)
}))
export const routineRelations = relations(routines, ({ one, many }) => ({
    tiles: many(tiles),
    rootPage: one(pages, {
        fields: [routines.rootPageId],
        references: [pages.id]
    }),
    // pages: many(pages)
}))
export const pageRelations = relations(pages, ({ many }) => ({
    routines: many(routines)
}))


export const tileEvents = sqliteTable('tile_events', {
    eventId: integer('eventId').primaryKey().notNull(),
    tileId: integer('tileId').notNull().references(() => tiles.id),
    timestamp: integer('timestamp', { mode: "timestamp_ms" }).notNull(),
    data: text('data').notNull()
})
export const tileEventsRelations = relations(tileEvents, ({ one }) => ({
    tile: one(tiles, {
        fields: [tileEvents.tileId],
        references: [tiles.id]
    })
}))

export const dashboard = sqliteTable('dashboard', {
    elementId: integer('elementId').notNull().primaryKey(),
    elementType: text('elementType', { enum: [ElementTypeNames.Page, ElementTypeNames.Routine, ElementTypeNames.Tile] }).notNull().primaryKey(),
    posX: integer('posX').notNull(),
    posY: integer('posY').notNull(),
    spanX: integer('spanX').notNull(),
    spanY: integer('spanY').notNull(),
    timeAdded: integer('timeAdded', { mode: 'timestamp_ms' }).notNull().default(new Date())
})
export const dashboardRelations = relations(dashboard, ({ many, one }) => ({
    element: one(pages || routines || tiles, {
        fields: [dashboard.elementId],
        references: [pages.id || routines.id || tiles.id]
    })
}))
export const dashboardSettings = sqliteTable('dashboard_settings', {
    elementId: integer('elementId').notNull(),
    elementType: text('elementType', { enum: [ElementTypeNames.Page, ElementTypeNames.Routine, ElementTypeNames.Tile] }).notNull(),
    settingsType: text('settingsType').notNull(),
    settingsValue: text('settingsValue').notNull()
})
export const dashboardSettingsRelations = relations(dashboardSettings, ({ one }) => ({
    element: one(tiles || routines || pages, {
        fields: [dashboardSettings.elementId],
        references: [tiles.id || routines.id || pages.id]
    })
}))

//homescreen (HS3): folders and item placements, stored flat — the folder tree is rebuilt
//from parentId on load. The root level isn't a row: parentId null means "on the root".
//ids are the app's own folderId/itemId (see getNextId), not autoincrement.
//The ON DELETE actions only fire with `PRAGMA foreign_keys = ON` on the connection.
export const hsFolders = sqliteTable('hs_folders', {
    id: integer('id').primaryKey().notNull(),
    //deleting a folder takes its contents along, same as deleteElement does in memory
    parentId: integer('parentId').references((): AnySQLiteColumn => hsFolders.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    color: text('color', { mode: 'text', length: 7 }).notNull(),
    //live link to a routine; if the routine goes away the folder just becomes a normal one
    routineId: integer('routineId').references(() => routines.id, { onDelete: 'set null' }),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    w: integer('w').notNull(),
    h: integer('h').notNull(),
})

export const hsItems = sqliteTable('hs_items', {
    id: integer('id').primaryKey().notNull(),
    //deleting a tile (App Drawer) removes all its placements
    tileId: integer('tileId').notNull().references(() => tiles.id, { onDelete: 'cascade' }),
    parentId: integer('parentId').references(() => hsFolders.id, { onDelete: 'cascade' }),
    //routine id when a routine-linked folder's sync put this item here (see routine_folders.ts)
    syncedFromRoutine: integer('syncedFromRoutine'),
    x: integer('x').notNull(),
    y: integer('y').notNull(),
    w: integer('w').notNull(),
    h: integer('h').notNull(),
})

export const hsFolderRelations = relations(hsFolders, ({ one, many }) => ({
    parent: one(hsFolders, {
        fields: [hsFolders.parentId],
        references: [hsFolders.id],
        relationName: 'hsFolderParent',
    }),
    subFolders: many(hsFolders, { relationName: 'hsFolderParent' }),
    items: many(hsItems),
    routine: one(routines, {
        fields: [hsFolders.routineId],
        references: [routines.id]
    }),
}))
export const hsItemRelations = relations(hsItems, ({ one }) => ({
    tile: one(tiles, {
        fields: [hsItems.tileId],
        references: [tiles.id]
    }),
    parent: one(hsFolders, {
        fields: [hsItems.parentId],
        references: [hsFolders.id]
    }),
}))

// export const pageRoutines = sqliteTable('page_routines', {
//     pageId: integer('pageId').notNull().references(() => pages.id),
//     routineId: integer('routineId').notNull().references(() => routines.id),
//     posX: integer('posX').notNull(),
//     posY: integer('posY').notNull(),
//     spanX: integer('spanX').notNull(),
//     spanY: integer('spanY').notNull()
// })
// export const routineTiles = sqliteTable('routine_tiles', {
//     tileId: integer('tileId').notNull().references(() => tiles.id),
//     routineId: integer('routineId').notNull().references(() => routines.id),
//     posX: integer('posX').notNull(),
//     posY: integer('posY').notNull(),
//     spanX: integer('spanX').notNull(),
//     spanY: integer('spanY').notNull()
// })