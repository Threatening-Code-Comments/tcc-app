import { eq, inArray } from "drizzle-orm";
import { InsertRoutine, Routine } from "../constants/DbTypes";
import { InsertCallback, ResultCallback, db } from "./database";
import { routines } from "./schema";

export const insertRoutines = (routinesP: Array<InsertRoutine>) => {
    db()
        .insert(routines)
        .values(routinesP.map(r => ({ ...r, rootPageId: r.rootPageId })))
        .then(
            (r) => console.log("Inserted Routine:", r),
            (e) => console.log("Error inserting Routine:", e)
        )

    // db().withTransactionAsync(async () => {
    //     routinesP.map(routine =>
    //         db().runAsync(`INSERT INTO routines (name) VALUES (?)`, [routine.name])
    //     )
    // })
}

export const getRoutinesFromIdsStmt = (ids: number[]) => db().query.routines.findMany({
    where(fields, operators) { return operators.inArray(fields.id, ids) },
    with: { tiles: { with: { events: true } } }
})

export const getRoutines = (callback: ResultCallback<Routine>) => {
    db()
        .select()
        .from(routines)
        .then(
            routines => callback(null, routines),
            err => callback(err, [])
        )

    // db()
    //     .getAllAsync<Routine>(routinesStatements.findAll)
    //     .then(routines => callback(null, routines))
}

export const getRoutinesFromIds = (ids: number[], callback: ResultCallback<Routine>) => {
    if (ids.length == 0) {
        callback(null, [])
        return
    }

    db()
        .select()
        .from(routines)
        .where(inArray(routines.id, ids))
        .then(
            routines => callback(null, routines),
            err => callback(err, [])
        )

    // const query = `SELECT * 
    //         FROM routines 
    //         WHERE id IN (` + ids.map(() => "?").join(",") + ");"

    // db()
    //     .getAllAsync<Routine>(query, ids)
    //     .then(routines => callback(null, routines))
}

export const deleteRoutine = (routine: Routine, callback: InsertCallback) => {
    db()
        .delete(routines)
        .where(eq(routines.id, routine.id))
        .then(
            (r) => callback(null, [r]),
            (e) => callback(e, [])
        )

    // db()
    //     .runAsync(routinesStatements.delete, [routine.id])
    //     .then(res => callback(null, []))
}

export const updateRoutine = (routine: Routine, callback: InsertCallback) => {
    db()
        .update(routines)
        .set({ name: routine.name, color: routine.color })
        .where(eq(routines.id, routine.id))
        .then(
            (r) => callback(null, [r]),
            (e) => callback(e, [])
        )
}