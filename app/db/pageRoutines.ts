import { Query } from "expo-sqlite";
import { InsertRoutine, InsertRoutineOnPage, Routine, RoutineOnPage } from "../constants/DbTypes";
import { ResultCallback, db } from "./database";

export const getRoutinesForPage = (pageId: number, callback: ResultCallback<RoutineOnPage>) => {
    db.exec(
        [{
            sql: `SELECT *
                    FROM routines 
                    LEFT JOIN page_routines ON routines.id = page_routines.routineId 
                    WHERE page_routines.pageId = ?`,
            args: [pageId]
        }], true,
        (err, res) => callback(err, res.flatMap(entry => entry['rows']))
    )
}

export const insertRoutineOnPage = (routines: Array<InsertRoutineOnPage>) => {
    const queries: Array<Query> = []
    routines.map(routine =>
        queries.push({ sql: `INSERT INTO routines (name) VALUES (?)`, args: [routine.name] })
    )

    db.exec(
        queries,
        false,
        (err, res) => {
            (err) ? console.log("ERROR INSERTING ROUTINE!") : ""

            const routineIds: Array<string> = res.flatMap(entry => entry['insertId'])
            queries.length = 0 //clear array 

            routineIds.map((routineId, i) => {
                //pageId, routineId, posX, posY, spanX, spanY
                const rout = routines[i]
                queries.push({
                    sql: `INSERT INTO page_routines VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [rout.pageId, routineId, rout.posX, rout.posY, rout.spanX, rout.spanY]
                })
            }
            )

            db.exec(
                queries,
                false,
                (err, res) => {

                }
            )
        }
    )
}