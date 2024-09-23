import { eq, inArray } from "drizzle-orm"
import { Tile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tileEvents, tiles } from "./schema"

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

export const getTilesFromIdsStmt = (ids: number[]) => db().query.tiles.findMany({
    where(fields, operators) { return operators.inArray(fields.id, ids) },
    with: { events: true }
})

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

const deleteEventsOfTile = async (tileId: number) => {
    await db().delete(tileEvents).where(eq(tileEvents.tileId, tileId))
}
export const deleteTile = (tile: Tile, callback?: InsertCallback) => {
    deleteEventsOfTile(tile.id)

    db().delete(tiles).where(eq(tiles.id, tile.id)).then(
        r => callback(null, [r]),
        e => callback(e, null)
    )
}