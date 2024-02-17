import { Query, ResultSet, ResultSetError } from "expo-sqlite"
import { InsertTileOfRoutine, Routine, RoutineWithTiles, TileOfRoutine } from "../constants/DbTypes"
import { ResultCallback, db } from "./database"


export const getRoutinesWithTiles = (routineIds: Array<number | string>, callback: ResultCallback<RoutineWithTiles>) => {
    // console.log("routine id: ", routineIds)

    const queries: Array<Query> = []
    routineIds.map(routineId => queries.push(
        {
            sql: `SELECT
                    routines.id as routineId,
                    routines.name as routineName,
                    tiles.*,
                    routine_tiles.*,
                    COUNT(tile_events.tileId) as counter
                FROM routines
                LEFT JOIN tiles ON routines.id = tiles.rootRoutineId
                LEFT JOIN routine_tiles ON routines.id = routine_tiles.routineId
                LEFT JOIN tile_events ON tiles.id = tile_events.tileId
                WHERE routines.id = ?
                GROUP BY tiles.id;`, args: [routineId]
        }))

    // console.log("Queries: ", queries)

    db().exec(
        queries,
        true,
        (err, res) => {
            const values = res.flatMap(entry => entry['rows'])
            const routines: Array<RoutineWithTiles> = []

            values.map(entry => {
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

                const routineInList = routines.find(rout => rout.id == routine.id)
                if (routineInList) {
                    //the routine is already in the list, add the tile to it
                    routineInList.tiles.push(tile)
                } else {
                    routines.push({
                        id: routine.id,
                        name: routine.name,
                        tiles: [tile]
                    })
                }


            })

            callback(err, routines)
            // console.log(JSON.stringify(res, null, 2))
        }
    )
}

export type InsertTileCallback = (err: Error, res: (ResultSetError | ResultSet)[]) => void
export const insertTileIntoRoutine = (tiles: Array<InsertTileOfRoutine>, doOnFinish: InsertTileCallback) => {
    const queries: Array<Query> = []
    tiles.map(tile =>
        queries.push({
            sql: `INSERT INTO tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);`,
            // sql: `UPDATE tiles (name, mode, rootRoutineId) VALUES (?, ?, ?);`,
            args: [tile.name, tile.mode, tile.rootRoutineId]
        })
    )

    db().exec(
        queries,
        false,
        (err, res) => {
            if (err) console.log("ERROR INSERTING TILE!")
            if (err) console.log('error on insert is: ', err)
            // console.log("res for insert: ", JSON.stringify(res), ", queries: ", queries)

            const tileIds: Array<string> = res.flatMap(entry => entry['insertId'])
            queries.length = 0 //clear array 

            tileIds.map((tileId, i) => {
                // tileId, routineId, posX, posY, spanX, spanY
                const tile = tiles[i]
                queries.push({
                    sql: `INSERT INTO routine_tiles VALUES (?, ?, ?, ?, ?, ?);`,
                    args: [tileId, tile.routineId, tile.posX, tile.posY, tile.spanX, tile.spanY]
                })
            }
            )

            db().exec(
                queries,
                false,
                (err, res) => {
                    doOnFinish(err, res)
                }
            )
        }
    )
}