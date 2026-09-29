import {HS3Folder, Routine, Tile} from "@components/homescreen/types";
import {db} from "@db/database";
import {hsFolders, hsItems, routines} from "@db/schema";
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

export async function getTilesFromDb(): Promise<Tile[]> {
    const rows = await db().query.tiles.findMany({with: {events: true}})
    return rows.map(t => ({
        id: t.id,
        name: t.name,
        mode: t.mode,
        color: t.color,
        rootRoutineId: t.rootRoutineId,
        events: t.events.map(e => ({tileId: e.tileId, timestamp: e.timestamp, data: e.data})),
    }))
}

export async function getRoutinesFromDb(): Promise<Routine[]> {
    return db().select({id: routines.id, name: routines.name, color: routines.color}).from(routines)
}
