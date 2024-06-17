import { eq, inArray } from "drizzle-orm"
import { Tile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tiles } from "./schema"

export const getTilesFromIds = (ids: number[], callback: ResultCallback<Tile>) => {
    if (ids.length == 0) {
        callback(null, [])
        return
    }


    db()
        .select()
        .from(tiles)
        .where(inArray(tiles.id, ids))
        .then(
            results => callback(null, results),
            err => callback(err, [])
        )


    // const query = `SELECT * 
    //         FROM tiles 
    //         WHERE id IN (` + ids.map(()=>"?").join(",") + ");"

    // db()
    //     .getAllAsync<Tile>(query, ids)
    //     .then(tiles => callback(null, tiles))
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

    // db()
    //     .runAsync('UPDATE tiles SET name = ?, mode = ? WHERE id = ?', [tile.name, tile.mode, tile.id])
    //     .then(res => callback(null, [res]))
}