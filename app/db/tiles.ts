import { Tile } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getTilesFromIds = (ids: number[], callback: ResultCallback<Tile>) => {
    const query = `SELECT * 
            FROM tiles 
            WHERE id IN (` + ids.map(()=>"?").join(",") + ");"
        
    db()
        .getAllAsync<Tile>(query, ids)
        .then(tiles => callback(null, tiles))
}

export const updateTile = (tile: Tile, callback: InsertCallback) => {
    db()
        .runAsync('UPDATE tiles SET name = ?, mode = ? WHERE id = ?', [tile.name, tile.mode, tile.id])
        .then(res => callback(null, [res]))
}