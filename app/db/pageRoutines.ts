import { InsertRoutineOnPage, RoutineOnPage } from "../constants/DbTypes";
import { InsertCallback, ResultCallback, db } from "./database";

export const getRoutinesForPage = (pageId: number, callback: ResultCallback<RoutineOnPage>) => {
    db()
        .getAllAsync<RoutineOnPage>(`SELECT * FROM routines 
                                LEFT JOIN page_routines ON routines.id = page_routines.routineId 
                                WHERE page_routines.pageId = ? AND routines.id IS NOT NULL`, [pageId])
        .then((result) => {
            callback(null, result)
        })
        .catch((error) => {
            callback(error, [])
        })
}

export const insertRoutinesOnPage = (routines: Array<InsertRoutineOnPage>, routineCallback: InsertCallback) => {
    // const intoRoutinesQuery = escapeQuery(`INSERT INTO routines (name) VALUES (?)`, routines, (r) => r.name)

    db()
        .withTransactionAsync(async () => {
            for (let routine of routines) {
                await db().runAsync(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
                    .then((res) => {
                        db().runAsync('INSERT INTO page_routines VALUES (?, ?, ?, ?, ?, ?)', [routine.pageId, res.lastInsertRowId, routine.posX, routine.posY, routine.spanX, routine.spanY])
                    })
            }
        })
}