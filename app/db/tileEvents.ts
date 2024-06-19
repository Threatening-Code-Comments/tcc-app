import { SQLiteRunResult } from "expo-sqlite"
import { TileEvent } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tileEvents } from "./schema"

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