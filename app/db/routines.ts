import { InsertRoutine, Routine } from "../constants/DbTypes";
import { routinesStatements } from "../constants/dbStatements";
import { ResultCallback, db } from "./database";

export const insertRoutines = (routines: Array<InsertRoutine>) => {
    db().transaction(t => {
        routines.map(routine =>
            t.executeSql(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
        )
    })
}

export const getRoutines = (callback: ResultCallback<Routine>) => {
    db().exec(
        [{ sql: routinesStatements.findAll, args: [] }],
        true,
        (err, res) => {
            callback(err, res.flatMap(entry => entry['rows']))
        }
    )
}