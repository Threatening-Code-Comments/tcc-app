import { getRandomColor } from '@app/components/Colors';
import { DashboardEntry, ElementTypeNames, Page, Routine, Tile, TileEvent } from '@app/constants/DbTypes';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { dashboardSettingsStatements, dashboardStatements, pageRoutinesStatements, pagesStatements, routineTilesStatements, routinesStatements, tileEventsStatements, tilesStatements } from "../constants/dbStatements";
import { dbName, dbNameOld } from "../constants/global";
import * as schema from './schema';


const pages = pagesStatements
const routines = routinesStatements
const pageRoutines = pageRoutinesStatements
const tiles = tilesStatements
const routineTiles = routineTilesStatements
const tileEvents = tileEventsStatements
const dashboard = dashboardStatements
const dashboardSettings = dashboardSettingsStatements

let _db = SQLite.openDatabaseSync(dbNameOld)
let newDb = SQLite.openDatabaseSync(dbName, { enableChangeListener: true })
const drizzleDB = drizzle(newDb, { schema })
export const db = () => drizzleDB

export const escapeQuery = <T>(query: string, args: T[], transform?: (T) => string) => {
    const escape = (q: string) => q.replace(/'/g, "''")
    for (let arg of args) {
        let argToEscape = transform ? transform(arg) : arg.toString()
        argToEscape = argToEscape.replace(/'/g, "''")
        query = query.replace('?', `'${argToEscape}'`)
    }
    return query
}

export type DbExportType = {
    pages: Page[],
    routines: (Routine & { rootPageId: number })[],
    tiles: Tile[],
    tileEvents: TileEvent[],
    dashboard: (DashboardEntry & {
        posX: number,
        posY: number,
        spanX: number,
        spanY: number,
        element: {
            id: number,
            name: string,
            color: string,
        }
    })[]
}
export const getAllAsObject = async (): Promise<DbExportType> => {
    const pages = await db().select().from(schema.pages)
    const routines = (await db().query.routines.findMany({ with: { rootPage: true } }))
    const tiles = (await db().query.tiles.findMany({ with: { events: true } }))
    const tileEvents = tiles.map(t=>t.events).flat()
    const dashboard = (await db().query.dashboard.findMany({ with: { element: true } }))

    return { pages, routines, tiles, tileEvents, dashboard }
}

export enum DbErrors {
    ALREADY_MIGRATED = 'ALREADY_MIGRATED',
}
export const initDb = (callback?: (err, res) => void) => {
    const cb = callback || ((err, res) => { })
    const s = schema

    const tables = _db.getFirstSync<{}>(`SELECT name FROM sqlite_master WHERE type='table';`)
    console.log("tables: ", tables)
    if (!tables) { console.log("returning now"); return cb(new Error('Keine Daten in der alten DB'), null) }

    _db.withTransactionAsync(async () => {
        const pages = await _db.getAllAsync<{ id: number, name: string }>(`SELECT * FROM pages`) || []
        const routines = await _db.getAllAsync<{ id: number, name: string }>('SELECT * FROM routines') || []
        const pageRoutines = await _db.getAllAsync<{ pageId: number, routineId: number }>('SELECT * FROM page_routines') || []
        const tiles = await _db.getAllAsync<{ id: number, name: string, mode: number, rootRoutineId: number }>('SELECT * FROM tiles') || []
        const routineTiles = await _db.getAllAsync<{ tileId: number, routineId: number }>('SELECT * FROM routine_tiles') || []
        const tileEvents = await _db.getAllAsync<{ eventId: number, tileId: number, timestamp: string, data: string }>('SELECT * FROM tile_events') || []
        const dashboard = await _db.getAllAsync<{ elementId: number, elementType: ElementTypeNames }>('SELECT * FROM dashboard') || []

        const getPageForRoutine = (rId: number): number => {
            return pageRoutines.find(pr => pr.routineId === rId)?.pageId
        }
        await db().insert(s.pages).values(pages.map(p => ({ ...p, color: getRandomColor() }))).onConflictDoNothing()
        await db().insert(s.routines).values(routines.map(r => ({ ...r, color: getRandomColor(), rootPageId: getPageForRoutine(r.id) }))).onConflictDoNothing()
        await db().insert(s.tiles).values(tiles.map(t => ({ ...t, color: getRandomColor() }))).onConflictDoNothing()
        await db().insert(s.tileEvents).values(tileEvents.map(e => ({ ...e, timestamp: new Date(e.timestamp) }))).onConflictDoNothing()
        //await db().insert(s.dashboard).values(dashboard.map(d => ({ ...d, posX: -1, posY: -1, spanX: -1, spanY: -1 }))).onConflictDoNothing()
    }).then(
        r => {
            cb(null, r)
            console.log('db initialized', r)
        },
        e => {
            cb(e, null)
            console.error('db init error', e)
        }
    ).catch(e => {
        cb(e, null)
        console.error('db init error', e)
    })
}

export const dropDb = async () => {
    throw "geht aktuell nicht (expo update lol)"
    await _db.closeAsync()
    console.info('db dropped')
    _db = SQLite.openDatabaseSync(dbNameOld)
}

export type ResultCallback<T> = (err: Error, res: Array<T>) => void
export type InsertCallback = (err: Error, res: SQLite.SQLiteRunResult[]) => void