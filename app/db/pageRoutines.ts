import { Query } from "expo-sqlite";
import { InsertRoutineOnPage, RoutineOnPage } from "../constants/DbTypes";
import { InsertCallback, ResultCallback, db } from "./database";

export const getRoutinesForPage = (pageId: number, callback: ResultCallback<RoutineOnPage>) => {
    db().exec(
        [{
            sql: `SELECT *
                    FROM routines 
                    LEFT JOIN page_routines ON routines.id = page_routines.routineId 
                    WHERE page_routines.pageId = ? AND routines.id IS NOT NULL`,
            args: [pageId]
        }], true,
        (err, res) => callback(err, res.flatMap(entry => entry['rows']))
    )
}

export const insertRoutinesOnPage = (routines: Array<InsertRoutineOnPage>, routineCallback : InsertCallback) => {
    const queries: Array<Query> = []
    routines.map(routine =>
        queries.push({ sql: `INSERT INTO routines (name) VALUES (?)`, args: [routine.name] })
    )

    db().exec(
        queries,
        false,
        (err, res) => {
            (err) ? console.error("ERROR INSERTING ROUTINE!") : ""

            const routineIds: Array<string> = res.flatMap(entry => entry['insertId'])
            queries.length = 0 //clear array 

            routineIds.map((routineId, i) => {
                //pageId, routineId, posX, posY, spanX, spanY
                const rout = routines[i]
                queries.push({
                    sql: `INSERT INTO page_routines VALUES (?, ?, ?, ?, ?, ?)`,
                    args: [rout.pageId, routineId, rout.posX, rout.posY, rout.spanX, rout.spanY]
                })
                routineCallback(err, res)
            }
            )

            db().exec(
                queries,
                false,
                (err, res) => {
                }
            )
        }
    )
}