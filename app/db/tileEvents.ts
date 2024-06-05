import { TileEvent } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const insertTileEvent = (tileId: number, timestamp: Date, data: string, callback: InsertCallback) => {
    const date = timestamp.toISOString().slice(0, 19).replace('T', ' ')

    db()
        .runAsync('INSERT INTO tile_events (tileId, timestamp, data) VALUES (?, ?, ?)', [tileId, date, data])
        .then(res => callback(null, [res]))
}

export const getEventsForTiles = (tileIds: Array<number>, callback: ResultCallback<TileEvent>) => {
    db()
        .getAllAsync<TileEvent>(
            `SELECT *
            FROM tile_events
            WHERE tileId IN (${tileIds.map(() => "?").join(",")})`,tileIds)
        .then(events => callback(null, events))
}