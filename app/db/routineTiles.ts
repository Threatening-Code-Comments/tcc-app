import { eq, inArray } from "drizzle-orm"
import { InsertTileOfRoutine, RoutineWithTiles, TileOfRoutine } from "../constants/DbTypes"
import { InsertCallback, ResultCallback, db } from "./database"
import { tiles } from "./schema"
import { SQLiteRunResult } from "expo-sqlite"

export const getRoutinesWithTiles = (routineIds: Array<number>, callback: ResultCallback<RoutineWithTiles>) => {
    if (routineIds.length == 0) {
        callback(null, [])
        return
    }

    db().query.routines.findMany({
        where(fields, operators) {
            return operators.inArray(fields.id, routineIds)
        },
        with: {
            tiles: true
        }
    }).then(
        (r) => {
            const convertTiles: (tiles: typeof r[0]['tiles']) => TileOfRoutine[] = (tiles) => tiles.map(t => ({
                id: t.id, color: t.color, mode: t.mode, name: t.name, rootRoutineId: t.rootRoutineId,
                counter: -1, posX: -1, posY: -1, spanX: -1, spanY: -1, routineId: -1, tileId: -1
            }))
            const routines: RoutineWithTiles[] = r.map(e => ({ id: e.id, name: e.name, color: e.color, tiles: convertTiles(e.tiles || []) }))
            callback(null, routines)
        },
        (e) => callback(e, [])
    )

    //     db()
    //         .select()
    //         .from(routines)
    //         .leftJoin(routineTiles, eq(routines.id, routineTiles.routineId))
    //         .leftJoin(tiles, eq(tiles.id, routineTiles.tileId))
    //         .groupBy(routines.id)
    //         .where(inArray(routines.id, routineIds))

    //     db()
    //         .select()
    //         .from(routineTiles)
    //         .fullJoin(routines, eq(routines.id, routineTiles.routineId))
    //         .leftJoin(tiles, eq(tiles.id, routineTiles.tileId))
    //         .groupBy(routines.id)
    //         .where(inArray(routines.id, routineIds))
    //         .then(r => console.log(r.map(e => e.)))


    //     // .then(
    //     //     results => callback(null, results.map(
    //     //         r => {return {
    //     //             id: r.routines.id, 
    //     //             name: r.routines.name, 
    //     //             color: r.routines.color, 
    //     //             tiles: r.tiles,
    //     //         }}
    //     //     )),
    //     //     err => callback(err, [])
    //     // )


    //     const results: Promise<unknown>[] = []
    //     // const routines: Array<RoutineWithTiles> = []

    //     // TODO test this
    //     db()
    //         .withTransactionAsync(async () => {
    //             await Promise.all(routineIds.map(async routineId => {
    //                 results.push(db().getAllAsync(
    //                     `SELECT
    //                         routines.id as routineId,
    //                         routines.name as routineName,
    //                         routines.color as routineColor,
    //                         tiles.*,
    //                         routine_tiles.*,
    //                         COUNT(tile_events.tileId) AS counter
    //                     FROM routines
    //                     LEFT JOIN tiles ON routines.id = tiles.rootRoutineId
    //                     LEFT JOIN routine_tiles ON routines.id = routine_tiles.routineId
    //                     LEFT JOIN tile_events ON tiles.id = tile_events.tileId
    //                     WHERE routines.id = ?
    //                     GROUP BY routines.id, tiles.id;`, [routineId]
    //                 ))
    //             }))

    //             await Promise.all(results).then((results) => {
    //                 results.map(async e => {
    //                     const entry = (await e)[0]

    //                     const routine: RoutineWithTiles = {
    //                         id: entry['routineId'],
    //                         name: entry['routineName'],
    //                         color: entry['routineColor'],
    //                         tiles: []
    //                     }
    //                     const tile: TileOfRoutine = {
    //                         id: entry['id'],
    //                         color: entry['color'],
    //                         mode: entry['mode'],
    //                         name: entry['name'],
    //                         posX: entry['posX'],
    //                         posY: entry['posY'],
    //                         spanX: entry['spanX'],
    //                         spanY: entry['spanY'],
    //                         rootRoutineId: entry['routineId'],
    //                         routineId: entry['routineId'],
    //                         tileId: entry['id'],
    //                         counter: entry['counter']
    //                     };
    //                     const tilesToAdd = (tile.id !== null) ? [tile] : []

    //                     const routineInList = routines.find(rout => rout.id == routine.id)
    //                     if (routineInList) {
    //                         //the routine is already in the list, add the tile to it
    //                         routineInList.tiles.push(...tilesToAdd)
    //                     } else {
    //                         routines.push({
    //                             id: routine.id,
    //                             color: routine.color,
    //                             name: routine.name,
    //                             tiles: tilesToAdd
    //                         })
    //                     }
    //                     // console.log("routine: ", routine, " | tile: ", tile, " | tilesToAdd: ", tilesToAdd)
    //                 })
    //             })
    //             // .then(() => {
    //             //     console.log("done:) : ", routines)
    //             //     callback(null, routines)
    //             // }).catch(err => callback(err, routines))
    //             // console.log("routines: ", JSON.stringify(routines, null, 3), " Ids: ", routineIds)
    //             callback(null, routines)
    //         })
}

export const insertTilesIntoRoutine = (tilesP: Array<InsertTileOfRoutine>, doOnFinish: InsertCallback) => {
    db().insert(tiles).values(tilesP).then(
        r => doOnFinish(null, [r]),
        e => doOnFinish(e, [])
    )
    // const results = []


    // db()
    //     .withTransactionAsync(async () => {
    //         Promise.all(tiles.map(async tile => {
    //             const res = await db().runAsync(`INSERT INTO tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);`, [tile.name, tile.mode, tile.rootRoutineId])
    //             results.push(res)
    //         }))
    //             .then(() => {
    //                 const tileIds = results.map(entry => entry.lastInsertRowId)

    //                 tileIds.map(async (tileId, i) => {
    //                     const tile = tiles[i]
    //                     await db().runAsync(`INSERT INTO routine_tiles VALUES (?, ?, ?, ?, ?, ?);`, [tileId, tile.routineId, tile.posX, tile.posY, tile.spanX, tile.spanY])
    //                 })

    //                 doOnFinish(null, results)
    //             })
    //     })
    //     .catch(err => doOnFinish(err, results))
}