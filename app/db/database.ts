import { getRandomColor } from '@app/components/Colors';
import { ElementTypeNames } from '@app/constants/DbTypes';
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
export const db = () => drizzle(newDb, { schema })

export const escapeQuery = <T>(query: string, args: T[], transform?: (T) => string) => {
    const escape = (q: string) => q.replace(/'/g, "''")
    for (let arg of args) {
        let argToEscape = transform ? transform(arg) : arg.toString()
        argToEscape = argToEscape.replace(/'/g, "''")
        query = query.replace('?', `'${argToEscape}'`)
    }
    return query
}

export enum DbErrors {
    ALREADY_MIGRATED = 'ALREADY_MIGRATED',
}
export const initDb = (callback?: (err, res) => void) => {
    const cb = callback || ((err, res) => { })
    const s = schema
    const prefix = 'updated_187'
    const newestUpdateName = prefix + '_1'
    let alreadyUpdated = false

    try{
        alreadyUpdated = !!_db.getFirstSync<{ name: string }>(`SELECT name FROM pages WHERE name = "${newestUpdateName}"`)
    }catch(e){
        alreadyUpdated = true
        console.log("No need to migrate")
    }

    if (alreadyUpdated) return cb(DbErrors.ALREADY_MIGRATED, []) //console.log('db already initialized')

    _db.withTransactionAsync(async () => {
        const pages = await _db.getAllAsync<{ id: number, name: string }>(`SELECT * FROM pages WHERE name NOT LIKE '${newestUpdateName}%'`)
        const routines = await _db.getAllAsync<{ id: number, name: string }>('SELECT * FROM routines')
        const pageRoutines = await _db.getAllAsync<{ pageId: number, routineId: number }>('SELECT * FROM page_routines')
        const tiles = await _db.getAllAsync<{ id: number, name: string, mode: number, rootRoutineId: number }>('SELECT * FROM tiles')
        const routineTiles = await _db.getAllAsync<{ tileId: number, routineId: number }>('SELECT * FROM routine_tiles')
        const tileEvents = await _db.getAllAsync<{ eventId: number, tileId: number, timestamp: Date, data: string }>('SELECT * FROM tile_events')
        const dashboard = await _db.getAllAsync<{ elementId: number, elementType: ElementTypeNames }>('SELECT * FROM dashboard')

        const getPageForRoutine = (rId: number): number => {
            return pageRoutines.find(pr => pr.routineId === rId)?.pageId
        }

        db().insert(s.pages).values(pages.map(p => ({ ...p, color: getRandomColor() }))).onConflictDoNothing()
        db().insert(s.routines).values(routines.map(r => ({ ...r, color: getRandomColor(), rootPageId: getPageForRoutine(r.id) }))).onConflictDoNothing()
        db().insert(s.tiles).values(tiles.map(t => ({ ...t, color: getRandomColor() }))).onConflictDoNothing()
        db().insert(s.tileEvents).values(tileEvents).onConflictDoNothing()
        db().insert(s.dashboard).values(dashboard.map(d => ({ ...d, posX: -1, posY: -1, spanX: -1, spanY: -1 }))).onConflictDoNothing()

        _db.execAsync(`insert into pages (name) values ('${newestUpdateName}')`)
    }).then(
        r => {
            cb(null, r)
            console.log('db initialized')
        },
        e => {
            cb(e, null)
            console.error('db init error', e)
        }
    )
}

export const dropDb = async () => {
    throw "geht aktuell nicht (expo update lol)"
    await _db.closeAsync()
    console.info('db dropped')
    _db = SQLite.openDatabaseSync(dbNameOld)
}

export type ResultCallback<T> = (err: Error, res: Array<T>) => void
export type InsertCallback = (err: Error, res: SQLite.SQLiteRunResult[]) => void