import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"

export const getRoutinesWithTiles = (routineIds: Array<number | string>, callback: ResultCallback<RoutineWithTiles>) => {
    const results: Promise<unknown>[] = []
    const routines: Array<RoutineWithTiles> = []

    // TODO test this
    db()
        .withTransactionAsync(async () => {
            await Promise.all(routineIds.map(async routineId => {
                results.push(db().getAllAsync(
                    `SELECT
                        routines.id as routineId,
                        routines.name as routineName,
                        routines.color as routineColor,
                        tiles.*,
                        routine_tiles.*,
                        COUNT(tile_events.tileId) AS counter
                    FROM routines
                    LEFT JOIN tiles ON routines.id = tiles.rootRoutineId
                    LEFT JOIN routine_tiles ON routines.id = routine_tiles.routineId
                    LEFT JOIN tile_events ON tiles.id = tile_events.tileId
                    WHERE routines.id = ?
                    GROUP BY routines.id, tiles.id;`, [routineId]
                ))
            }))

            await Promise.all(results).then((results) => {
                results.map(async e => {
                    const entry = (await e)[0]

                    const routine: RoutineWithTiles = {
                        id: entry['routineId'],
                        name: entry['routineName'],
                        color: entry['routineColor'],
                        tiles: []
                    }
                    const tile: TileOfRoutine = {
                        id: entry['id'],
                        color: entry['color'],
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
                            color: routine.color,
                            name: routine.name,
                            tiles: tilesToAdd
                        })
                    }
                    // console.log("routine: ", routine, " | tile: ", tile, " | tilesToAdd: ", tilesToAdd)
                })
            })
            // .then(() => {
            //     console.log("done:) : ", routines)
            //     callback(null, routines)
            // }).catch(err => callback(err, routines))
            // console.log("routines: ", JSON.stringify(routines, null, 3), " Ids: ", routineIds)
            callback(null, routines)
        })
}

export const insertTilesIntoRoutine = (tiles: Array<InsertTileOfRoutine>, doOnFinish: InsertCallback) => {
    const results = []

    db()
        .withTransactionAsync(async () => {
            Promise.all(tiles.map(async tile => {
                const res = await db().runAsync(`INSERT INTO tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);`, [tile.name, tile.mode, tile.rootRoutineId])
                results.push(res)
            }))
                .then(() => {
                    const tileIds = results.map(entry => entry.lastInsertRowId)

                    tileIds.map(async (tileId, i) => {
                        const tile = tiles[i]
                        await db().runAsync(`INSERT INTO routine_tiles VALUES (?, ?, ?, ?, ?, ?);`, [tileId, tile.routineId, tile.posX, tile.posY, tile.spanX, tile.spanY])
                    })

                    doOnFinish(null, results)
                })
        })
        .catch(err => doOnFinish(err, results))
}