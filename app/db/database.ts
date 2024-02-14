import * as SQLite from 'expo-sqlite';
import { pageRoutinesStatements, pagesStatements, routineTilesStatements, routinesStatements, tileEventsStatements, tilesStatements } from "../constants/dbStatements";
import { dbName } from "../constants/global";


const pages = pagesStatements
const routines = routinesStatements
const pageRoutines = pageRoutinesStatements
const tiles = tilesStatements
const routineTiles = routineTilesStatements
const tileEvents = tileEventsStatements

export const db = SQLite.openDatabase(dbName, '1.1')

export const initDb = () => {
    db.transaction(t => {
        t.executeSql(pages.create)
        t.executeSql(routines.create)
        t.executeSql(pageRoutines.create)
        t.executeSql(tiles.create)
        t.executeSql(routineTiles.create)
        t.executeSql(tileEvents.create)
    }, (err) => { console.log('error creating tables: ', err) }, () => console.log('success creating tables'))
}

export type ResultCallback<T> = (error: Error, result: Array<T>) => void