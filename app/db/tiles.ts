import { Tile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getTilesFromIds = (ids: number[], callback: ResultCallback<Tile>) => {
    const query = `SELECT * 
            FROM tiles 
            WHERE id IN (` + ids.map(()=>"?").join(",") + ");"
        
    db().exec(
        [{sql: query, args: ids}],
        true,
        (err, res) => callback(err, res.map(entry => entry['rows']).flat())
    )
}

export const updateTile = (tile: Tile, callback: InsertCallback) => {
    db().exec(
        [{
            sql: `UPDATE tiles
            SET name = ?, mode = ?
            WHERE id = ?;`,
            args: [tile.name, tile.mode, tile.id]
        }],
        false,
        (err, res) => {
            callback(err, res)
        }
    )
}