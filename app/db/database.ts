import * as SQLite from 'expo-sqlite';
import { pageRoutinesStatements, pagesStatements, routineTilesStatements, routinesStatements, tileEventsStatements, tilesStatements } from "../constants/dbStatements";
import { dbName } from "../constants/global";


const pages = pagesStatements
const routines = routinesStatements
const pageRoutines = pageRoutinesStatements
const tiles = tilesStatements
const routineTiles = routineTilesStatements
const tileEvents = tileEventsStatements

let _db = SQLite.openDatabase(dbName, '1.1')
export const db = () => _db

export const initDb = () => {
    db().transaction(t => {
        t.executeSql(pages.create)
        t.executeSql(routines.create)
        t.executeSql(pageRoutines.create)
        t.executeSql(tiles.create)
        t.executeSql(routineTiles.create)
        t.executeSql(tileEvents.create)
    }, (err) => { console.error('error creating tables: ', err) }, () => console.info('success creating tables'))
}

export const dropDb = async () => {
    await _db.closeAsync()
    _db.deleteAsync()
    console.info('db dropped')
    _db = SQLite.openDatabase(dbName, '1.1')
}

export type ResultCallback<T> = (err: Error, res: Array<T>) => void
export type InsertCallback = (err: Error, res: (SQLite.ResultSetError | SQLite.ResultSet)[]) => void