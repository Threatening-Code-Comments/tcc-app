import { SQLiteRunResult } from "expo-sqlite"
import { TileEvent } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tileEvents } from "./schema"
import { and, eq } from "drizzle-orm"

export const insertTileEvent = (tileId: number, timestamp: Date, data: string, callback: InsertCallback) => {
    db().insert(tileEvents).values({ timestamp, tileId, data })
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        )
}

export const getEventsForTiles = (tileIds: Array<number>, callback: ResultCallback<TileEvent>) => {
    db().query.tileEvents.findMany({
        where(fields, operators) {
            return operators.inArray(fields.tileId, tileIds)
        },
    })
        .then(
            (r) => {
                callback(null, r.map(e => { return { ...e, timestamp: new Date(e.timestamp) } }))
            },
            (e) => callback(e, [])
        )
}

export const updateTileEvent = (oldEvent: TileEvent, newEvent: TileEvent, callback: ResultCallback<SQLiteRunResult>) => {
    db().query.tileEvents.findMany({
        where(fields, operators) {
            return operators.and(
                operators.eq(fields.tileId, oldEvent.tileId),
                operators.eq(fields.timestamp, oldEvent.timestamp)
            )
        }
    }).then((r) => {
        console.log("updating tile event, new date: ", newEvent.timestamp, oldEvent.timestamp)
    })

    console.log("updating tile event, new date: ", newEvent.timestamp, "(old date: ", oldEvent.timestamp, ")")

    db().update(tileEvents)
        .set({ timestamp: newEvent.timestamp, data: newEvent.data })
        .where(
            and(
                eq(tileEvents.tileId, oldEvent.tileId),
                eq(tileEvents.timestamp, oldEvent.timestamp)
            )
        ).then(
            r => callback(null, [r]),
            e => callback(e, [])
        )
}