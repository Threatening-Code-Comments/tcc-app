import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { Tile } from "../constants/DbTypes"

export const getRoutinesWithTiles = (routineIds: Array<number | string>, callback: ResultCallback<RoutineWithTiles>) => {
    // TODO test this
    db()
        .withTransactionAsync(async () => {
            routineIds.map(async routineId => {
                const results = []
                const res = await db().getAllAsync(
                        `SELECT
                            routines.id as routineId,
                            routines.name as routineName,
                            tiles.*,
                            routine_tiles.*,
                            COUNT(tile_events.tileId) AS counter
                        FROM routines
                        LEFT JOIN tiles ON routines.id = tiles.rootRoutineId
                        LEFT JOIN routine_tiles ON routines.id = routine_tiles.routineId
                        LEFT JOIN tile_events ON tiles.id = tile_events.tileId
                        WHERE routines.id = ?
                        GROUP BY routines.id, tiles.id;`, [routineId])

                results.push(res)


                const routines: Array<RoutineWithTiles> = []

                results.map(entry => {
                    const routine: RoutineWithTiles = {
                        id: entry['routineId'],
                        name: entry['routineName'],
                        tiles: []
                    }
                    const tile: TileOfRoutine = {
                        id: entry['id'],
                        mode: entry['mode'],
                        name: entry['name'],
                        posX: entry['posX'],
                        posY: entry['posY'],
                        spanX: entry['spanX'],
                        spanY: entry['spanY'],
                        rootRoutineId: entry['routineId'],
                        routineId: entry['routineId'],
                        tileId: entry['id'],
                        counter: entry['counter']
                    };
                    const tilesToAdd = (tile.id !== null) ? [tile] : []

                    const routineInList = routines.find(rout => rout.id == routine.id)
                    if (routineInList) {
                        //the routine is already in the list, add the tile to it
                        routineInList.tiles.push(...tilesToAdd)
                    } else {
                        routines.push({
                            id: routine.id,
                            name: routine.name,
                            tiles: tilesToAdd
                        })
                    }


                })
            })
        })
}

export const insertTileIntoRoutine = (tiles: Array<InsertTileOfRoutine>, doOnFinish: InsertCallback) => {
    const results = []

    db()
        .withTransactionAsync(async () => {
            tiles.map(async tile => {

                // db().execAsync('INSERT INTO tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);', [tile.name, tile.mode, tile.rootRoutineId])
                results.push(await db().runAsync(`INSERT INTO tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);`, [tile.name, tile.mode, tile.rootRoutineId]))
            })
        })
        .then(()=>{
            const tileIds: Array<string> = results.flatMap(entry => entry.lastChangedRowId)
            results.length = 0

            tileIds.map(async (tileId, i) => {
                const tile = tiles[i]
                results.push(await db().runAsync(`INSERT INTO routine_tiles VALUES (?, ?, ?, ?, ?, ?);`, [tileId, tile.routineId, tile.posX, tile.posY, tile.spanX, tile.spanY]))
            })

            doOnFinish(null, results)
        })
        .catch(err => doOnFinish(err, results))
}