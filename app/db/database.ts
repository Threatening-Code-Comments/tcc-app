import * as SQLite from 'expo-sqlite';
import { dashboardSettingsStatements, dashboardStatements, pageRoutinesStatements, pagesStatements, routineTilesStatements, routinesStatements, tileEventsStatements, tilesStatements } from "../constants/dbStatements";
import { colors, dbName } from "../constants/global";
import { Routine } from '@app/constants/DbTypes';


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
    for (let arg of args) {
        let argToEscape = transform ? transform(arg) : arg.toString()
        argToEscape = argToEscape.replace(/'/g, "''")
        query = query.replace('?', `'${argToEscape}'`)
    }
    return query
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
        addColorColumn()
    })
}

export const addColorColumn = async () => {
    const addColorToTiles = "ALTER TABLE tiles ADD COLUMN color TEXT";
    const addColorToRoutines = "ALTER TABLE routines ADD COLUMN color TEXT";
    const addColorToPages = "ALTER TABLE pages ADD COLUMN color TEXT";

    await db().execAsync(addColorToTiles);
    await db().execAsync(addColorToRoutines);
    await db().execAsync(addColorToPages);

    await db().execAsync(`UPDATE tiles SET color = '${colors.primary}' WHERE color IS NULL`)
    await db().execAsync(`UPDATE routines SET color = '${colors.primary}' WHERE color IS NULL`)
    await db().execAsync(`UPDATE pages SET color = '${colors.primary}' WHERE color IS NULL`)
};

export const dropDb = async () => {
    throw "geht aktuell nicht (expo update lol)"
    await _db.closeAsync()
    console.info('db dropped')
    _db = SQLite.openDatabaseSync(dbName)
}

export type ResultCallback<T> = (err: Error, res: Array<T>) => void
export type InsertCallback = (err: Error, res: SQLite.SQLiteRunResult[]) => void