import {sql} from "drizzle-orm";
import {HS3Folder, Routine, Tile, TileEventStats} from "@components/homescreen/types";
import {db} from "@db/database";
import {hsFolders, hsItems, routines, tileEvents, tiles} from "@db/schema";
import {rowsToFolders} from "@homescreen/persistence/rows";

//the real homescreen repository — same signatures as db-mock, so data-source.ts can swap
//between the two. Reads only; writing back is the persistence observer's job.

export async function getFoldersFromDb(): Promise<HS3Folder[]> {
    const [folderRows, itemRows] = await Promise.all([
        db().select().from(hsFolders),
        db().select().from(hsItems),
    ])
    return rowsToFolders(folderRows, itemRows)
}

//the library without its events — those are summed up by getTileEventStatsFromDb instead
//(see TileEventStats for why they must stay out of the tiles list)
export async function getTilesFromDb(): Promise<Tile[]> {
    const rows = await db().select().from(tiles)
    return rows.map(t => ({
        id: t.id,
        name: t.name,
        mode: t.mode,
        color: t.color,
        rootRoutineId: t.rootRoutineId,
        events: [],
    }))
}

export async function getTileEventStatsFromDb(): Promise<TileEventStats> {
    const rows = await db()
        .select({
            tileId: tileEvents.tileId,
            count: sql<number>`count(*)`,
            lastAt: sql<number>`max(${tileEvents.timestamp})`,
        })
        .from(tileEvents)
        .groupBy(tileEvents.tileId)
    return new Map(rows.map(r => [r.tileId, {count: Number(r.count), lastAt: new Date(Number(r.lastAt))}]))
}

export async function getRoutinesFromDb(): Promise<Routine[]> {
    return db().select({id: routines.id, name: routines.name, color: routines.color}).from(routines)
}
