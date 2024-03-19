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

export const deleteRoutine = (routine: Routine, callback: ResultCallback<Routine>) => {
    db().exec(
        [{ sql: routinesStatements.delete, args: [routine.id] }],
        false,
        (err, res) => {
            callback(err, res.flatMap(entry => entry['rows']))
        }
    )
}

export const updateRoutine = (routine: Routine, callback: ResultCallback<Routine>) => {
    db().exec(
        [{ sql: routinesStatements.update, args: [routine.name, routine.id] }],
        false,
        (err, res) => {
            callback(err, res.flatMap(entry => entry['rows']))
        }
    )
}