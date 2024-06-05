import { InsertRoutine, Routine } from "../constants/DbTypes";
import { routinesStatements } from "../constants/dbStatements";
import { InsertCallback, ResultCallback, db } from "./database";

export const insertRoutines = (routines: Array<InsertRoutine>) => {
    db().withTransactionAsync(async () => {
        routines.map(routine =>
            db().runAsync(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
        )
    })
}

export const getRoutines = (callback: ResultCallback<Routine>) => {
    db()
        .getAllAsync<Routine>(routinesStatements.findAll)
        .then(routines => callback(null, routines))
}

export const getRoutinesFromIds = (ids: number[], callback: ResultCallback<Routine>) => {
    const query = `SELECT * 
            FROM routines 
            WHERE id IN (` + ids.map(()=>"?").join(",") + ");"
        
    db()
        .getAllAsync<Routine>(query, ids)
        .then(routines => callback(null, routines))
}

export const deleteRoutine = (routine: Routine, callback: InsertCallback) => {
    db()
        .runAsync(routinesStatements.delete, [routine.id])
        .then(res => callback(null, []))
}

export const updateRoutine = (routine: Routine, callback: ResultCallback<Routine>) => {
    db()
        .runAsync(routinesStatements.update, [routine.name, routine.id])
        .then(res => callback(null, [routine]))
}