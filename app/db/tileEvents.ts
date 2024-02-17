import { TileEvent } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const insertTileEvent = (tileId: number, timestamp: Date, data: string, callback: InsertCallback) => {
    const date = timestamp.toISOString().slice(0, 19).replace('T', ' ')

    db().exec(
        [{ sql: 'INSERT INTO tile_events (tileId, timestamp, data) VALUES (?, ?, ?)', args: [tileId, date, data] }],
        false,
        (error, result) => callback(error, result)
    )
}

export const getEventsForTiles = (tileIds: Array<number>, callback: ResultCallback<TileEvent>) => {
    db().exec(
        [{
            sql: `SELECT * 
                    FROM tile_events 
                    WHERE tileId IN (${tileIds.join(',')})`,
            args: []
        }],
        true,
        (error, result) => callback(error, result.flatMap(entry => entry['rows']))
    )
}