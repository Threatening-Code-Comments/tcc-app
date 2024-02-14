import { Query } from "expo-sqlite";
import { InsertRoutine, Routine } from "../constants/DbTypes";
import { ResultCallback, db } from "./database";
import { routinesStatements } from "../constants/dbStatements";

export const insertRoutines = (routines: Array<InsertRoutine>) => {
    console.log("insert")
    db.transaction(t => {
        routines.map(routine =>
            t.executeSql(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
        )
    })
}

export const getRoutines = (callback: ResultCallback<Routine>) => {
    db.exec(
        [{ sql: routinesStatements.findAll, args: [] }],
        true,
        (err, res) => {
            console.log("ROutines: err: ", err, "res: ", res)
            callback(err, res.flatMap(entry => entry['rows']))
        }
    )
}