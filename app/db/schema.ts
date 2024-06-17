import { ElementTypeNames } from "@app/constants/DbTypes";
import { relations } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    elementId: integer('elementId').notNull(),
    elementType: text('elementType', { enum: [ElementTypeNames.Page, ElementTypeNames.Routine, ElementTypeNames.Tile] }).notNull(),
    posX: integer('posX').notNull(),
    posY: integer('posY').notNull(),
    spanX: integer('spanX').notNull(),
    spanY: integer('spanY').notNull()
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

export * as schema from './schema'