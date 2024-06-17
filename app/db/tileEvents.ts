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

    // const date = timestamp.toISOString().slice(0, 19).replace('T', ' ')

    // db()
    //     .runAsync('INSERT INTO tile_events (tileId, timestamp, data) VALUES (?, ?, ?)', [tileId, date, data])
    //     .then(res => { callback(null, (res as unknown) as SQLiteRunResult[]) })
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

    // db()
    //     .getAllAsync<TileEvent>(
    //         `SELECT *
    //         FROM tile_events
    //         WHERE tileId IN (${tileIds.map(() => "?").join(",")})`, tileIds)
    //     .then(events => {
    //         callback(null, events.map(e => { return { ...e, timestamp: new Date(e.timestamp) } }))
    //     })
    //     .catch(err => callback(err, []))
}