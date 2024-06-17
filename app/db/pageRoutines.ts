import { InsertRoutineOnPage, RoutineOnPage } from "../constants/DbTypes";
import { db, InsertCallback, ResultCallback } from "./database";
import { routines } from "./schema";

export const getRoutinesForPage = (pageId: number, callback: ResultCallback<RoutineOnPage>) => {
    db().query.pages.findMany({
        where(fields, operators) {
            return operators.eq(fields.id, pageId)
        }, with: {
            routines: {
                with: {
                    tiles: true
                }
            }
        }
    }).then(
        res => callback(null, res[0].routines.map(r => ({ ...r, tiles: r.tiles.map(t => ({ ...t, tileId: t.id, routineId: r.id })), pageId, routineId: r.id })),),
        err => callback(err, [])
    )

    // db()
    //     .select()
    //     .from(routines)
    //     .leftJoin(pageRoutines, eq(routines.id, pageRoutines.routineId))
    //     .leftJoin(routineTiles, eq(routines.id, routineTiles.routineId))
    //     .where(and(isNotNull(pageRoutines.pageId), isNotNull(routines.id)))
    //     .then(r => callback(null, r.map(e => { return { ...e.routines, ...e.page_routines, tiles: [] } })))
    //     .catch()


    // db()
    //     .getAllAsync<RoutineOnPage>(`SELECT * FROM routines 
    //                             LEFT JOIN page_routines ON routines.id = page_routines.routineId 
    //                             WHERE page_routines.pageId = ? AND routines.id IS NOT NULL`, [pageId])
    //     .then((result) => {
    //         callback(null, result)
    //     })
    //     .catch((error) => {
    //         callback(error, [])
    //     })
}

export const insertRoutinesOnPage = (routinesP: Array<InsertRoutineOnPage>, routineCallback: InsertCallback) => {
    db()
        .insert(routines)
        .values(routinesP.map(r => ({ ...r, rootPageId: r.rootPageId })))
        .then(
            (r) => routineCallback(null, [r]),
            (e) => routineCallback(e, [])
        )

    // const intoRoutinesQuery = escapeQuery(`INSERT INTO routines (name) VALUES (?)`, routines, (r) => r.name)

    // db()
    //     .withTransactionAsync(async () => {
    //         for (let routine of routinesP) {
    //             await db().runAsync(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
    //                 .then((res) => {
    //                     db().runAsync('INSERT INTO page_routines VALUES (?, ?, ?, ?, ?, ?)', [routine.pageId, res.lastInsertRowId, routine.posX, routine.posY, routine.spanX, routine.spanY])
    //                 })
    //         }
    //     })
}