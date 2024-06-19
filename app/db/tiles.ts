import { eq, inArray } from "drizzle-orm"
import { Tile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tiles } from "./schema"

export const getTilesFromIds = (ids: number[], callback: ResultCallback<Tile>) => {
    if (ids.length == 0) {
        callback(null, [])
        return
    }

    db().query.tiles.findMany({
        where(fields, operators) {
            return operators.inArray(fields.id, ids)
        }, with: { events: true }
    }).then(
        results => callback(null, results),
        err => callback(err, [])
    )
}

export const updateTile = (tile: Tile, callback: InsertCallback) => {
    db()
        .update(tiles)
        .set({ name: tile.name, mode: tile.mode })
        .where(eq(tiles.id, tile.id))
        .then(
            res => callback(null, [res]),
            err => callback(err, [])
        )
}