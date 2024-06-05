import * as SQLite from 'expo-sqlite';
import { dashboardSettingsStatements, dashboardStatements, pageRoutinesStatements, pagesStatements, routineTilesStatements, routinesStatements, tileEventsStatements, tilesStatements } from "../constants/dbStatements";
import { dbName } from "../constants/global";


const pages = pagesStatements
const routines = routinesStatements
const pageRoutines = pageRoutinesStatements
const tiles = tilesStatements
const routineTiles = routineTilesStatements
const tileEvents = tileEventsStatements
const dashboard = dashboardStatements
const dashboardSettings = dashboardSettingsStatements

let _db = SQLite.openDatabaseSync(dbName)
export const db = () => _db

export const escapeQuery = <T>(query: string, args: T[], transform?: (T) => string) => {
    const escape = (q: string) => q.replace(/'/g, "''")
    return args.map(arg => {
        if(transform)
            return escape(transform(arg))
        else
            return query.replace('?', `'${arg.toString().replace(/'/g, "''")}'`)
    }).join(' ')
}

export const initDb = () => {
    db().withTransactionAsync(async () => {
        // t.executeSql("DROP TABLE IF EXISTS dashboard")
        await db().execAsync(pages.create)
        await db().execAsync(routines.create)
        await db().execAsync(pageRoutines.create)
        await db().execAsync(tiles.create)
        await db().execAsync(routineTiles.create)
        await db().execAsync(tileEvents.create)
        await db().execAsync(dashboard.create)
        await db().execAsync(dashboardSettings.create)
    })
}

export const dropDb = async () => {
    throw "geht aktuell nicht (expo update lol)"
    await _db.closeAsync()
    console.info('db dropped')
    _db = SQLite.openDatabaseSync(dbName)
}

export type ResultCallback<T> = (err: Error, res: Array<T>) => void
export type InsertCallback = (err: Error, res: SQLite.SQLiteRunResult[]) => void